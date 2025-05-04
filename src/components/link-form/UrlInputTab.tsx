
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkIcon } from "lucide-react";

interface UrlInputTabProps {
  url: string;
  setUrl: (url: string) => void;
}

const UrlInputTab = ({ url, setUrl }: UrlInputTabProps) => {
  return (
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
  );
};

export default UrlInputTab;
