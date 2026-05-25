## Mål

1. Flytta hela backend (inkl. fillagring) till Lovable Cloud så du bara har en leverantör att betala/underhålla.
2. Få SAML-inloggningen att gå hela vägen in i appen.
3. Efter lyckad inloggning ska användaren landa på sin egen profilsida (`/profile`).

---

## Del 1 — Flytta fillagring från R2 till Lovable Cloud Storage

Idag används Cloudflare R2 (`mrq-music-masters`, `-previews`, `-normalized`, `-artwork`, `-exports`) via `src/lib/r2.server.ts`, `r2.functions.ts` och `r2-client.ts`. Inget UI använder R2 ännu, så bytet är en ren server-/lagringsväxling utan dataflytt.

Steg:
- Skapa 5 storage buckets i Lovable Cloud: `masters` (privat), `previews` (publik), `normalized` (privat), `artwork` (publik), `exports` (privat).
- Lägg RLS-policys per bucket: inloggade användare får läsa/skriva sina egna nycklar; admin får läsa allt; `artwork` och `previews` blir publikt läsbara.
- Ersätt R2-server-API:t med en tunn Lovable Cloud Storage-modul: signerade upload-URL:er via `storage.createSignedUploadUrl`, signerade läs-URL:er via `createSignedUrl`, publika URL:er via `getPublicUrl`.
- Behåll samma publika funktionssignaturer i `r2.functions.ts` (`getR2UploadUrl`, etc.) så framtida UI-kod inte påverkas — bara internt byts implementationen ut. Filen får ett nytt namn (`storage.functions.ts`) och `r2.*` blir en tunn re-export tills inga konsumenter finns kvar.
- Ta bort `@aws-sdk/client-s3` och `@aws-sdk/s3-request-presigner` ur dependencies.
- Markera R2-secrets (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_PUBLIC_ARTWORK_BASE_URL`) som obsoleta — du kan radera dem i ett senare steg när du är säker.

Kostnad: lagring + bandbredd debiteras nu via Lovable Cloud-användning. Inga befintliga filer migreras (buckets är tomma idag).

---

## Del 2 — Få SAML-callbacken att fungera

Symptom: efter SSO-bekräftelse fastnar du på `/auth/callback#access_token=...`. Tokens kommer alltså fram, men sessionen sätts aldrig eller redirecten faller bort.

Åtgärder:
- Härda `src/routes/auth.callback.tsx` så att hash-fragmentet alltid plockas upp även när Supabase själv hinner före (`detectSessionInUrl` race). Vänta in `INITIAL_SESSION`/`SIGNED_IN` innan timeout slår till.
- Säkerställ att SAML-providerns Redirect-URL i Supabase pekar på `https://catalog.mediarosenqvist.com/auth/callback` (utan `#`). Lägg även `soundloom-core.lovable.app` och `*.lovable.app`-previews i Auth → URL Configuration → Redirect URLs så att test-miljön funkar.
- Verifiera att `public/_redirects` (`/* /index.html 200`) ligger med i senaste publicerade build — annars fastnar callback-routen i 404 på custom domain.
- Logga ut den exponerade sessionen (token klistrades in i chatten) genom att klicka logga ut i appen efter fixen, så roteras refresh-tokenen.

---

## Del 3 — Landa på `/profile` efter inloggning

Idag skickar callbacken admins till `/dashboard` och alla andra till `/`. Du vill att alla landar på `/profile`.

Åtgärder:
- I `auth.callback.tsx`: ändra `resolveTarget` så standardmålet är `/profile`. En explicit `?next=...` (intern URL) respekteras fortfarande för deep links.
- I `src/routes/_authenticated.tsx` / `index.tsx`-flödet: när en inloggad användare hamnar på `/` utan annat mål, redirecta till `/profile`. Publika besökare på `/` ser fortsatt landningssidan.
- Sign-in-sidan skickar redan `next` när det finns; den logiken behålls.

---

## Tekniska detaljer

- Storage-RLS exempel (per bucket):
  - `masters`, `normalized`, `exports`: `bucket_id = '<name>' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'))`
  - `artwork`, `previews`: publik SELECT; INSERT/UPDATE/DELETE kräver `authenticated` + admin eller ägarprefix.
- `storage.functions.ts` använder den befintliga `requireSupabaseAuth`-middlewaren och `supabaseAdmin` för signerade URL:er — samma mönster som R2-modulen idag.
- Callback-fixen håller kvar `withTimeout`, men ökar till 12s och avbryter inte om en `onAuthStateChange` redan triggat redirect.
- Inga DB-migrationer behövs för Del 2 och 3. Del 1 kräver en migration som skapar buckets + storage-policys.

---

## Vad som INTE ingår

- Ingen ändring av SAML-IdP-konfiguration hos Microsoft/Google — bara Supabase Redirect-URL-listan.
- Inga UI-omskrivningar; profilsidan finns redan.
- Ingen datamigrering från R2 (buckets är tomma).
