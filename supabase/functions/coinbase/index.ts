
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";

// Define cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const COINBASE_API_KEY = Deno.env.get("COINBASE_COMMERCE_API_KEY") || "";
const COINBASE_API_URL = "https://api.commerce.coinbase.com";

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

  const { action, planId, amount, credits } = requestData;
  
  // Handle different actions
  try {
    switch (action) {
      case "create-checkout": {
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

        // Create a checkout with Coinbase Commerce
        const response = await fetch(`${COINBASE_API_URL}/charges`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CC-Api-Key": COINBASE_API_KEY,
            "X-CC-Version": "2018-03-22"
          },
          body: JSON.stringify({
            name: `SecretLinkLocker - ${plan.name} Plan`,
            description: plan.description,
            pricing_type: "fixed_price",
            local_price: {
              amount: plan.price.toString(),
              currency: "USD"
            },
            metadata: {
              userId: user.id,
              planId: planId,
              type: "subscription"
            },
            redirect_url: `${req.headers.get("origin")}/dashboard?payment=success`,
            cancel_url: `${req.headers.get("origin")}/pricing?payment=cancelled`
          })
        });

        const chargeData = await response.json();
        
        if (!response.ok) {
          throw new Error(`Coinbase Commerce API error: ${JSON.stringify(chargeData)}`);
        }

        return new Response(
          JSON.stringify({ 
            url: chargeData.data.hosted_url,
            code: chargeData.data.code
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      case "create-top-up": {
        if (!amount || !credits) {
          throw new Error("Amount and credits are required");
        }

        // Create a Coinbase Commerce charge for top-up credits
        const response = await fetch(`${COINBASE_API_URL}/charges`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CC-Api-Key": COINBASE_API_KEY,
            "X-CC-Version": "2018-03-22"
          },
          body: JSON.stringify({
            name: "SecretLinkLocker - Credit Top-Up",
            description: `${credits} additional link credits`,
            pricing_type: "fixed_price",
            local_price: {
              amount: amount.toString(),
              currency: "USD"
            },
            metadata: {
              userId: user.id,
              type: "top-up",
              credits: credits.toString()
            },
            redirect_url: `${req.headers.get("origin")}/dashboard?top_up=success&credits=${credits}`,
            cancel_url: `${req.headers.get("origin")}/pricing?top_up=cancelled`
          })
        });

        const chargeData = await response.json();
        
        if (!response.ok) {
          throw new Error(`Coinbase Commerce API error: ${JSON.stringify(chargeData)}`);
        }

        return new Response(
          JSON.stringify({ 
            url: chargeData.data.hosted_url,
            code: chargeData.data.code
          }),
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
    console.error("Coinbase Commerce API error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
