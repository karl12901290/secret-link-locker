
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
  
  -- Add policy for INSERT operations
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
      'Allow authenticated users to upload files',
      'link_files',
      'auth.role() = ''authenticated''',
      'INSERT'
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Policy might already exist, continue
      NULL;
  END;
  
  -- Add policy for SELECT operations (public access)
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
      'Allow public access to files',
      'link_files',
      'true',
      'SELECT'
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Policy might already exist, continue
      NULL;
  END;
  
  -- Add policy for UPDATE operations
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
      'Allow authenticated users to update own files',
      'link_files',
      'auth.role() = ''authenticated''',
      'UPDATE'
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Policy might already exist, continue
      NULL;
  END;
  
  -- Add policy for DELETE operations
  BEGIN
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
      'Allow authenticated users to delete own files',
      'link_files',
      'auth.role() = ''authenticated''',
      'DELETE'
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Policy might already exist, continue
      NULL;
  END;
END;
$$;
