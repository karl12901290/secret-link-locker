
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LinkResultCardProps {
  linkId: string;
  onCreateAnother: () => void;
}

const LinkResultCard = ({ linkId, onCreateAnother }: LinkResultCardProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/l/${linkId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The secure link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          Upload Successful!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="link">Your secure link:</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="link"
              value={shareUrl}
              readOnly
              className="bg-gray-50"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={onCreateAnother} 
            variant="outline" 
            className="flex-1"
          >
            Upload Another
          </Button>
          <Button 
            asChild
            className="flex-1"
          >
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Test Link
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkResultCard;
