# Auth-modernisering: ut med Clerk, in med egen tunn auth

## Mål

1. Ta bort all Clerk-kod och `@clerk/clerk-react` ur projektet.
2. Lägg in en egen lättviktig auth-modul som pratar med `api.mediarosenqvist.com` egna `/auth/*`-endpoints.
3. Skydda alla rutter utom `/`, `/discover`, `/status`, `/sign-in`, `/sign-up` via TanStack Routers `_authenticated`-layout.
4. Branda sign-in/sign-up så de matchar Catalogus Musicus.
5. RBAC och Organizations skippas i denna runda.

## Antaganden om backend

Vi designar mot dessa endpoints på `api.mediarosenqvist.com` (justeras lätt om de heter annat):

- `POST /auth/login` → `{ email, password }` → `{ accessToken, refreshToken?, user }`
- `POST /auth/register` → `{ email, password, displayName? }` → samma form
- `POST /auth/logout` → invaliderar refresh token (best-effort)
- `POST /auth/refresh` → `{ refreshToken }` → `{ accessToken, refreshToken? }` (om refresh stöds)
- `GET /auth/me` → returnerar aktuell user för en giltig Bearer-token

Om något av dessa inte finns: UI:t hanterar 404/501 mjukt och visar tydligt felmeddelande, så vi snabbt kan koppla in rätt path när backenden bekräftar.

## Vad som rivs

- `bun remove @clerk/clerk-react`
- `src/lib/auth.tsx` — skrivs om helt (ingen ClerkProvider, ingen `ApiTokenBridge`).
- `src/routes/sign-in.tsx`, `src/routes/sign-up.tsx`, `src/routes/profile.tsx` — Clerk-komponenterna ersätts med egna formulär.
- `src/components/layout/AppShell.tsx` — `SignedIn`/`SignedOut`/`UserButton` byts mot egen `<AuthMenu />`.
- `src/components/AuthDebug.tsx` — uppdateras att läsa från nya auth-storen.
- `my-clerk-app/`-mappen (skissprojekt) — raderas.
- `VITE_CLERK_PUBLISHABLE_KEY` rensas ur `.env` och `.env.example`.

## Ny auth-modul

```text
src/lib/auth/
  store.ts          Zustand-baserad in-memory store: { user, accessToken, status }
  storage.ts        localStorage-helpers för access/refresh-tokens (under en namespace-prefix)
  client.ts         login / register / logout / refresh / me — pratar med api.ts
  AuthProvider.tsx  Bootstraps store från storage, hydrerar /auth/me, injicerar token i api.ts
  useAuth.ts        Hook: { user, isAuthenticated, isLoading, login, register, logout }
  guards.ts         requireAuth() helper för beforeLoad i TanStack-routes
```

- `api.ts` `setApiTokenGetter` återanvänds som idag — `AuthProvider` registrerar en getter som läser från storen.
- 401-svar i `apiRequest` triggar engångsförsök till `/auth/refresh`; om det misslyckas → store rensas → router invalidate → guard skickar till `/sign-in`.
- Tokens lagras i `localStorage` (samma trade-off som Clerk gör i browsern). Refresh-rotation om backend skickar ny refreshToken.

## Route guards

Ny pathless layout `src/routes/_authenticated.tsx`:

```text
beforeLoad: kolla store.isAuthenticated
  → om inte: throw redirect({ to: "/sign-in", search: { redirect: location.href } })
component: <Outlet />
```

Följande rutter flyttas till `src/routes/_authenticated/`:

```text
dashboard, uploads, settings, processing, distribution, organizations,
artists (+ $id), releases (+ $id), tracks (+ $id), albums, assets,
library, playlists, rights, profile, admin (+ alla admin.* underrutter)
```

Publikt kvar i `src/routes/`: `index`, `discover`, `status`, `sign-in`, `sign-up`, `login` (redirect-shim), `sitemap[.]xml`.

Filerna flyttas/byter namn — innehållet rörs inte. `routeTree.gen.ts` regenereras automatiskt av Vite-plugin.

## Sign-in / sign-up / profile

Tre nya enkla, brandade sidor med shadcn `Card` + `Input` + `Button`:

- `/sign-in`: email + password, "Glömt lösenord?" (länk, no-op tills backend stödjer det), länk till `/sign-up`. Respekterar `?redirect=`.
- `/sign-up`: displayName + email + password (+ bekräfta), terms-checkbox.
- `/profile` (skyddad): visar user, knapp för logout, plats för "Change password" när backenden stödjer det.

Layout: centrerad split-screen med Catalogus Musicus logo + tagline till vänster, formulär till höger. Använder befintliga design tokens, ingen ny färgpalett.

## Sidebar-uppdatering

`AppShell.tsx` byter Clerks `<SignedIn>/<SignedOut>/<UserButton>` mot:

- Oinloggad: knapparna "Sign in" / "Sign up" (samma `NavItem`-stil som idag).
- Inloggad: avatar + namn → dropdown med "Profile" + "Sign out".

## Felhantering

- `ApiError 401` på skyddade calls → guarden gör cleanup och redirect.
- `ApiError 404` på `/auth/*` → visa "Auth-endpoint saknas i backend" i sign-in-formuläret (gör det enkelt att felsöka backenden).
- Network/CORS → återanvänder befintliga `FetchDiagnostics` så felmeddelanden är konsekventa.

## Verifiering

- TypeScript build körs automatiskt av harness.
- Manuell smoke i preview: oinloggad → `/dashboard` redirectar till `/sign-in?redirect=/dashboard`. Efter login → tillbaka till `/dashboard`. Logout → tillbaka till `/`.
- `AuthDebug` (dev-only) visar `signedIn`, `userId`, `email` från nya storen.

## Inte i denna runda

- RBAC / `/admin`-skydd utöver inlogg.
- Clerk Organizations / multi-tenant org-switcher.
- Social login (Google/Apple).
- Password reset-sida (kräver backend-flow).

Säg till om någon backend-path heter annat så justerar jag `client.ts` direkt — resten av planen påverkas inte.
