
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Lock, ExternalLink, Clock, AlertTriangle } from "lucide-react";

interface LinkData {
  id: string;
  title: string;
  url: string;
  password: string | null;
  expiration_date: string | null;
  views: number;
  file_path?: string;
}

const ViewLink = () => {
  const { id } = useParams<{ id: string }>();
  const [link, setLink] = useState<LinkData | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [expired, setExpired] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLink = async () => {
      if (!id) {
        console.error("No link ID provided");
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      try {
        console.log("Fetching link with ID:", id);
        const { data, error } = await supabase
          .from("links")
          .select("*")
          .eq("id", id)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching link:", error);
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        if (!data) {
          console.log("Link not found:", id);
          setNotFound(true);
          setLoading(false);
          return;
        }
        
        console.log("Link data retrieved:", data);
        
        setLink(data);
        
        if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
          console.log("Link expired:", data.expiration_date);
          setExpired(true);
        }
        
        if (!data.password) {
          setAuthenticated(true);
          incrementViews();
        }
      } catch (error: any) {
        console.error("Error in fetchLink:", error);
        setNotFound(true);
        toast({
          title: "Error loading link",
          description: "This link doesn't exist or has been removed.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLink();
  }, [id]);
  
  const incrementViews = async () => {
    if (!id || !link) return;
    
    try {
      console.log("Incrementing views for link:", id);
      await supabase
        .from("links")
        .update({ views: link.views + 1 })
        .eq("id", id);
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
        incrementViews();
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
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };
  
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
  
  if (notFound || !link) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Link Error</CardTitle>
            <CardDescription>
              This link doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="secondary" asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
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
            <Button variant="secondary" asChild>
              <Link to="/">Return Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
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
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Content
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewLink;
