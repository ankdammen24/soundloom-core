# Plan: Connect-baserad autentisering

Byter ut hela MSAL/Entra-stacken mot Media Rosenqvist Connect som central auth-gateway. All login går via redirect till Connect; frontend hanterar bara PKCE-codeswitch, tokenförvaring och Bearer-injektion.

## 1. Miljövariabler (.env, .env.example)

Lägg till:
```
VITE_CONNECT_BASE_URL=https://connect.mediarosenqvist.com
VITE_CONNECT_CLIENT_ID=music-catalog-frontend
VITE_CONNECT_REDIRECT_URI=https://catalogusmusicus.mediarosenqvist.com/auth/callback
VITE_CONNECT_AUDIENCE=music-catalog-core
VITE_API_BASE_URL=https://api.mediarosenqvist.com   # finns redan
```
Ta bort: `VITE_AUTH_API_URL`, `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_AUTHORITY`, `VITE_ENTRA_AUDIENCE`.

## 2. Ny auth-klient — `src/lib/connectAuth.ts`

Implementerar OAuth2 Authorization Code + PKCE mot Connect:

- `redirectToLogin(returnTo?: string)` — genererar `code_verifier` + `code_challenge` (S256), lagrar verifier + returnTo i `sessionStorage`, redirectar till
  `${CONNECT_BASE_URL}/login?client_id=...&redirect_uri=...&audience=music-catalog-core&response_type=code&code_challenge=...&code_challenge_method=S256&state=<random>`.
- `handleCallback()` — läser `code` + `state`, verifierar state, POSTar till `${CONNECT_BASE_URL}/oauth/token` med `grant_type=authorization_code`, `code_verifier`, redirect_uri, client_id. Sparar `{ access_token, refresh_token?, expires_at }` i `localStorage` (key: `connect.session`).
- `getAccessToken()` — returnerar giltig token, försöker refresh om utgången och `refresh_token` finns; annars `null`.
- `getCurrentUser()` — dekodar JWT-payload (`atob` på del 2), exponerar `{ sub, email, name, roles, permissions, scp, aud, iss, exp }`.
- `isAuthenticated()` — token finns och inte utgången.
- `logout()` — rensar storage, redirectar till `${CONNECT_BASE_URL}/logout?client_id=...&post_logout_redirect_uri=<origin>`.

Permissions läses **från JWT-claim** (`permissions[]` eller `scp` space-separerad sträng — stöd båda).

## 3. Auth-store + Provider

- Förenkla `src/lib/auth/store.ts` så `AuthUser` får `roles: string[]`, `permissions: string[]`, `claims: { aud, iss, scp, exp }`.
- Ersätt `src/lib/auth/AuthProvider.tsx`: vid mount, läs token från storage, hydrera store, registrera `setApiTokenGetter(getAccessToken)`. Lyssna inte på MSAL.
- Ersätt `src/lib/auth/useAuth.ts`: `loginRedirect → redirectToLogin`, `logoutRedirect → logout`. Inga popups.
- Ta bort `src/lib/auth/msal.ts` och `src/lib/auth/connect.ts` (gamla /auth/me-hjälparen).
- Avinstallera `@azure/msal-browser`.

## 4. Callback-route — `src/routes/auth.callback.tsx`

Skriv om: vid mount kör `await handleCallback()`, hydrera authStore, navigera till sparad `returnTo` (default `/dashboard`). Vid fel: visa tydligt felmeddelande + knapp "Försök logga in igen".

## 5. Sign-in-sida

`src/routes/sign-in.tsx`: behåll layout, men knappen kallar `redirectToLogin(search.redirect)` istället för popup. Ta bort MSAL-specifika varningar.

## 6. API-klient — `src/lib/api.ts`

Redan tokengetter-baserad. Justeringar:
- Vid 401: anropa `connectAuth.logout()`-light (rensa storage) och redirecta till `/sign-in?redirect=<current>`.
- Vid 403: kasta `ApiError` med svenskt meddelande "Du saknar behörighet för den här åtgärden."
- Vid network-fail: meddelande "Kunde inte nå musikkatalogens API."
- Behåll alla `api.*` domain-helpers oförändrade.

## 7. Permission-aware UI

Lägg till `src/lib/auth/permissions.ts`:
```ts
export function useHasPermission(p: string): boolean
export function useHasAnyPermission(ps: string[]): boolean
export const PERMISSIONS = { CATALOG_READ: "catalog.read", ARTISTS_MANAGE: "artists.manage", RELEASES_MANAGE: "releases.manage", TRACKS_UPLOAD: "tracks.upload", TRACKS_PROCESS: "tracks.process", METADATA_EDIT: "metadata.edit", USERS_MANAGE: "users.manage" }
```
Wrappa skapa/redigera/upload-knappar i `artists.tsx`, `releases.tsx`, `tracks.tsx`, `uploads.tsx` med `useHasPermission(...)`. Endast UX-skydd; backend är fortsatt sanningskällan.

## 8. User menu

I `src/components/layout/AppShell.tsx`: lägg en `DropdownMenu` i headern som visar namn/email, roles som badges, samt "Logga ut"-knapp som kallar `logout()`.

## 9. Debug-token-sidan

`src/routes/_authenticated.debug.token.tsx` uppdateras till att läsa claims via `getCurrentUser()` istället för MSAL.

## 10. Behåller

Alla katalogsidor, player, admin-vyer, R2-uppladdning — orörda förutom permission-wrappar runt action-knappar.

---

### Tekniska detaljer

- PKCE: `crypto.subtle.digest("SHA-256", verifier)` → base64url. Verifier: 64-char random från `crypto.getRandomValues`.
- JWT-decode: ren `atob` + `JSON.parse` — ingen signaturverifiering på klienten (backend gör det).
- Token-refresh: om Connect returnerar `refresh_token`, kör `grant_type=refresh_token` när token har <60s kvar.
- `sessionStorage` för PKCE-verifier + returnTo (rensas efter callback). `localStorage` för session (överlever reload).
- Inga ändringar i routeTree.gen.ts (auto-genereras).

### Sammanfattning till användaren efter implementation

Vid avslut redovisas: ändrade filer, login-flöde steg-för-steg, hur Bearer-token sätts på varje request, var permissions kollas i UI, samt vilka env-vars som måste finnas i prod.
