
import { supabase } from "@/integrations/supabase/client";

export async function createCheckoutSession(planId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("stripe", {
      body: { action: "create-checkout-session", planId },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export async function getSubscriptionDetails() {
  try {
    const { data, error } = await supabase.functions.invoke("stripe", {
      body: { action: "get-subscription" },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting subscription details:", error);
    throw error;
  }
}

export async function createTopUp(amount: number, credits: number) {
  try {
    const { data, error } = await supabase.functions.invoke("stripe", {
      body: { action: "create-top-up", amount, credits },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating top-up session:", error);
    throw error;
  }
}

export async function getUserPlanDetails() {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        credits_balance,
        plan,
        billing_cycle_start,
        plans:plan_id (
          name,
          price,
          links_limit,
          max_expiration_days,
          description,
          features
        )
      `)
      .eq("id", session.session.user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting user plan details:", error);
    throw error;
  }
}
