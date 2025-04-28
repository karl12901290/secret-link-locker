
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Upload, File, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";

interface LinkFormProps {
  onSuccess: () => void;
}

const LinkForm = ({ onSuccess }: LinkFormProps) => {
  // Form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [useExpiration, setUseExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formType, setFormType] = useState<"link" | "file">("link");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the user ID and ensure storage bucket exists when the component mounts
  useEffect(() => {
    const initializeComponent = async () => {
      // Get user session
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
        
        // Check if the secure-files bucket exists and create it if it doesn't
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'secure-files');
        
        if (!bucketExists) {
          // If bucket doesn't exist, try to create it
          try {
            const { data, error } = await supabase.storage.createBucket('secure-files', {
              public: true,
              fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
            });
            
            if (error) {
              console.error("Error creating bucket:", error);
            }
          } catch (err) {
            console.error("Failed to create storage bucket:", err);
          }
        }
      }
    };
    
    initializeComponent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    try {
      // Check if we have a user ID
      if (!userId) {
        throw new Error("User not authenticated or profile not found");
      }

      let finalUrl = url;
      let finalTitle = title;

      // Handle file upload if a file is selected
      if (formType === "file" && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        finalTitle = title || file.name;
        
        // Upload file to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('secure-files')
          .upload(`${userId}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        // Get the URL of the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('secure-files')
          .getPublicUrl(`${userId}/${fileName}`);
          
        finalUrl = publicUrl;
      }

      // First, check if the user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      
      if (profileError || !profileData) {
        // Create a profile if it doesn't exist
        const { data: userSession } = await supabase.auth.getSession();
        const userEmail = userSession?.session?.user?.email || "";
        
        const { error: insertProfileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: userId,
              email: userEmail,
              links_created: 0
            }
          ]);
        
        if (insertProfileError) throw insertProfileError;
      }

      // Now create the link
      const { data, error } = await supabase
        .from("links")
        .insert([
          {
            url: finalUrl,
            title: finalTitle || finalUrl,
            password: usePassword ? password : null,
            expiration_date: useExpiration ? new Date(expirationDate).toISOString() : null,
            user_id: userId,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success!",
        description: formType === "file" ? "Your file has been uploaded and secure link created." : "Your secure link has been created.",
      });

      // Reset form
      setUrl("");
      setTitle("");
      setPassword("");
      setUsePassword(false);
      setUseExpiration(false);
      setExpirationDate("");
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh the links list
      onSuccess();
    } catch (error: any) {
      console.error("Link creation error:", error);
      toast({
        title: "Error creating link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs 
        defaultValue="link" 
        onValueChange={(value) => setFormType(value as "link" | "file")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="link" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            <span>Protect URL</span>
          </TabsTrigger>
          <TabsTrigger value="file" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            <span>Upload File</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL to protect</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/my-file.pdf"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required={formType === "link"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title-link">Title (optional)</Label>
            <Input
              id="title-link"
              type="text"
              placeholder="My Secure Document"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="file" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File to upload</Label>
            <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-2 bg-muted/20">
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                required={formType === "file"}
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? "Change File" : "Select File"}
              </Button>
              {file && (
                <div className="text-sm font-medium mt-2 flex items-center">
                  <File className="h-4 w-4 mr-2 text-primary" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title-file">Title (optional)</Label>
            <Input
              id="title-file"
              type="text"
              placeholder="My Secure File"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="use-password" 
            checked={usePassword}
            onCheckedChange={(checked) => setUsePassword(checked === true)}
          />
          <Label htmlFor="use-password">Password protect this link</Label>
        </div>

        {usePassword && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={usePassword}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="use-expiration" 
            checked={useExpiration}
            onCheckedChange={(checked) => setUseExpiration(checked === true)}
          />
          <Label htmlFor="use-expiration">Set expiration date</Label>
        </div>

        {useExpiration && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="expiration">Expires on</Label>
            <Input
              id="expiration"
              type="datetime-local"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required={useExpiration}
            />
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2">
              <Upload className="h-4 w-4" />
            </span>
            {formType === "file" ? "Uploading..." : "Creating..."}
          </span>
        ) : (
          formType === "file" ? "Upload File & Create Link" : "Create Secure Link"
        )}
      </Button>
    </form>
  );
};

export default LinkForm;
