
import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon } from "lucide-react";

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
    </div>
  );
};

export default FileUploadTab;
