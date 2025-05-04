
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileIcon, LinkIcon } from "lucide-react";

import { useLinkFormLogic } from "./link-form/useLinkFormLogic";
import UrlInputTab from "./link-form/UrlInputTab";
import FileUploadTab from "./link-form/FileUploadTab";
import PasswordInput from "./link-form/PasswordInput";
import ExpirationDatePicker from "./link-form/ExpirationDatePicker";
import LinkFormSubmit from "./link-form/LinkFormSubmit";

interface LinkFormProps {
  onSuccess: () => void;
}

const LinkForm = ({ onSuccess }: LinkFormProps) => {
  const {
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
    handleSubmit,
  } = useLinkFormLogic({ onSuccess });

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
          <UrlInputTab url={url} setUrl={setUrl} />
        </TabsContent>
        
        <TabsContent value="file" className="mt-4">
          <FileUploadTab 
            file={file} 
            setFile={setFile} 
            setTitle={setTitle}
            title={title}
          />
        </TabsContent>
      </Tabs>
      
      <div>
        <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title</label>
        <input
          type="text"
          id="title"
          placeholder="My Secure Link"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1"
        />
      </div>
      
      <PasswordInput password={password} setPassword={setPassword} />
      
      <ExpirationDatePicker 
        expirationDate={expirationDate}
        setExpirationDate={setExpirationDate}
      />
      
      <LinkFormSubmit isLoading={isLoading} />
    </form>
  );
};

export default LinkForm;
