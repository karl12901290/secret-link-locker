
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.14.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if bucket exists, if not create it
    const { data: buckets, error: listError } = await supabaseAdmin
      .storage
      .listBuckets()

    if (listError) {
      throw listError
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'link_files')

    if (!bucketExists) {
      const { error: createError } = await supabaseAdmin
        .storage
        .createBucket('link_files', {
          public: true,
          fileSizeLimit: 50 * 1024 * 1024, // 50MB
        })

      if (createError) {
        throw createError
      }

      console.log('Created bucket: link_files')
    } else {
      console.log('Bucket already exists: link_files')
    }

    // SQL query to call the setup_storage_policies function
    const { error: fnError } = await supabaseAdmin.rpc('setup_storage_policies')
    if (fnError) {
      throw fnError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage bucket and policies initialized successfully',
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error initializing storage:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    )
  }
})
