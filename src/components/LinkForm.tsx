import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";

interface LinkFormProps {
  onSuccess: () => void;
}

const LinkForm = ({ onSuccess }: LinkFormProps) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [useExpiration, setUseExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current user's session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("User not authenticated");

      // Create link in database
      const { data, error } = await supabase
        .from("links")
        .insert([
          {
            url,
            title: title || url,
            password: usePassword ? password : null,
            expiration_date: useExpiration ? new Date(expirationDate).toISOString() : null,
            user_id: session.user.id,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your secure link has been created.",
      });

      // Reset form
      setUrl("");
      setTitle("");
      setPassword("");
      setUsePassword(false);
      setUseExpiration(false);
      setExpirationDate("");

      // Refresh the links list
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error creating link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="url">URL to protect</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/my-file.pdf"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          type="text"
          placeholder="My Secure Document"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

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
            Creating...
          </span>
        ) : (
          "Create Secure Link"
        )}
      </Button>
    </form>
  );
};

export default LinkForm;
