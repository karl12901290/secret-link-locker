
import React, { useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, AlertCircle, Upload, FileX, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface FileUploadTabProps {
  file: File | null;
  setFile: (file: File | null) => void;
  setTitle: (title: string) => void;
  title: string;
}

const FileUploadTab = ({ file, setFile, setTitle, title }: FileUploadTabProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const isValidFile = (file: File): boolean => {
    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size exceeds 50MB limit",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (!isValidFile(selectedFile)) return;
      
      setFile(selectedFile);
      // Use file name as the title if title is empty
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      }
    }
  };
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (!isValidFile(droppedFile)) return;
      
      setFile(droppedFile);
      // Use file name as the title if title is empty
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      }
    }
  }, [setFile, setTitle, title]);
  
  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`flex flex-col items-center justify-center border-2 ${dragActive ? 'border-primary' : 'border-dashed border-gray-300'} rounded-lg p-6 hover:border-primary/50 transition-all ${dragActive ? 'bg-primary/5' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {!file ? (
          <>
            <FileIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2 text-center">
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
          </>
        ) : (
          <div className="flex items-center justify-center">
            <Check className="h-8 w-8 text-green-500 mr-2" />
            <p className="text-sm font-medium">File selected</p>
          </div>
        )}
        <Input
          ref={fileInputRef}
          type="file"
          id="file"
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
      </div>
      
      {file && (
        <div className="bg-secondary/50 p-4 rounded-md flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <FileIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <div className="truncate">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={removeFile} 
            className="ml-2 flex-shrink-0" 
            title="Remove file"
          >
            <FileX className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <Alert variant="default">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription className="text-xs">
          Files must be under 50MB. Uploaded files will be publicly accessible.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FileUploadTab;
