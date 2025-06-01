
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface CreateLinkData {
  title: string;
  url: string;
  password?: string;
  expirationDate?: Date;
  fileData?: {
    file: File;
    fileName: string;
    fileSize: number;
  };
}

export interface LinkStats {
  totalLinks: number;
  totalViews: number;
  activeLinks: number;
  expiredLinks: number;
}

export class LinkService {
  static async createLink(data: CreateLinkData): Promise<{ success: boolean; linkId?: string; error?: string }> {
    try {
      console.log("Creating link with data:", { ...data, fileData: data.fileData ? "FILE_PRESENT" : "NO_FILE" });
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("User not authenticated");
      }

      // Check user's plan and limits
      const canCreate = await this.checkLinkCreationPermission(userData.user.id);
      if (!canCreate.allowed) {
        throw new Error(canCreate.reason || "Cannot create link");
      }

      let finalUrl = data.url;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      // Handle file upload if present
      if (data.fileData) {
        const uploadResult = await this.uploadFile(data.fileData.file);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "File upload failed");
        }
        finalUrl = uploadResult.publicUrl!;
        fileName = data.fileData.fileName;
        fileSize = data.fileData.fileSize;
      }

      // Generate custom link ID
      const linkId = crypto.randomUUID();

      // Create link record - only include columns that exist in the table
      const { data: linkData, error: linkError } = await supabase
        .from("links")
        .insert([{
          id: linkId,
          title: data.title,
          url: finalUrl,
          password: data.password || null,
          expiration_date: data.expirationDate?.toISOString() || null,
          user_id: userData.user.id,
        }])
        .select()
        .single();

      if (linkError) {
        console.error("Error creating link:", linkError);
        throw new Error(linkError.message);
      }

      console.log("Link created successfully:", linkId);
      return { success: true, linkId };
    } catch (error: any) {
      console.error("LinkService.createLink error:", error);
      return { success: false, error: error.message };
    }
  }

  static async checkLinkCreationPermission(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select(`
          links_created,
          plans:plan_id (
            name,
            links_limit,
            price
          )
        `)
        .eq("id", userId)
        .single();

      if (error) {
        return { allowed: false, reason: "Could not verify plan" };
      }

      if (!profile.plans) {
        return { allowed: false, reason: "No plan selected" };
      }

      const plan = profile.plans;
      const linksCreated = profile.links_created || 0;

      // Check if user has reached their limit
      if (plan.links_limit >= 0 && linksCreated >= plan.links_limit) {
        return { 
          allowed: false, 
          reason: `You have reached your ${plan.name} plan limit of ${plan.links_limit} links` 
        };
      }

      return { allowed: true };
    } catch (error: any) {
      console.error("Error checking link creation permission:", error);
      return { allowed: false, reason: "Permission check failed" };
    }
  }

  static async uploadFile(file: File): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    try {
      console.log("Starting file upload:", file.name, file.size);

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return { success: false, error: "File size must be less than 50MB" };
      }

      // Generate unique filename
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('link_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('link_files')
        .getPublicUrl(fileName);

      console.log("File uploaded successfully:", fileName);
      return { 
        success: true, 
        publicUrl: urlData.publicUrl
      };
    } catch (error: any) {
      console.error("File upload error:", error);
      return { success: false, error: error.message };
    }
  }

  static async getLinkStats(userId: string): Promise<LinkStats> {
    try {
      const { data: links, error } = await supabase
        .from("links")
        .select("id, views, expiration_date")
        .eq("user_id", userId);

      if (error) throw error;

      const now = new Date();
      const totalLinks = links?.length || 0;
      const totalViews = links?.reduce((sum, link) => sum + (link.views || 0), 0) || 0;
      const expiredLinks = links?.filter(link => 
        link.expiration_date && new Date(link.expiration_date) < now
      ).length || 0;
      const activeLinks = totalLinks - expiredLinks;

      return {
        totalLinks,
        totalViews,
        activeLinks,
        expiredLinks
      };
    } catch (error: any) {
      console.error("Error getting link stats:", error);
      return {
        totalLinks: 0,
        totalViews: 0,
        activeLinks: 0,
        expiredLinks: 0
      };
    }
  }

  static async deleteLink(linkId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete link record
      const { error: deleteError } = await supabase
        .from("links")
        .delete()
        .eq("id", linkId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting link:", error);
      return { success: false, error: error.message };
    }
  }

  static async verifyLinkAccess(linkId: string, password?: string): Promise<{ 
    success: boolean; 
    link?: any; 
    error?: string; 
    needsPassword?: boolean;
    expired?: boolean;
  }> {
    try {
      const { data: link, error } = await supabase
        .from("links")
        .select("*")
        .eq("id", linkId)
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }

      if (!link) {
        return { success: false, error: "Link not found" };
      }

      // Check if expired
      if (link.expiration_date && new Date(link.expiration_date) < new Date()) {
        return { success: false, expired: true, error: "Link has expired" };
      }

      // Check password if required
      if (link.password) {
        if (!password) {
          return { success: false, needsPassword: true };
        }
        if (password !== link.password) {
          return { success: false, error: "Incorrect password" };
        }
      }

      return { success: true, link };
    } catch (error: any) {
      console.error("Error verifying link access:", error);
      return { success: false, error: error.message };
    }
  }

  static async incrementViews(linkId: string): Promise<void> {
    try {
      await supabase.rpc('increment_link_views', { link_id: linkId });
    } catch (error: any) {
      console.error("Error incrementing views:", error);
    }
  }
}
