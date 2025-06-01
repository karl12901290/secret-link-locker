
import React, { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

const NotificationSystem: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Listen for link expiration notifications
    const checkExpiredLinks = async () => {
      const { data: links, error } = await supabase
        .from('links')
        .select('id, title, expiration_date')
        .eq('user_id', user.id)
        .not('expiration_date', 'is', null);

      if (error) return;

      const now = new Date();
      const soonToExpire = links?.filter(link => {
        const expirationDate = new Date(link.expiration_date!);
        const diffHours = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24; // Expiring within 24 hours
      });

      soonToExpire?.forEach(link => {
        toast({
          title: "Link expiring soon",
          description: `"${link.title}" will expire within 24 hours`,
          variant: "default",
        });
      });
    };

    // Check on mount and then every hour
    checkExpiredLinks();
    const interval = setInterval(checkExpiredLinks, 60 * 60 * 1000);

    // Listen for real-time plan changes
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.plan_id !== payload.old.plan_id) {
            toast({
              title: "Plan updated",
              description: "Your subscription plan has been successfully updated",
              variant: "default",
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return null; // This component doesn't render anything
};

export default NotificationSystem;
