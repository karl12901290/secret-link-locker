
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkService, CreateLinkData } from "@/services/linkService";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export const useLinks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch links query
  const {
    data: links = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5000,
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: (linkData: CreateLinkData) => LinkService.createLink(linkData),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['links'] });
        queryClient.invalidateQueries({ queryKey: ['planDetails'] });
        toast({
          title: "Link created",
          description: "Your secure link has been created successfully.",
        });
      } else {
        toast({
          title: "Error creating link",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error creating link",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: string) => LinkService.deleteLink(linkId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['links'] });
        toast({
          title: "Link deleted",
          description: "The secure link has been removed.",
        });
      } else {
        toast({
          title: "Error deleting link",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting link",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('links-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'links' 
        },
        (payload) => {
          console.log('Links table changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['links'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    links,
    isLoading,
    error,
    refetch,
    createLink: createLinkMutation.mutate,
    deleteLink: deleteLinkMutation.mutate,
    isCreating: createLinkMutation.isPending,
    isDeleting: deleteLinkMutation.isPending,
  };
};
