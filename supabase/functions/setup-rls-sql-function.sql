
CREATE OR REPLACE FUNCTION public.setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, ensure the bucket exists
  BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('link_files', 'link_files', true)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Bucket might already exist, continue
      NULL;
  END;

  -- Clear existing policies for the bucket to avoid conflicts
  BEGIN
    DELETE FROM storage.policies 
    WHERE bucket_id = 'link_files';
  EXCEPTION
    WHEN OTHERS THEN
      -- If this fails, continue with creating new policies
      NULL;
  END;
  
  -- Allow any authenticated user to upload files to the link_files bucket
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES (
      'Allow authenticated users to upload files',
      'link_files',
      '(auth.role() = ''authenticated'')'
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Policy already exists, that's fine
      NULL;
  END;
  
  -- Allow files to be publicly accessible (since they're secured by unique names)
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
      'Allow public read access to files',
      'link_files',
      'true',
      'SELECT'
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Policy already exists, that's fine
      NULL;
  END;

  -- Add INSERT operation policy explicitly
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
      'Allow authenticated users to insert files',
      'link_files',
      '(auth.role() = ''authenticated'')',
      'INSERT'
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Policy already exists, that's fine
      NULL;
  END;
END;
$$;
