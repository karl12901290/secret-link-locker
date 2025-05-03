
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileIcon, LinkIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LinkForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Use file name as the title if title is empty
      if (!title) {
        setTitle(selectedFile.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate based on active tab
    if (activeTab === "url" && !url) {
      toast({
        title: "URL is required",
        description: "Please enter a URL to create a secure link",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "file" && !file) {
      toast({
        title: "File is required",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!title) {
      toast({
        title: "Title is required",
        description: "Please enter a title for your link",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Check user plan first to ensure they have not reached their limit
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          links_created,
          plans:plan_id (
            links_limit
          )
        `)
        .eq("id", (await supabase.auth.getUser()).data.user?.id || '')
        .single();
      
      if (profileError) throw profileError;
      
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
      const { data: userData } = await supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", (await supabase.auth.getUser()).data.user?.id || '')
        .single();
        
      // If user has reached their plan limit but has credits, use a credit
      let useCredit = false;
      if (profileData.plans && 
          profileData.plans.links_limit >= 0 && 
          profileData.links_created >= profileData.plans.links_limit && 
          userData && userData.credits_balance > 0) {
        useCredit = true;
      }
      
      let finalUrl = url;

      // Handle file upload if in file mode
      if (activeTab === "file" && file) {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) throw new Error("User not authenticated");
        
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("link_files")
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from("link_files")
          .getPublicUrl(fileName);
          
        finalUrl = publicUrlData.publicUrl;
      }

      // Insert the new link
      const { data, error } = await supabase.from("links").insert([
        {
          url: finalUrl,
          title,
          password: password || null,
          expiration_date: expirationDate?.toISOString() || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          type: activeTab === "file" ? "file" : "url",
        },
      ]);

      if (error) throw error;
      
      // If using a credit, decrement the credit balance
      if (useCredit) {
        const { error: creditError } = await supabase
          .from("profiles")
          .update({ credits_balance: userData.credits_balance - 1 })
          .eq("id", (await supabase.auth.getUser()).data.user?.id || '');
          
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
      setUrl("");
      setTitle("");
      setPassword("");
      setExpirationDate(null);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error creating link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Tabs 
        defaultValue="url" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "url" | "file")} 
        className="w-full mb-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            <LinkIcon className="mr-2 h-4 w-4" />
            Create URL Link
          </TabsTrigger>
          <TabsTrigger value="file">
            <FileIcon className="mr-2 h-4 w-4" />
            Upload File
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="mt-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              type="url"
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="file" className="mt-4">
          <div>
            <Label htmlFor="file">File</Label>
            <Input
              ref={fileInputRef}
              type="file"
              id="file"
              onChange={handleFileChange}
              className="mt-1"
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          id="title"
          placeholder="My Secure Link"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password (optional)</Label>
        <Input
          type="password"
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <div>
        <Label>Expiration Date (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-1",
                !expirationDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expirationDate}
              onSelect={setExpirationDate}
              disabled={(date) => date < new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Button type="submit" disabled={isLoading} className="mt-2">
        {isLoading ? "Creating..." : "Create Link"}
      </Button>
    </form>
  );
};

export default LinkForm;
