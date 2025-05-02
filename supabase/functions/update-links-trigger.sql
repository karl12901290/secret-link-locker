
-- This is a SQL migration file that will be executed when you run it from the UI
CREATE OR REPLACE FUNCTION public.update_links_created()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET links_created = links_created + 1
        WHERE id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- We still decrement the counter when a link is deleted
        -- but the plan and trial status remain unchanged
        UPDATE profiles
        SET links_created = links_created - 1
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$function$;

-- Make sure the trigger exists (if not, create it)
DROP TRIGGER IF EXISTS update_links_created_trigger ON public.links;
CREATE TRIGGER update_links_created_trigger
AFTER INSERT ON public.links
FOR EACH ROW
EXECUTE FUNCTION public.update_links_created();
