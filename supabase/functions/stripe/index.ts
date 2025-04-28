
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

// Initialize Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Define cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get the request body
  let requestData;
  try {
    requestData = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  // Verify JWT token to get user ID
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Authorization header required" }),
      { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  const { action, planId } = requestData;
  
  // Handle different actions
  try {
    switch (action) {
      case "create-checkout-session": {
        // Get plan details
        const { data: plan, error: planError } = await supabase
          .from("plans")
          .select("*")
          .eq("id", planId)
          .single();

        if (planError || !plan) {
          throw new Error("Plan not found");
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          throw new Error("User profile not found");
        }

        // Create a checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          customer_email: profile.email,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `SecretLinkLocker - ${plan.name} Plan`,
                  description: plan.description,
                },
                unit_amount: Math.round(plan.price * 100), // Convert to cents
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${req.headers.get("origin")}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.headers.get("origin")}/pricing?payment=cancelled`,
          metadata: {
            userId: user.id,
            planId: planId,
          },
        });

        return new Response(
          JSON.stringify({ url: session.url }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      case "get-subscription": {
        // Get user's active subscriptions
        const { data: subscriptions, error: subscriptionError } = await stripe.subscriptions.list({
          customer: user.id, // Note: We'd need to store stripe customer ID in profiles table
          status: "active",
        });

        if (subscriptionError) {
          throw new Error("Failed to get subscription");
        }

        return new Response(
          JSON.stringify({ subscriptions }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      case "create-top-up": {
        const { amount, credits } = requestData;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "SecretLinkLocker - Credit Top-Up",
                  description: `${credits} additional link credits`,
                },
                unit_amount: amount * 100, // Convert to cents
              },
              quantity: 1,
            },
          ],
          success_url: `${req.headers.get("origin")}/dashboard?top_up=success&credits=${credits}`,
          cancel_url: `${req.headers.get("origin")}/pricing?top_up=cancelled`,
          metadata: {
            userId: user.id,
            type: "top-up",
            credits: credits.toString(),
          },
        });

        return new Response(
          JSON.stringify({ url: session.url }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
    }
  } catch (error) {
    console.error("Stripe API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
