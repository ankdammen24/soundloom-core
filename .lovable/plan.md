## Problem

Entra error **AADSTS90009** = "Application is requesting a token for itself."

Det händer för att MSAL just nu begär scopet:

```
api://a523e8c6-0ef0-42f3-aa97-4b465bf78642/.default
```

…vilket är samma app som klienten själv. Entra tillåter inte `/.default` mot egen app-registrering i en SPA/PKCE-flow — det är ett klassiskt fel när man försöker använda en client-credentials-stil-scope i en delegated user-flow.

## Lösning

I en SPA mot eget API ska man exponera en **delegated scope** i app-registreringen (t.ex. `access_as_user`) och begära den explicit, inte `.default`.

### Steg 1 — Entra-portalen (du gör detta manuellt)

I app-registreringen `a523e8c6-0ef0-42f3-aa97-4b465bf78642`:

1. **Expose an API** → bekräfta Application ID URI = `api://a523e8c6-0ef0-42f3-aa97-4b465bf78642`
2. **Add a scope**:
   - Scope name: `access_as_user`
   - Who can consent: Admins and users
   - Admin/User consent display name + description: "Access Catalogus Musicus API as the signed-in user"
   - State: Enabled
3. **API permissions** → Add → My APIs → välj samma app → Delegated → `access_as_user` → Grant admin consent.
4. (Valfritt men rekommenderat) Lägg även till `openid`, `profile`, `offline_access` under Microsoft Graph delegated om de inte redan finns — krävs för id_token + refresh.

### Steg 2 — Frontend (jag ändrar detta)

I `.env` och `.env.example`: byt `VITE_ENTRA_AUDIENCE` från enbart bas-URI till att inkludera scopet, eller introducera en ny variabel `VITE_ENTRA_SCOPE`. Enklast och minst invasivt:

- Behåll `VITE_ENTRA_AUDIENCE=api://a523e8c6-0ef0-42f3-aa97-4b465bf78642`
- I `src/lib/auth/msal.ts` ändra:

  ```ts
  export const apiScopes = audience ? [`${audience}/access_as_user`] : [];
  ```

  istället för `${audience}/.default`.

- Lägg till `openid`, `profile`, `offline_access` i `buildLoginRequest` så att login-redirect ber om id_token + refresh utöver access_token:

  ```ts
  scopes: [...apiScopes, "openid", "profile", "offline_access"]
  ```

  (Eller bara `apiScopes` i `acquireTokenSilent` — OIDC-scopes hör hemma i login, inte token-refresh.)

### Steg 3 — Verifiera

Efter att Entra-ändringen är gjord och frontend-deployen ute:
1. Tom localStorage (gammal MSAL-cache kan annars hålla kvar fel scope).
2. Klicka Logga in → Microsoft-redirect ska visa samtycke för "Access Catalogus Musicus API as the signed-in user".
3. Efter callback → access_token i nätverket mot `api.mediarosenqvist.com` ska ha `aud = api://a523e8c6-...` och `scp = access_as_user`.
4. `connect.mediarosenqvist.com/auth/me` ska svara 200 med profil.

## Filer som ändras

- `.env` — kommentar/ev. ny `VITE_ENTRA_SCOPE`
- `.env.example` — samma
- `src/lib/auth/msal.ts` — `apiScopes` + login-scopes

## Frågor till dig innan jag implementerar

1. Vill du att jag använder scope-namnet **`access_as_user`** (rekommenderat, Microsofts konvention) eller har ni redan ett annat scope exponerat i app-registreringen som jag ska binda mot?
2. Bekräftar du att du kan göra Entra-portal-stegen ovan (Expose an API + Grant admin consent)? Utan steg 1 funkar inte koden — Entra svarar då med `AADSTS65001 consent_required` eller `invalid_scope`.
