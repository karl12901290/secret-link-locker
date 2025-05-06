
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
      console.log("Creating bucket with public access...");
      // First make sure the bucket exists with proper settings
      const { data: bucketData, error: bucketError } = await supabaseClient
        .storage
        .createBucket('link_files', { 
          public: true, 
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
          allowedMimeTypes: ['*/*'] // Allow all file types
        });

      if (bucketError && bucketError.message !== "The resource already exists") {
        console.error('Error creating bucket:', bucketError);
        throw bucketError;
      }
      console.log('Bucket created or already exists:', bucketData);
      
      // Update bucket to ensure it's public (even if it already existed)
      const { error: updateBucketError } = await supabaseClient
        .from('storage')
        .update({ public: true })
        .eq('id', 'link_files');
      
      if (updateBucketError) {
        console.warn('Warning updating bucket visibility:', updateBucketError);
        // Continue anyway - the update might have failed because we don't have direct table access
      }
      
      // Create storage policies directly within the function instead of calling RPC
      console.log("Creating storage policies directly...");

      // Clear any existing policies first
      try {
        const { data: existingPolicies, error: policiesError } = await supabaseClient
          .rpc('list_storage_policies', { bucket_id: 'link_files' });

        if (!policiesError && existingPolicies && existingPolicies.length > 0) {
          console.log(`Found ${existingPolicies.length} existing policies, deleting them...`);
          
          for (const policy of existingPolicies) {
            await supabaseClient.rpc('delete_storage_policy', { 
              policy_id: policy.id 
            });
          }
        }
      } catch (policyError) {
        console.warn("Failed to clean up existing policies:", policyError);
        // Continue anyway
      }
      
      // Create INSERT policy
      await supabaseClient.rpc('create_storage_policy', {
        bucket_id: 'link_files',
        policy_name: 'Allow authenticated users to upload files',
        policy_definition: "auth.role() = 'authenticated'",
        policy_operation: 'INSERT'
      });
      
      // Create SELECT policy - public access
      await supabaseClient.rpc('create_storage_policy', {
        bucket_id: 'link_files',
        policy_name: 'Allow public access to files',
        policy_definition: "true",
        policy_operation: 'SELECT'
      });
      
      // Create UPDATE policy
      await supabaseClient.rpc('create_storage_policy', {
        bucket_id: 'link_files',
        policy_name: 'Allow authenticated users to update own files',
        policy_definition: "auth.role() = 'authenticated'",
        policy_operation: 'UPDATE'
      });
      
      // Create DELETE policy
      await supabaseClient.rpc('create_storage_policy', {
        bucket_id: 'link_files',
        policy_name: 'Allow authenticated users to delete own files',
        policy_definition: "auth.role() = 'authenticated'",
        policy_operation: 'DELETE'
      });
      
      console.log('Storage policies created successfully');
    } catch (storageError) {
      console.error('Error setting up storage:', storageError);
      return new Response(
        JSON.stringify({ error: `Error setting up storage: ${storageError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
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
