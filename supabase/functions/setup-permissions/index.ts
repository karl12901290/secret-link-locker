
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Set up storage bucket and policies
    try {
      // Create bucket if it doesn't exist
      const { error: bucketError } = await supabaseClient
        .storage
        .createBucket('link_files', { 
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        });

      if (bucketError && bucketError.message !== "The resource already exists") {
        console.error('Error creating bucket:', bucketError);
        return new Response(
          JSON.stringify({ error: bucketError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      console.log('Bucket created or already exists');
      
      // Set up storage policies
      const { error: storageError } = await supabaseClient.rpc('setup_storage_policies');
      
      if (storageError) {
        console.error('Error setting storage policies:', storageError);
        // Continue even if there was an error setting storage policies
      } else {
        console.log('Storage policies set up successfully');
      }
    } catch (storageError) {
      console.error('Error setting up storage:', storageError);
    }

    // 2. Set up RLS policies for the links table
    try {
      const { error } = await supabaseClient.rpc('setup_rls_policies');
      
      if (error) {
        console.error('Error setting up RLS policies:', error);
        throw error;
      }
      
      console.log('RLS policies setup completed successfully');
    } catch (error) {
      console.error('Error setting up RLS policies:', error);
      return new Response(
        JSON.stringify({ error: "Failed to set up RLS policies" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Setup completed successfully',
        bucket: 'link_files', 
        rls: 'policies applied'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
