
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LinkService } from "@/services/linkService";
import { useToast } from "@/components/ui/use-toast";

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
    setUploadProgress(50);

    try {
      const result = await LinkService.createLink({
        title,
        url: "", // Will be set by the service
        password: password || undefined,
        expirationDate: expirationDate || undefined,
        fileData: {
          file,
          fileName: file.name,
          fileSize: file.size
        }
      });

      setUploadProgress(100);

      if (result.success) {
        setTitle("");
        setFile(null);
        setPassword("");
        setExpirationDate(null);
        setUploadProgress(0);
        onSuccess();
      } else {
        toast({
          title: "Error uploading file",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
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
              disabled={(date) => date < new Date()}
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
