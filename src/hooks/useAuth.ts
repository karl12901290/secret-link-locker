
import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/services/authService";

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasPlan: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPlan, setHasPlan] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          setHasPlan(false);
        } else {
          // Check if user has a selected plan
          setTimeout(async () => {
            const planCheck = await AuthService.checkUserPlan(session.user.id);
            setHasPlan(planCheck.hasPlan);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session) {
          const planCheck = await AuthService.checkUserPlan(session.user.id);
          setHasPlan(planCheck.hasPlan);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return AuthService.signIn({ email, password });
  };

  const signUp = async (email: string, password: string) => {
    return AuthService.signUp({ 
      email, 
      password, 
      redirectUrl: `${window.location.origin}/auth`
    });
  };

  const signOut = async () => {
    return AuthService.signOut();
  };

  const resendVerification = async (email: string) => {
    return AuthService.resendVerification(email);
  };

  return {
    user,
    session,
    loading,
    hasPlan,
    signIn,
    signUp,
    signOut,
    resendVerification
  };
};
