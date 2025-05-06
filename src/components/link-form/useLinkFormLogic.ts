
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UseLinkFormLogicProps {
  onSuccess: () => void;
}

export const useLinkFormLogic = ({ onSuccess }: UseLinkFormLogicProps) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateForm = () => {
    // Validate based on active tab
    if (activeTab === "url" && !url) {
      toast({
        title: "URL is required",
        description: "Please enter a URL to create a secure link",
        variant: "destructive",
      });
      return false;
    }

    if (activeTab === "file" && !file) {
      toast({
        title: "File is required",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return false;
    }

    if (!title) {
      toast({
        title: "Title is required",
        description: "Please enter a title for your link",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Check if the user is authenticated
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData.user) {
        throw new Error("You must be logged in to create links");
      }

      // Check user plan first to ensure they have not reached their limit
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          links_created,
          plans:plan_id (
            links_limit
          )
        `)
        .eq("id", userData.user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile data:", profileError);
        throw new Error("Error checking your plan details. Please try again.");
      }
      
      // Check if user has reached their limit
      if (profileData.plans && 
          profileData.plans.links_limit >= 0 && 
          profileData.links_created >= profileData.plans.links_limit) {
        toast({
          title: "Plan limit reached",
          description: "You have reached your plan's link limit. Please upgrade your plan or purchase additional credits.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // If user has credits, they can create links even if they've reached their plan limit
      const { data: userData2 } = await supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", userData.user.id)
        .single();
        
      // If user has reached their plan limit but has credits, use a credit
      let useCredit = false;
      if (profileData.plans && 
          profileData.plans.links_limit >= 0 && 
          profileData.links_created >= profileData.plans.links_limit && 
          userData2 && userData2.credits_balance > 0) {
        useCredit = true;
      }
      
      let finalUrl = url;

      // Handle file upload if in file mode
      if (activeTab === "file" && file) {
        const userId = userData.user.id;
        if (!userId) throw new Error("User not authenticated");

        // First ensure the setup-permissions function was called
        try {
          console.log("Running setup-permissions before upload");
          const { error: setupError } = await supabase.functions.invoke('setup-permissions');
          if (setupError) {
            console.warn("Warning during setup:", setupError);
            // Continue anyway - the setup might have worked partially
          }
        } catch (setupError) {
          console.warn("Setup permissions error:", setupError);
          // Continue anyway and attempt the upload
        }
        
        // Create a safe filename with timestamp to avoid collisions
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const safeFileName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .toLowerCase();
          
        const fileName = `${userId}/${timestamp}-${safeFileName}`;
        
        toast({
          title: "Uploading file",
          description: "Your file is being uploaded...",
        });
        
        // Try the upload with a robust approach and multiple retries
        let uploadAttempts = 0;
        let uploadSuccess = false;
        let uploadData;
        let uploadError;
        
        while (uploadAttempts < 3 && !uploadSuccess) {
          uploadAttempts++;
          console.log(`Upload attempt ${uploadAttempts} for file: ${fileName}`);
          
          try {
            const result = await supabase.storage
              .from("link_files")
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true // Use upsert to overwrite if exists
              });
              
            if (result.error) {
              console.error(`Upload attempt ${uploadAttempts} failed:`, result.error);
              uploadError = result.error;
              // Wait before retrying
              if (uploadAttempts < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } else {
              uploadData = result.data;
              uploadSuccess = true;
              console.log("Upload successful on attempt", uploadAttempts);
            }
          } catch (err) {
            console.error(`Upload attempt ${uploadAttempts} threw exception:`, err);
            uploadError = err;
            // Wait before retrying
            if (uploadAttempts < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!uploadSuccess) {
          throw new Error(`File upload failed after ${uploadAttempts} attempts: ${uploadError?.message || "Unknown error"}`);
        }
        
        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from("link_files")
          .getPublicUrl(fileName);
          
        if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error("Could not get public URL for uploaded file");
        }
        
        finalUrl = publicUrlData.publicUrl;
        
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully",
        });
        
        console.log("File uploaded successfully, public URL:", finalUrl);
      }

      // Insert the new link
      const { data, error } = await supabase.from("links").insert([
        {
          url: finalUrl,
          title,
          password: password || null,
          expiration_date: expirationDate?.toISOString() || null,
          user_id: userData.user.id,
        },
      ]).select();

      if (error) {
        console.error("Link insertion error:", error);
        throw new Error(`Error creating link: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error("Link was not created");
      }
      
      // If using a credit, decrement the credit balance
      if (useCredit) {
        const { error: creditError } = await supabase
          .from("profiles")
          .update({ credits_balance: userData2.credits_balance - 1 })
          .eq("id", userData.user.id);
          
        if (creditError) {
          console.error("Error updating credit balance:", creditError);
          // Continue even if credit update fails, as link was created
        }
      }

      toast({
        title: "Link created",
        description: "Your secure link has been created successfully",
      });
      
      // Reset form
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error("Link creation error:", error);
      toast({
        title: "Error creating link",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setPassword("");
    setExpirationDate(null);
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    url,
    setUrl,
    title,
    setTitle,
    password,
    setPassword,
    expirationDate,
    setExpirationDate,
    isLoading,
    activeTab,
    setActiveTab,
    file,
    setFile,
    fileInputRef,
    uploadProgress,
    handleSubmit,
  };
};
