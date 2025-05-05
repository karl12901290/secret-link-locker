
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import LinkForm from "@/components/LinkForm";
import LinkList from "@/components/LinkList";
import PlanInfo from "@/components/PlanInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize buckets and setup permissions
  useEffect(() => {
    const setupPermissions = async () => {
      try {
        // Check if user is authenticated first
        const { data: userData, error: authError } = await supabase.auth.getUser();
        if (authError || !userData.user) {
          console.log('User not authenticated yet, skipping setup');
          return;
        }

        // Call setup-permissions edge function to set up storage and RLS policies
        const { data, error } = await supabase.functions.invoke('setup-permissions');
        
        if (error) {
          console.error('Error setting up permissions:', error);
          toast({
            title: "Setup Error",
            description: "There was a problem setting up permissions. Please try again.",
            variant: "destructive"
          });
        } else {
          console.log('Storage and permissions setup completed successfully:', data);
          setSetupComplete(true);
          toast({
            title: "Setup Complete",
            description: "Storage and permissions setup completed successfully.",
          });
        }
      } catch (error) {
        console.error('Error initializing storage and permissions:', error);
        toast({
          title: "Setup Error",
          description: "There was a problem setting up permissions. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    setupPermissions();
  }, [toast]);
  
  // Use React Query for data fetching with caching
  const { data: links = [], isLoading, refetch } = useQuery({
    queryKey: ['links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching links:", error);
        throw error;
      }
      return data || [];
    },
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  // Set up real-time subscription to both links table and profiles table
  useEffect(() => {
    // Create channel for links changes
    const linksChannel = supabase
      .channel('links-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'links' 
        },
        (payload) => {
          console.log('Links table changed:', payload);
          refetch();
        }
      )
      .subscribe();
      
    // Create channel for profiles changes (to update plan info)
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        },
        (payload) => {
          console.log('Profiles table changed:', payload);
          // Invalidate plan details query to refresh plan info
          queryClient.invalidateQueries({ queryKey: ['planDetails'] });
        }
      )
      .subscribe();

    return () => {
      // Clean up subscriptions when component unmounts
      supabase.removeChannel(linksChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [refetch, queryClient]);

  const handleSignOut = useCallback(async () => {
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
  }, [toast]);

  const handleLinkSuccess = useCallback(() => {
    setDialogOpen(false);
    toast({
      title: "Link created",
      description: "Your secure link has been created successfully.",
    });
    refetch();
    // Also invalidate plan details to update usage count
    queryClient.invalidateQueries({ queryKey: ['planDetails'] });
  }, [toast, refetch, queryClient]);
  
  const handleLinkDelete = useCallback(() => {
    refetch();
    // Note: We don't invalidate plan details here since deletion no longer affects usage count
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SnapLink Dashboard</h1>
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
            <LinkList links={links} loading={isLoading} onDelete={handleLinkDelete} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
