
import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface FileUploadTabProps {
  file: File | null;
  setFile: (file: File | null) => void;
  setTitle: (title: string) => void;
  title: string;
}

const FileUploadTab = ({ file, setFile, setTitle, title }: FileUploadTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert("File size exceeds 50MB limit");
        return;
      }
      
      setFile(selectedFile);
      // Use file name as the title if title is empty
      if (!title) {
        setTitle(selectedFile.name);
      }
    }
  };
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary/50 transition-all">
        <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop your file here, or click to browse
        </p>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleBrowseClick}
          className="flex items-center"
        >
          <Upload className="mr-2 h-4 w-4" />
          Browse Files
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          id="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {file && (
        <div className="bg-secondary/50 p-3 rounded-md">
          <p className="text-sm font-medium flex items-center">
            <FileIcon className="h-4 w-4 mr-2" />
            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        </div>
      )}
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Files must be under 50MB. Uploaded files will be publicly accessible.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FileUploadTab;
