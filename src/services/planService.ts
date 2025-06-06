import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  links_limit: number;
  max_expiration_days: number | null;
  allow_password: boolean;
  allow_analytics: boolean;
  features: string[];
  created_at: string;
  updated_at: string;
}

export class PlanService {
  static async getAllPlans(): Promise<{ success: boolean; plans?: Plan[]; error?: string }> {
    try {
      const { data: plans, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Transform the data to match our Plan interface
      const transformedPlans: Plan[] = (plans || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        description: plan.description,
        links_limit: plan.links_limit,
        max_expiration_days: plan.max_expiration_days,
        allow_password: plan.allow_password ?? true,
        allow_analytics: plan.allow_analytics ?? false,
        features: this.transformFeatures(plan.features),
        created_at: plan.created_at || new Date().toISOString(),
        updated_at: plan.updated_at || new Date().toISOString(),
      }));

      return { success: true, plans: transformedPlans };
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      return { success: false, error: error.message };
    }
  }

  private static transformFeatures(features: Json | null): string[] {
    if (!features) return [];
    if (Array.isArray(features)) {
      return features.filter(f => typeof f === 'string') as string[];
    }
    return [];
  }

  static async selectPlan(planId: string): Promise<{ success: boolean; error?: string; requiresPayment?: boolean; checkoutUrl?: string }> {
    try {
      // Get plan details first
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError || !plan) {
        return { success: false, error: "Plan not found" };
      }

      // If it's a free plan, update directly
      if (plan.price === 0 || plan.name.toLowerCase() === "explorer") {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
          return { success: false, error: "Not authenticated" };
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            plan: plan.name,
            plan_id: plan.id,
            billing_cycle_start: new Date().toISOString(),
          })
          .eq("id", session.session.user.id);

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        return { success: true };
      }

      // For paid plans, create checkout session
      const { createCheckoutSession } = await import("./subscription");
      const checkoutResult = await createCheckoutSession(planId);
      
      return { 
        success: true, 
        requiresPayment: true, 
        checkoutUrl: checkoutResult.url 
      };
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      return { success: false, error: error.message };
    }
  }

  static async getUserCurrentPlan(): Promise<{ success: boolean; plan?: any; usage?: any; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { success: false, error: "User not authenticated" };
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          credits_balance,
          plan,
          billing_cycle_start,
          links_created,
          plans:plan_id (
            name,
            price,
            links_limit,
            max_expiration_days,
            description,
            features
          )
        `)
        .eq("id", userData.user.id)
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      return { 
        success: true, 
        plan: profile.plans,
        usage: {
          linksCreated: profile.links_created || 0,
          creditsBalance: profile.credits_balance || 0,
          billingCycleStart: profile.billing_cycle_start
        }
      };
    } catch (error: any) {
      console.error("Error getting user plan:", error);
      return { success: false, error: error.message };
    }
  }
}
