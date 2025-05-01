
import { useState, useEffect, memo } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = memo(({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(true); // Default to true

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // Check if user has a selected plan
      if (session) {
        checkUserPlan(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserPlan = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_id')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // If user has no plan_id or it's null, they need to select a plan
      setHasPlan(!!data.plan_id);
      setLoading(false);
    } catch (error) {
      console.error("Error checking user plan:", error);
      setLoading(false);
    }
  };

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
    return <Navigate to="/auth" replace />;
  }

  if (!hasPlan) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
});

export default ProtectedRoute;
