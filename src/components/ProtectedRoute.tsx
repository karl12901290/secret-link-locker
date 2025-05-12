import { useState, useEffect, memo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = memo(({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (!session) {
          setLoading(false);
          setHasPlan(false);
        } else {
          // Check if user has a selected plan
          const { data, error } = await supabase
            .from('profiles')
            .select('plan_id')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Error checking user plan:", error);
            setHasPlan(false);
          } else {
            setHasPlan(!!data?.plan_id);
          }
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session) {
        // Check if user has a selected plan
        const { data, error } = await supabase
          .from('profiles')
          .select('plan_id')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error checking user plan:", error);
          setHasPlan(false);
        } else {
          setHasPlan(!!data?.plan_id);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirect to auth page with return URL
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!hasPlan) {
    // Redirect to pricing page if user doesn't have a plan
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
});

export default ProtectedRoute;