
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// This endpoint needs to be public, so we'll need to verify the signature
serve(async (req) => {
  // Get the stripe signature from headers
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe signature" }), {
      status: 400,
    });
  }
  
  // Get the raw body
  const body = await req.text();
  const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  
  // Verify the event
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  console.log(`Webhook received: ${event.type}`);
  
  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        // Check if it's a subscription or top-up
        if (session.mode === "subscription") {
          const userId = session.metadata.userId;
          const planId = session.metadata.planId;
          
          // Update user profile with new plan
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              plan_id: planId,
              billing_cycle_start: new Date().toISOString()
            })
            .eq("id", userId);
            
          if (updateError) {
            console.error("Error updating user profile:", updateError);
            throw updateError;
          }
          
          // Record transaction
          await supabase
            .from("transactions")
            .insert({
              user_id: userId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              type: "subscription",
              payment_method: "stripe",
              status: "completed",
              metadata: { 
                stripe_session_id: session.id,
                plan_id: planId
              }
            });
        }
        
        // Handle top-up payments
        if (session.mode === "payment" && session.metadata.type === "top-up") {
          const userId = session.metadata.userId;
          const credits = parseInt(session.metadata.credits, 10);
          
          // Add credits to user profile
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("credits_balance")
            .eq("id", userId)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            throw profileError;
          }
          
          const currentCredits = profile.credits_balance || 0;
          
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              credits_balance: currentCredits + credits
            })
            .eq("id", userId);
            
          if (updateError) {
            console.error("Error updating user credits:", updateError);
            throw updateError;
          }
          
          // Record transaction
          await supabase
            .from("transactions")
            .insert({
              user_id: userId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              type: "top-up",
              payment_method: "stripe",
              status: "completed",
              metadata: { 
                stripe_session_id: session.id,
                credits: credits
              }
            });
        }
        
        break;
      }
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        // Update subscription status in your database
        // This would require storing subscription IDs in your database
        break;
      }
      
      // Add other events as needed
    }
    
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    return new Response(
      JSON.stringify({ error: "Error processing webhook" }),
      { status: 500 }
    );
  }
});
