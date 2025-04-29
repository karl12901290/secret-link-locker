
import { supabase } from "@/integrations/supabase/client";

export async function createCheckoutSession(planId: string) {
  try {
    const { data, error } = await supabase.functions.invoke("coinbase", {
      body: { action: "create-checkout", planId },
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
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      return null;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.session.user.id)
      .eq("type", "subscription")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error("Error getting subscription details:", error);
    throw error;
  }
}

export async function createTopUp(amount: number, credits: number) {
  try {
    const { data, error } = await supabase.functions.invoke("coinbase", {
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
      .eq("id", session.session.user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting user plan details:", error);
    throw error;
  }
}

export async function checkCryptoPaymentStatus(code: string) {
  try {
    const { data, error } = await supabase.functions.invoke("coinbase", {
      body: { action: "check-payment-status", code },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
}
