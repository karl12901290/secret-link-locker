
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import LinkForm from "@/components/LinkForm";
import LinkList from "@/components/LinkList";
import PlanInfo from "@/components/PlanInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching links",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription to links table
  useEffect(() => {
    fetchLinks();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('links-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'links' 
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Add new link to state
            setLinks(current => [payload.new, ...current]);
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted link from state
            setLinks(current => current.filter(link => link.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            // Update link in state
            setLinks(current => 
              current.map(link => 
                link.id === payload.new.id ? payload.new : link
              )
            );
          }
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLinkSuccess = () => {
    setDialogOpen(false);
    toast({
      title: "Link created",
      description: "Your secure link has been created successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SecretLinkLocker Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        <div className="mb-8">
          <PlanInfo />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Your Links</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create a Secure Link</DialogTitle>
                <DialogDescription>
                  Upload a file or protect a URL with our secure link service.
                </DialogDescription>
              </DialogHeader>
              <LinkForm onSuccess={handleLinkSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Secure Links</CardTitle>
            <CardDescription>
              Manage and monitor all your secure links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkList links={links} loading={loading} onDelete={() => {}} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
