## Mål
Härda auth-flödet i soundloom-core, lägg till administrerbara API-nycklar med server-side-validering, audit-loggning, och RLS-policyer — utan att förstöra musikkatalog/upload-flödena.

## Nuläge (snabbinventering)
- Roller finns redan: `app_role` enum med `admin | editor | artist | viewer`, `user_roles`-tabell, `has_role()` security definer-funktion.
- `api_keys`-tabell finns men saknar `scopes`, `expires_at`, `key_hash`-validering, `created_by_email`, m.m. UI är read-only stub.
- `audit_logs`-tabell finns men inga inserts sker idag och ingen RLS för append-only.
- `/admin/users` finns och är admin-skyddad via `requireRole`.
- Auth: e-post + Google OAuth via Lovable broker fungerar. Roll `api_client` saknas.

## Förändringar

### 1. Databas (en migration)
- Lägg till `api_client` i `app_role` enum.
- Utöka `api_keys`:
  - `scopes text[] not null default '{}'`
  - `expires_at timestamptz`
  - `environment text not null default 'live'` (live | test)
  - `created_by_email text` (snapshot för audit)
- RLS för `api_keys`: behåll "admin all", lägg explicit DENY på `key_hash` via en VIEW `api_keys_public` (id, name, prefix, scopes, env, created_at, last_used_at, expires_at, revoked_at) och låt UI läsa från VIEW:n.
- `audit_logs`:
  - RLS: editors/admin SELECT (finns), endast service_role INSERT (append-only — ingen UPDATE/DELETE-policy = nekas).
  - Lägg till index på `(created_at desc)` och `(actor_id)`.
- Skapa SECURITY DEFINER-RPC:er som körs från server-fn med service role:
  - `validate_api_key(_hash text, _required_scope text)` → returnerar `{ key_id, scopes, ok, reason }` och uppdaterar `last_used_at`.
  - `log_audit(_action text, _entity_type text, _entity_id uuid, _actor uuid, _metadata jsonb)`.

### 2. Server-side (createServerFn)
Ny fil `src/lib/api-keys.functions.ts`:
- `listApiKeys()` (admin) — läser `api_keys_public`.
- `createApiKey({ name, environment, scopes, expires_at })` (admin)
  - Genererar `mrq_{live|test}_<32 base62>`.
  - Sparar SHA-256-hash + prefix (`mrq_live_xxxxxxxx`).
  - Returnerar plaintext **en gång**.
  - Loggar `api_key.created`.
- `revokeApiKey({ id })` (admin) — sätter `revoked_at`, loggar `api_key.revoked`.

Ny fil `src/lib/audit.functions.ts`:
- `listAuditLogs({ limit, action?, actor? })` (admin/editor).
- Intern helper `writeAudit(...)` (server-side, anropad från andra server-fn).

Audit-events från klienten:
- `login.success`, `login.failed`, `logout`, `role.changed`, `access.denied` — skickas via `recordAuthEvent` server-fn anropad från `AuthProvider` `onAuthStateChange`.

### 3. Publik API-route för nyckelvalidering
`src/routes/api/public/v1/$.tsx` (eller specifika endpoints senare). För nu en demo-endpoint:
- `src/routes/api/public/v1/whoami.ts` — läser `Authorization: Bearer mrq_...` eller `X-API-Key`, hashar, anropar `validate_api_key` RPC, kollar scope `catalog:read`, returnerar `{ key_id, scopes }`. Skriver audit-rad vid 401/403.

### 4. Frontend
- **Ny route** `src/routes/_authenticated.admin.api-keys.tsx` (admin-only, ersätter gamla `/api-keys`):
  - Tabell: namn, prefix, env-badge, scopes, status (active/expired/revoked), created, last used, expires.
  - "Create key"-modal: namn, env (live/test), scopes (checkbox: `catalog:read|write`, `files:read|write`, `admin`), expiry (optional date).
  - Efter create: dialog som visar plaintext-nyckeln en gång med copy-knapp + tydlig varning.
  - Revoke-knapp med bekräftelse.
- **Ny route** `src/routes/_authenticated.admin.audit.tsx` (admin/editor): tabell över audit_logs med enkla filter (action, actor).
- **AppShell**-sidnav: under "Admin"-sektion → Users, API Keys, Audit Logs (synliga endast för admin).
- **Förbättrade forbidden-states**: när `requireRole` nekar → redirect till `/forbidden` med tydligt meddelande (ny enkel route) i stället för silent `/dashboard`-redirect.
- Ta bort gamla `_authenticated.api-keys.tsx` (eller redirect → `/admin/api-keys`).

### 5. Auth hardening detaljer
- `AuthProvider`: vid `SIGNED_IN` / `SIGNED_OUT` / `TOKEN_REFRESHED` → fire-and-forget `recordAuthEvent` server-fn.
- `requireRole` guard: vid nekad → kasta redirect till `/forbidden` + logga `access.denied` (best effort).
- Behåll Google OAuth via Lovable broker, behåll email+password.

### 6. README
Lägg till en "Verifiering" sektion med checklistan från specen (admin kan/icke-admin kan inte, plaintext visas en gång, revoke fungerar, denied loggas).

## Det jag INTE rör
- Existerande upload-flöde, R2-integration, releases/tracks/artists-routes, befintliga RLS-policyer för katalogtabeller.
- `src/integrations/supabase/*` autogenerade filer.
- Edge functions (vi använder TanStack server-fn enligt projektets standard).

## Tekniska detaljer

### Nyckelgenerering
```ts
const raw = `mrq_${env}_${base62(crypto.getRandomValues(new Uint8Array(24)))}`;
const hash = sha256hex(raw);
const prefix = raw.slice(0, 16); // "mrq_live_xxxxxxx"
```

### Validering (server)
1. Plocka token från `Authorization: Bearer …` eller `X-API-Key`.
2. SHA-256-hash.
3. Anropa `validate_api_key(hash, scope)` (SECURITY DEFINER) som:
   - SELECT på `key_hash`, kollar `revoked_at IS NULL`, `expires_at IS NULL OR expires_at > now()`, `required_scope = ANY(scopes) OR 'admin' = ANY(scopes)`.
   - UPDATE `last_used_at = now()`.
   - Returnerar resultat.
4. Vid fel → 401/403 + `log_audit('api_key.denied', ...)`.

### Filer som skapas/ändras
- `supabase/migrations/<ts>_auth_hardening.sql` (ny)
- `src/lib/api-keys.functions.ts` (ny)
- `src/lib/audit.functions.ts` (ny)
- `src/lib/auth/events.functions.ts` (ny – recordAuthEvent)
- `src/routes/api/public/v1/whoami.ts` (ny)
- `src/routes/_authenticated.admin.api-keys.tsx` (ny)
- `src/routes/_authenticated.admin.audit.tsx` (ny)
- `src/routes/forbidden.tsx` (ny)
- `src/routes/_authenticated.api-keys.tsx` (tas bort eller blir redirect)
- `src/lib/auth/guards.ts` (uppdatera till `/forbidden`)
- `src/lib/auth/AuthProvider.tsx` (hook in audit events)
- `src/components/layout/AppShell.tsx` (ny admin-nav)
- `README.md` (verifieringssektion)

## Leverans i ordning
1. Migration (godkänns av dig innan vi rör koden).
2. Server-fn + RPC.
3. Public API-endpoint för nyckelvalidering.
4. Admin UI (API Keys + Audit).
5. Auth-event-loggning + `/forbidden`.
6. README + manuell test.

Säg till om något ska skäras, läggas till eller prioriteras annorlunda — annars kör jag igång med migrationen som första steg.