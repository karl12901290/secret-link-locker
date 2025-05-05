
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
        
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        
        // Add toast notification for upload start
        toast({
          title: "Uploading file",
          description: "Your file is being uploaded...",
        });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("link_files")
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error("File upload error:", uploadError);
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }
        
        if (!uploadData) {
          throw new Error("File upload failed with no error message");
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
