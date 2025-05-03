
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import LinkForm from "@/components/LinkForm";
import LinkList from "@/components/LinkList";
import PlanInfo from "@/components/PlanInfo";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Plus, LogOut, ChevronRight, Lock } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "@/components/ui/motion";

const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const { data: links = [], isLoading, refetch } = useQuery({
    queryKey: ['links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
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
        () => {
          // Refetch data when links changes happen
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
        () => {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Lock className="text-primary-foreground h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 dark:from-indigo-400 dark:to-blue-300">
              SecretLinkLocker
            </h1>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleSignOut}
            className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-all duration-300"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <PlanInfo />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-between items-center mb-6"
        >
          <h2 className="text-2xl font-bold">Manage Your Links</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="group transition-all duration-300 hover:shadow-md"
              >
                <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] dark:border-gray-700">
              <DialogHeader>
                <DialogTitle>Create a Secure Link</DialogTitle>
                <DialogDescription>
                  Upload a file or protect a URL with our secure link service.
                </DialogDescription>
              </DialogHeader>
              <LinkForm onSuccess={handleLinkSuccess} />
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="overflow-hidden border-none shadow-lg dark:bg-gray-800/50 dark:backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50/70 to-gray-100/70 dark:from-gray-800/70 dark:to-gray-900/70 backdrop-blur-sm border-b">
              <CardTitle className="flex items-center">
                Your Secure Links
                <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <CardDescription>
                Manage and monitor all your secure links
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <LinkList links={links} loading={isLoading} onDelete={handleLinkDelete} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
