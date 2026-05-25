## Mål

Byt ut den externa OAuth-vyn (Microsoft/Apple/GitHub) mot en lokal Lovable Cloud-lösning som fungerar direkt: e-post + lösenord och Google. Lägg till en `profiles`-tabell + roller så vi senare kan styra behörigheter. Behåll all befintlig katalogfunktionalitet.

## Databas (migration)

1. `profiles`-tabell
   - `id uuid primary key references auth.users(id) on delete cascade`
   - `email text`, `display_name text`, `avatar_url text`
   - `created_at`, `updated_at` (default now())
   - RLS på: användare kan SELECT/UPDATE sin egen rad; INSERT tillåten för egen `id`.

2. Roller (separat tabell — undviker privilege escalation)
   - `create type app_role as enum ('admin','editor','viewer')`
   - `user_roles(id, user_id → auth.users, role app_role, unique(user_id, role))`
   - RLS: bara läsbar för inloggad användares egna rader.
   - `has_role(_user_id uuid, _role app_role)` security definer-funktion.

3. Trigger: `handle_new_user()` skapar automatiskt en `profiles`-rad + en `user_roles`-rad med `'viewer'` när någon registrerar sig.

## Frontend

### `src/routes/sign-in.tsx`
- Ta bort Microsoft/Apple/GitHub-knapparna.
- Två flikar: **Logga in** och **Skapa konto**.
- Fält: e-post, lösenord (signup också: display name).
- `supabase.auth.signInWithPassword({ email, password })` resp. `supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/auth/callback', data: { display_name } } })`.
- Knapp "Fortsätt med Google" → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`.
- Svenska fel- och informationsmeddelanden (t.ex. "Felaktig e-post eller lösenord", "Vi har skickat en bekräftelselänk till din e-post").

### `src/routes/auth.callback.tsx`
- Behåll — fungerar redan för OAuth + magic links. Verifiera att den läser session via `onAuthStateChange` och redirectar till `?redirect` eller `/dashboard`.

### `src/lib/auth/useAuth.ts` / `store.ts` / `AuthProvider.tsx`
- Ta bort `SupportedProvider`-listan med azure/github/apple.
- Lägg till `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`.
- Hämta `roles` från `user_roles`-tabellen efter login (en query) och exponera via `useAuth()`.

### `src/lib/auth/permissions.ts`
- `useHasRole('admin' | 'editor' | 'viewer')` baserat på roller från store.

### Cleanup
- Ta bort referenser till Microsoft/Apple/GitHub i sign-in och dokumentation.
- Behåll `/debug/token`-länken i menyn.

## Verifiering

- Bygg passerar.
- `/sign-in` visar e-post/lösenord-formulär + Google-knapp.
- Ny användare kan registrera sig → profile + viewer-roll skapas automatiskt.
- `/admin` skyddas fortfarande via `_authenticated`-guarden.

## Vad användaren behöver göra själv

- Inget för e-post/lösenord — fungerar direkt.
- För Google-knappen: aktivera Google-providern i Lovable Cloud → Users → Auth Settings (eller så kan jag göra det åt dig efter att planen godkänts).

## Filer som ändras

- ny migration (profiles, user_roles, app_role, has_role, handle_new_user trigger)
- `src/routes/sign-in.tsx`
- `src/lib/auth/useAuth.ts`
- `src/lib/auth/store.ts`
- `src/lib/auth/AuthProvider.tsx`
- `src/lib/auth/permissions.ts`
