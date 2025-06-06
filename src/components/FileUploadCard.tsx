
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LinkService } from "@/services/linkService";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadCardProps {
  onSuccess: (linkId: string) => void;
}

const FileUploadCard = ({ onSuccess }: FileUploadCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    
    setIsLoading(true);

    try {
      const result = await LinkService.createLink({
        title: file.name,
        url: "",
        password: password || undefined,
        expirationDate: expirationDate || undefined,
        fileData: {
          file,
          fileName: file.name,
          fileSize: file.size
        }
      });

      if (result.success && result.linkId) {
        setFile(null);
        setPassword("");
        setExpirationDate(null);
        onSuccess(result.linkId);
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload & Secure Your File
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file">File</Label>
            <div className="mt-1">
              <Label 
                htmlFor="file-upload" 
                className="cursor-pointer border rounded-md border-dashed p-6 w-full flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
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
          
          <div>
            <Label htmlFor="password">Password (optional)</Label>
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
          
          <Button type="submit" disabled={isLoading || !file} className="w-full">
            {isLoading ? "Uploading..." : "Upload & Create Secure Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FileUploadCard;
