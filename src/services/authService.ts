
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasPlan: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  redirectUrl?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  static async signUp(data: SignUpData): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: data.redirectUrl || `${window.location.origin}/auth`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (authData.user && !authData.session) {
        return { 
          success: true, 
          needsVerification: true 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("SignUp error:", error);
      return { success: false, error: error.message };
    }
  }

  static async signIn(data: SignInData): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!authData.user?.email_confirmed_at) {
        return { 
          success: false, 
          needsVerification: true,
          error: "Please verify your email before signing in" 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error("SignIn error:", error);
      return { success: false, error: error.message };
    }
  }

  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      console.error("SignOut error:", error);
      return { success: false, error: error.message };
    }
  }

  static async resendVerification(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Resend verification error:", error);
      return { success: false, error: error.message };
    }
  }

  static async getCurrentUserProfile(): Promise<{ success: boolean; profile?: any; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { success: false, error: "User not authenticated" };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          plans:plan_id (
            name,
            price,
            links_limit,
            max_expiration_days,
            description,
            features
          )
        `)
        .eq('id', userData.user.id)
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      return { success: true, profile };
    } catch (error: any) {
      console.error("Error getting user profile:", error);
      return { success: false, error: error.message };
    }
  }

  static async checkUserPlan(userId: string): Promise<{ hasPlan: boolean; planId?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_id')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error checking user plan:", error);
        return { hasPlan: false };
      }
      
      return { 
        hasPlan: !!data?.plan_id, 
        planId: data?.plan_id 
      };
    } catch (error) {
      console.error("Error in checkUserPlan:", error);
      return { hasPlan: false };
    }
  }
}
