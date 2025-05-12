import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const COINBASE_WEBHOOK_SECRET = Deno.env.get("COINBASE_WEBHOOK_SECRET") || "";

// This endpoint needs to be public, so we'll need to verify the signature
serve(async (req) => {
  // Verify the webhook signature
  const signature = req.headers.get("x-cc-webhook-signature");
  
  if (!signature) {
    console.error("Missing Coinbase Commerce signature");
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 400,
    });
  }

  try {
    // Get the raw body for signature verification
    const rawBody = await req.text();
    
    // Verify the webhook signature
    const hmac = createHmac("sha256", COINBASE_WEBHOOK_SECRET);
    const signatureBuffer = new TextEncoder().encode(rawBody);
    hmac.update(signatureBuffer);
    const digest = Array.from(new Uint8Array(await hmac.digest()))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (signature !== digest) {
      console.error("Invalid Coinbase Commerce signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
      });
    }
    
    // Parse the JSON body
    const eventData = JSON.parse(rawBody);
    console.log("Webhook event received:", eventData.event.type);
    
    // Handle the event
    switch (eventData.event.type) {
      case "charge:confirmed": {
        const charge = eventData.event.data;
        const metadata = charge.metadata;
        
        if (!metadata || !metadata.userId) {
          console.error("Missing metadata or userId in webhook");
          return new Response(JSON.stringify({ error: "Invalid metadata" }), {
            status: 400,
          });
        }
        
        // Handle subscription payment
        if (metadata.type === "subscription" && metadata.planId) {
          // Update user profile with new plan
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              plan_id: metadata.planId,
              billing_cycle_start: new Date().toISOString()
            })
            .eq("id", metadata.userId);
            
          if (updateError) {
            console.error("Error updating user profile:", updateError);
            throw updateError;
          }
          
          // Record transaction
          await supabase
            .from("transactions")
            .insert({
              user_id: metadata.userId,
              amount: charge.pricing.local.amount,
              type: "subscription",
              payment_method: "crypto",
              status: "completed",
              metadata: { 
                coinbase_charge_id: charge.id,
                plan_id: metadata.planId
              }
            });
        }
        
        // Handle top-up payment
        if (metadata.type === "top-up" && metadata.credits) {
          const credits = parseInt(metadata.credits, 10);
          
          // Get current credits balance
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("credits_balance")
            .eq("id", metadata.userId)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            throw profileError;
          }
          
          const currentCredits = profile.credits_balance || 0;
          
          // Update user's credits balance
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              credits_balance: currentCredits + credits
            })
            .eq("id", metadata.userId);
            
          if (updateError) {
            console.error("Error updating user credits:", updateError);
            throw updateError;
          }
          
          // Record transaction
          await supabase
            .from("transactions")
            .insert({
              user_id: metadata.userId,
              amount: charge.pricing.local.amount,
              type: "top-up",
              payment_method: "crypto",
              status: "completed",
              metadata: { 
                coinbase_charge_id: charge.id,
                credits: credits
              }
            });
        }
        
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
