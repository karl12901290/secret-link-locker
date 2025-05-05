
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Lock, ExternalLink, Clock, AlertTriangle, FileText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LinkData {
  id: string;
  title: string;
  url: string;
  password: string | null;
  expiration_date: string | null;
  views: number;
}

const ViewLink = () => {
  const { id } = useParams<{ id: string }>();
  const [link, setLink] = useState<LinkData | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFile, setIsFile] = useState(false);

  useEffect(() => {
    const fetchLink = async () => {
      if (!id) {
        setError("Invalid link ID");
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from("links")
          .select("*")
          .eq("id", id)
          .single();
          
        if (error) {
          console.error("Error fetching link:", error);
          if (error.code === "PGRST116") {
            setError("This link doesn't exist or has been removed.");
          } else {
            setError("Error loading link. Please try again later.");
          }
          setLoading(false);
          return;
        }
        
        if (data) {
          setLink(data);
          
          // Check if URL is a file from the link_files bucket
          if (data.url && data.url.includes('link_files')) {
            setIsFile(true);
          }
          
          if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
            setExpired(true);
          }
          
          if (!data.password) {
            setAuthenticated(true);
            incrementViews(data.id);
          }
          setLoading(false);
        } else {
          setError("Link not found");
          setLoading(false);
        }
      } catch (error: any) {
        console.error("Error in fetchLink:", error);
        setError("An unexpected error occurred. Please try again later.");
        setLoading(false);
      }
    };
    
    fetchLink();
  }, [id]);
  
  const incrementViews = async (linkId: string) => {
    try {
      // Using the increment_link_views function if it exists
      const { error } = await supabase.rpc('increment_link_views', { link_id: linkId });
      
      if (error) {
        console.error("Failed to increment views using RPC:", error);
        // Fallback to direct update if RPC fails
        await supabase
          .from("links")
          .update({ views: (link?.views || 0) + 1 })
          .eq("id", linkId);
      }
    } catch (error) {
      console.error("Failed to increment views:", error);
    }
  };
  
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!link || !link.password) return;
    
    setVerifying(true);
    
    try {
      if (password === link.password) {
        setAuthenticated(true);
        incrementViews(link.id);
        toast({
          title: "Password correct",
          description: "You can now access the content."
        });
      } else {
        toast({
          title: "Incorrect password",
          description: "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while verifying the password.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
              Link Error
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="secondary" onClick={() => navigate("/")}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Display not found state
  if (!link) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Link Not Found</CardTitle>
            <CardDescription>
              This link may have been removed or doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="secondary" onClick={() => navigate("/")}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Display expired state
  if (expired) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Clock className="mr-2 h-6 w-6 text-destructive" /> 
              Link Expired
            </CardTitle>
            <CardDescription>
              This secure link has expired and is no longer available.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="secondary" onClick={() => navigate("/")}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Display password input state
  if (!authenticated && link.password) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>{link.title}</CardTitle>
            <CardDescription>
              This content is protected with a password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password to access this content"
                  required
                />
              </div>
              <Button 
                className="w-full" 
                type="submit" 
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Access Content"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Display content access state
  return (
    <div className="flex h-screen items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{link.title}</CardTitle>
          <CardDescription>
            You now have access to this content
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">Click the button below to access the content</p>
          <Button asChild size="lg">
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              {isFile ? (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  View File
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Content
                </>
              )}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewLink;
