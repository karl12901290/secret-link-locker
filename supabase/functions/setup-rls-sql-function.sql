
CREATE OR REPLACE FUNCTION public.setup_storage_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
END;
$$;
