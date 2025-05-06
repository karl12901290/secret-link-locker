
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const FileUploadForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
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
    setUploadProgress(0);

    try {
      // First check if user can upload files based on plan
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          plan,
          plans:plan_id (
            name,
            price
          )
        `)
        .eq("id", (await supabase.auth.getUser()).data.user?.id || '')
        .single();
      
      if (profileError) throw profileError;
      
      // Check if user has a paid plan that allows file uploads
      if (profileData.plans && (profileData.plans.name === "Explorer" || profileData.plans.price === 0)) {
        toast({
          title: "Plan limitation",
          description: "File uploads are only available on paid plans. Please upgrade your plan.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Upload file to Supabase Storage
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      
      console.log("Starting file upload:", fileName);
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('link_files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      // Update progress when done
      setUploadProgress(100);
      
      if (uploadError) throw uploadError;
      
      console.log("File uploaded successfully:", fileName);
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('link_files')
        .getPublicUrl(fileName);
      
      console.log("Generated public URL:", urlData.publicUrl);
      
      // Create a link record for the file
      const { data, error } = await supabase.from("links").insert([
        {
          title,
          url: urlData.publicUrl,
          password: password || null,
          expiration_date: expirationDate?.toISOString() || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          file_name: file.name,
          file_size: file.size,
          file_path: fileName,
        },
      ]);

      if (error) throw error;
      
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded and a secure link has been created",
      });
      
      setTitle("");
      setFile(null);
      setPassword("");
      setExpirationDate(null);
      setUploadProgress(0);
      onSuccess();
    } catch (error: any) {
      console.error("Error during file upload:", error);
      toast({
        title: "Error uploading file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          id="title"
          placeholder="My Secure File"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="file">File</Label>
        <div className="mt-1 flex items-center">
          <Label 
            htmlFor="file-upload" 
            className="cursor-pointer border rounded-md border-dashed p-6 w-full flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              {file ? file.name : "Click to upload or drag and drop"}
            </span>
            {file && (
              <span className="text-xs text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </Label>
          <Input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
          />
        </div>
      </div>
      
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
      
      <div>
        <Label htmlFor="password">Password Protection (optional)</Label>
        <Input
          type="password"
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      
      <div>
        <Label>Expiration Date (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
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
              disabled={(date) =>
                date < new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <Alert variant="default">
        <AlertDescription className="text-sm">
          Files are stored securely and can only be accessed through your generated link.
          {password && " Your file will be password-protected."}
          {expirationDate && ` The link will expire on ${format(expirationDate, "PPP")}.`}
        </AlertDescription>
      </Alert>
      
      <Button type="submit" disabled={isLoading || !file}>
        {isLoading ? "Uploading..." : "Upload File & Create Link"}
      </Button>
    </form>
  );
};

export default FileUploadForm;
