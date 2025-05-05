
import React, { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  return (
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
      <Alert className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Files must be under 50MB. Uploaded files will be publicly accessible.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FileUploadTab;
