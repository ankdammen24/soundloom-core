## Mål

Slutföra rebranden från Soundloom till **Catalogus Musicus** — *"The modern music catalog and distribution platform"* — peka kanoniska URL:er mot den nya tillfälliga domänen `https://catalogusmusicus.mediarosenqvist.com`, lägg till saknade sektioner i navigationen, och ge dashboarden en mer premium musik-tech-känsla. Backend, Clerk-auth, uppladdning och status lämnas orörda.

## Nuläge

- All synlig text säger redan "Catalogus Musicus" (gjordes i tidigare loop).
- Kvar att uppdatera: 10 hårdkodade `soundloom-core.lovable.app` / `soundloom.mediarosenqvist.com` URL:er i route-`head()`, JSON-LD i `__root.tsx`, sitemap, samt README-repo-not.
- Saknade nav-sektioner: Assets, Organizations, Distribution. Finns redan: Dashboard, Artists, Releases, Tracks, Processing, Settings (+ Uploads, Status, Discover).

## Vad som ändras

### 1. Domän- och metadata-byte
- `src/routes/sitemap[.]xml.ts`: `BASE_URL = "https://catalogusmusicus.mediarosenqvist.com"`.
- `src/routes/__root.tsx`: byt båda JSON-LD `url`-fälten till nya domänen.
- `src/routes/{index,albums,artists,discover,releases,status,tracks}.tsx`: konstanten `URL` pekas om till `https://catalogusmusicus.mediarosenqvist.com/...`.
- `README.md`: uppdatera repo/domän-anteckningen.

### 2. Produktidentitet
- `__root.tsx`: sätt `og:site_name = "Catalogus Musicus"`, säkerställ default-description = *"The modern music catalog and distribution platform"*.
- `index.tsx` (hero) och `AppShell` (sidebar-undertext): visa tagline tydligt.

### 3. Nya nav-sektioner
Lägg till tre route-stubbar med riktig `head()`-meta och en enkel "kommer snart"-vy i samma stil som befintlig `library.tsx`:
- `src/routes/assets.tsx` → `/assets` (filhantering, kopplas senare till `/api/assets/...`)
- `src/routes/organizations.tsx` → `/organizations`
- `src/routes/distribution.tsx` → `/distribution`

Uppdatera `AppShell.tsx`:
- Flytta nav-gruppering till **Workspace** (Dashboard, Processing, Distribution, Organizations, Settings) och **Catalog** (Artists, Releases, Tracks, Assets, Uploads).
- Behåll Home, Discover, Platform Status i toppen.
- Använd `lucide-react`-ikoner: `Boxes` (Assets), `Building2` (Organizations), `Radio` (Distribution).

### 4. Premium dashboard
Uppdatera `src/routes/dashboard.tsx` med en mer musik-tech-känsla utan att röra logik/API:
- Hero-kort med gradient (`--gradient-primary` finns redan i `styles.css`), produktnamn + tagline, mjuk glow.
- KPI-rad: Artists / Releases / Tracks / Assets (4 kort, läses från befintliga `useQuery`-hooks; Assets visar `—` tills endpoint kopplas).
- "Recently added"-lista som speglar Spotify-stilen i `PlayerBar`/`AppShell` (rundade kort, subtila hover-states, ingen ny färgpalett).
- Genvägs-CTA: "Upload audio", "New release", "View distribution".
- Allt via befintliga semantiska tokens — inga nya hex-värden.

### 5. Lämnas orört
- `src/lib/api.ts` och allt API-anrop.
- Clerk-konfiguration och auth-flöde.
- Upload-flöde (`uploads.tsx`, R2-klient).
- Status-sidans logik (endast canonical-URL byts).
- Infrastruktur: `soundloom-core.lovable.app` förblir publish-URL i Lovable tills användaren själv byter i publish settings.

## Tekniska detaljer

- Nya routes följer mallen i `library.tsx` men med komplett `head()` (title, description, og:title, og:description, og:url, canonical) enligt projektets head-meta-konvention. Ingen `og:image` läggs på (ingen verklig bild ännu).
- Routes registreras automatiskt av TanStack-pluginen — `routeTree.gen.ts` rörs inte manuellt.
- Sitemap: lägg till `/assets`, `/organizations`, `/distribution` i `entries`.
- Dashboard-styling använder bara befintliga tokens (`--primary`, `--gradient-primary`, `--shadow-elegant`, `--sidebar-accent`).

## Filer som ändras

```
src/routes/__root.tsx              (JSON-LD URL + og:site_name)
src/routes/sitemap[.]xml.ts        (BASE_URL + nya entries)
src/routes/index.tsx               (URL + tagline i hero)
src/routes/albums.tsx              (URL)
src/routes/artists.tsx             (URL)
src/routes/discover.tsx            (URL)
src/routes/releases.tsx            (URL)
src/routes/status.tsx              (URL)
src/routes/tracks.tsx              (URL)
src/routes/dashboard.tsx           (premium redesign)
src/routes/assets.tsx              (NY)
src/routes/organizations.tsx       (NY)
src/routes/distribution.tsx        (NY)
src/components/layout/AppShell.tsx (nav-grupper + nya items)
README.md                          (domän/repo-not)
```

## Öppna frågor

1. Ska den gamla `soundloom.mediarosenqvist.com`-domänen behållas som alias (redirect/sekundär canonical) eller helt fasas ut nu? Just nu föreslår planen att helt byta till `catalogusmusicus.mediarosenqvist.com`.
2. Ska `/assets`, `/organizations`, `/distribution` redan nu försöka prata med ett backend-endpoint, eller räcker det med "kommer snart"-vyer tills API:t är klart? Planen utgår från det senare.
