## Mål

Inför tvåspråkigt UI (svenska + engelska) i hela appen — inklusive admin-vyer — med automatiskt språkval från webbläsaren och en språkväljare både i AppShell-headern och på sign-in/sign-up.

## Stack

- `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- Namespaces per yt-område för att hålla filer hanterbara
- JSON-resurser i `src/i18n/locales/{sv,en}/*.json`
- Val sparas i `localStorage` under `lang` och sätts på `<html lang>`

## Filer som skapas

```text
src/i18n/
  index.ts                 // init: språk, detektor, fallback (en), resurser
  resources.ts             // typad import av alla JSON-namespaces
  locales/sv/common.json   // knappar, labels, status, generella ord
  locales/sv/auth.json     // sign-in, sign-up, callback, fel
  locales/sv/shell.json    // navigation, header, footer, språkväljare
  locales/sv/dashboard.json
  locales/sv/library.json  // releases, tracks, artists, albums, playlists
  locales/sv/uploads.json
  locales/sv/processing.json
  locales/sv/distribution.json
  locales/sv/rights.json
  locales/sv/profile.json
  locales/sv/settings.json
  locales/sv/admin.json    // alla _authenticated.admin.*-vyer
  locales/en/... (samma struktur)
src/components/LanguageSwitcher.tsx  // SV/EN dropdown, återanvänds
```

## Filer som ändras

- `src/main.tsx` — importera `./i18n` så init körs innan render
- `src/components/layout/AppShell.tsx` — språkväljare bredvid `ThemeToggle`, översätt nav
- `src/routes/sign-in.tsx` — språkväljare uppe till höger, alla strängar via `t()`
- `src/routes/sign-up.tsx` — samma
- `src/routes/auth.callback.tsx` — översätt status/fel
- Alla `src/routes/_authenticated.*.tsx` (dashboard, releases, tracks, artists, albums, uploads, profile, settings, processing, distribution, rights, playlists, library, organizations, assets) — strängar via `useTranslation`
- Alla `src/routes/_authenticated.admin.*.tsx` (api-usage, audit, diagnostics, jobs, logs, processing-metrics, queues, storage, workers) — strängar via `useTranslation`
- `src/components/*` (PageHeader, StatusBadge, ProcessingTimeline, Setup, CatalogTable, EditableField, DropZone, m.fl.) — strängar via `useTranslation`
- `index.html` — `<html lang="sv">` som utgångsläge (uppdateras runtime av i18n)

## Beteende

1. **Init-ordning**: `i18next` läser `localStorage.lang` först. Om saknas — `navigator.language`: börjar med `sv` → `sv`, annars `en`. Faller tillbaka på `en` om en nyckel saknas.
2. **Språkväljare** (`LanguageSwitcher`): liten dropdown med `SV / EN`. Vid byte: `i18n.changeLanguage(lng)` + `localStorage.setItem("lang", lng)` + `document.documentElement.lang = lng`. Synkroniseras via `i18n.on("languageChanged")`.
3. **Placering**:
   - AppShell-header: bredvid `ThemeToggle` (alltid synlig när inloggad).
   - Sign-in/Sign-up: absolut positionerad uppe till höger i `AuthShell`.
4. **Datum/tal**: använd `Intl.DateTimeFormat` och `Intl.NumberFormat` med `i18n.language` där datum/tal redan formateras (mest i admin/processing-vyer).
5. **Felmeddelanden**: regex-matchningar mot Supabase-fel (t.ex. `invalid login credentials`) flyttas till en helper som returnerar en översättningsnyckel istället för en hårdkodad svensk sträng.

## Översättningsstrategi

- Befintlig text är delvis svensk, delvis engelsk. Svenska behåller sin nuvarande ton (du-form, "Logga in", "Skapa konto"). Engelsk variant använder samma terminologi som koden redan har ("Releases", "Tracks", "Uploads", "Processing", "Distribution", "Rights").
- Domänord lämnas oöversatta i båda språken: *Release*, *Track*, *Catalog*, *Artwork*, *SSO*, *SAML*, *Lovable Cloud*.
- Nyckelnamn på engelska, kebab-style inom namespace: `auth:sign-in.title`, `shell:nav.releases`, `admin:queues.heading`.

## Out of scope

- Översättning av e-postmallar (`src/lib/email-templates/*`) — separat uppgift, kräver att mejlflödet vet mottagarens språk.
- Översättning av loggar/serverfel i `src/routes/lovable/*` (interna endpoints).
- RTL-stöd.

## Verifiering

- Bygg passerar utan saknade nycklar (`returnNull: false`, `saveMissing` i dev loggar varningar i konsolen).
- Manuell rundtur: sign-in → dashboard → releases → admin/queues, byt språk i headern, ladda om — språket sitter kvar.
- `<html lang>` växlar mellan `sv` och `en`.
