## Mål

Byt ut det egenbyggda `/auth/login`-flödet mot **MSAL Browser (PKCE redirect)** direkt mot Microsoft Entra ID. Frontend hämtar access tokens (audience `api://a523e8c6-…`) och skickar dem som `Bearer` mot `api.mediarosenqvist.com`. `connect.mediarosenqvist.com` är en backend-proxy och anropas inte alls från frontend.

## Vad som ändras

### 1. Beroenden + env
- `bun add @azure/msal-browser @azure/msal-react`
- `.env` / `.env.example` får:
  - `VITE_ENTRA_CLIENT_ID=a523e8c6-0ef0-42f3-aa97-4b465bf78642`
  - `VITE_ENTRA_AUTHORITY=https://login.microsoftonline.com/500956f1-ee20-47ea-b587-22dacb5cf39c`
  - `VITE_ENTRA_AUDIENCE=api://a523e8c6-0ef0-42f3-aa97-4b465bf78642`
  - `VITE_AUTH_API_URL=https://connect.mediarosenqvist.com` (sparas, ej använd från frontend just nu)
- `VITE_SUPABASE_*` får ligga kvar (används av andra delar).

### 2. MSAL-konfiguration (ny modul `src/lib/auth/msal.ts`)
- `PublicClientApplication` med `clientId`, `authority`, `redirectUri = window.location.origin + "/auth/callback"`, `cache: { cacheLocation: "localStorage" }`.
- `loginRequest = { scopes: [VITE_ENTRA_AUDIENCE + "/.default"] }` (kan justeras om proxyn vill ha specifika scopes).
- `tokenRequest = { scopes: [...], account }` för silent refresh via `acquireTokenSilent`, fallback till `acquireTokenRedirect`.

### 3. Ersätt egen auth med MSAL
- `src/lib/auth/AuthProvider.tsx`:
  - Bootstrap kör `msal.initialize()`, `handleRedirectPromise()`, plockar första kontot, sätter store-state.
  - `setApiTokenGetter(async () => acquireTokenSilent(...).accessToken)` så `api.ts` alltid får färsk token (silent refresh sköts av MSAL).
- `src/lib/auth/store.ts`: status (`loading|authenticated|unauthenticated`), `account` (MSAL-konto → mappar till `{ id, email, name }`).
- `src/lib/auth/useAuth.ts`: `loginRedirect()`, `logoutRedirect()`, ingen `register`.
- `src/lib/auth/client.ts`: tas bort (eller töms — inga egna `/auth/*`-anrop kvar).
- `src/lib/auth/storage.ts`: tas bort (MSAL äger token-cache).
- `src/lib/auth/guards.ts`: oförändrad (kollar `store.status === "authenticated"`).

### 4. Sidor
- **`src/routes/sign-in.tsx`**: byts till en enda knapp "Sign in with Microsoft" som anropar `loginRedirect({ scopes, state: redirect })`. Email/password-fältet tas bort (Entra äger UI). Respekterar `?redirect=` via MSAL `state`.
- **`src/routes/sign-up.tsx`**: tas bort eller blir en "Contact admin"-info (Entra hanterar provisioning). Länkar i sidebaren rensas.
- **`src/routes/auth.callback.tsx`** (ny): renderar spinner; `handleRedirectPromise()` körs redan i provider, så den bara navigerar till `state.redirect` eller `/dashboard` när store går till `authenticated`.
- **`src/routes/_authenticated.profile.tsx`**: visar `account.username/name`, logout-knappen kör `logoutRedirect({ postLogoutRedirectUri: origin })`.
- **`src/components/layout/AppShell.tsx`**: byter "Sign up"-länken till bara "Sign in" + uppdaterar profil-dropdown.

### 5. API-klient
- `src/lib/api.ts` är i princip oförändrad — den tar redan en token via `setApiTokenGetter`. Vi ändrar getter-implementationen till MSAL `acquireTokenSilent` så 401 sällan inträffar.
- 401-hanteringen i `apiRequest` får en liten tweak: vid 401 → trigga `acquireTokenRedirect` (frisk login) istället för custom `/auth/refresh`.

### 6. Rensning
- Bort: `src/routes/login.tsx` (gamla stub), `client.ts`, `storage.ts`, ev. AuthDebug uppdateras till att visa MSAL-konto.
- Inga ändringar i de 20+ `_authenticated.*`-routes — guarden fungerar likadant.

## Tekniska detaljer

**MSAL-flöde**
1. Klick på "Sign in with Microsoft" → `msal.loginRedirect({ scopes, state: encodeURIComponent(redirect) })`.
2. Entra redirectar till `/auth/callback` med `code`.
3. MSAL `handleRedirectPromise()` byter code → tokens (PKCE), lagrar i localStorage.
4. Provider sätter store → guard släpper in användaren → navigerar till `state.redirect`.

**Token mot api.***
```ts
setApiTokenGetter(async () => {
  const account = msal.getAllAccounts()[0];
  if (!account) return null;
  const res = await msal.acquireTokenSilent({ scopes, account });
  return res.accessToken;
});
```

**Logout**: `msal.logoutRedirect({ account, postLogoutRedirectUri: origin })`.

## Inte med i denna runda
- RBAC / roller (kommer från `roles`-claim senare).
- Anrop mot `connect.mediarosenqvist.com` från frontend (proxyn används endast bakom api.*).
- Sign-up UI (Entra-admin provisionar).
- Password reset (Entra äger det).
