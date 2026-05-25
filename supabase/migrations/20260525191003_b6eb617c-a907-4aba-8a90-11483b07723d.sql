
-- 1. Add api_client role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'api_client';

-- 2. Extend api_keys
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS scopes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS created_by_email text;

ALTER TABLE public.api_keys
  DROP CONSTRAINT IF EXISTS api_keys_environment_check;
ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_environment_check CHECK (environment IN ('live','test'));

-- 3. Public view (no key_hash exposed)
CREATE OR REPLACE VIEW public.api_keys_public
WITH (security_invoker = true) AS
SELECT id, name, prefix, scopes, environment, created_by, created_by_email,
       created_at, last_used_at, expires_at, revoked_at
FROM public.api_keys;

GRANT SELECT ON public.api_keys_public TO authenticated;

-- 4. Audit logs: allow service_role inserts (append-only; no update/delete policies)
DROP POLICY IF EXISTS "Audit: service insert" ON public.audit_logs;
CREATE POLICY "Audit: service insert"
ON public.audit_logs
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs (action);

-- 5. API key validation RPC (SECURITY DEFINER, called from server-fn via service role)
CREATE OR REPLACE FUNCTION public.validate_api_key(_hash text, _required_scope text)
RETURNS TABLE(ok boolean, key_id uuid, scopes text[], reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.api_keys%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.api_keys WHERE key_hash = _hash LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text[], 'not_found'::text;
    RETURN;
  END IF;
  IF rec.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT false, rec.id, rec.scopes, 'revoked'::text;
    RETURN;
  END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN
    RETURN QUERY SELECT false, rec.id, rec.scopes, 'expired'::text;
    RETURN;
  END IF;
  IF _required_scope IS NOT NULL
     AND NOT (_required_scope = ANY(rec.scopes) OR 'admin' = ANY(rec.scopes)) THEN
    RETURN QUERY SELECT false, rec.id, rec.scopes, 'scope_denied'::text;
    RETURN;
  END IF;
  UPDATE public.api_keys SET last_used_at = now() WHERE id = rec.id;
  RETURN QUERY SELECT true, rec.id, rec.scopes, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_api_key(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_api_key(text, text) TO service_role;

-- 6. Audit logging RPC (SECURITY DEFINER, callable by service_role)
CREATE OR REPLACE FUNCTION public.log_audit(
  _action text,
  _entity_type text,
  _entity_id uuid,
  _actor uuid,
  _metadata jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, metadata)
  VALUES (_action, _entity_type, _entity_id, _actor, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit(text, text, uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, uuid, uuid, jsonb) TO service_role;
