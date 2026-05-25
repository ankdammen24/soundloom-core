
REVOKE ALL ON FUNCTION public.validate_api_key(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_audit(text, text, uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, uuid, uuid, jsonb) TO service_role;
