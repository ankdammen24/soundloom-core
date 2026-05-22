# Frontend UX Polish

Frontend-only pass that lifts the look-and-feel of Catalogus Musicus across loading, uploads, catalog tables, detail pages, theming and responsiveness. No new backend, no breaking changes to `src/lib/api.ts`. No new heavyweight dependencies — uploads use the native HTML5 drag-and-drop + `XMLHttpRequest` (already in use), waveforms use the built-in `WebAudio` decoder + `<canvas>`, theme toggle uses a tiny `localStorage` hook (no `next-themes`).

## 1. Loading skeletons

New `src/components/Skeleton.tsx` (thin shadcn-style block: `animate-pulse bg-muted rounded`) and a set of preset skeletons:

- `<TableSkeleton rows columns />`
- `<CardGridSkeleton count />`
- `<DetailSkeleton />` (title + cover + 3 metadata rows)
- `<KpiSkeleton />`

Replace every `"Loading…"` text string in `tracks.tsx`, `artists.tsx`, `releases.tsx`, `albums.tsx`, `dashboard.tsx`, `releases.$id.tsx`, `artists.$id.tsx`, `tracks.$id.tsx`, and the admin pages with the relevant preset. The admin `DataTable` empty/loading states also switch from a centered spinner to `TableSkeleton`.

## 2. Optimistic UI

For the three create mutations (`createArtist`, `createRelease`, `createTrack`) and metadata edits (#7), wire `useMutation` with `onMutate` / `onError` / `onSettled` to:

1. Cancel in-flight queries for the affected list/detail key
2. Snapshot previous cache
3. Insert/patch a temporary record with `id: 'optimistic-<uuid>'` and `status: 'draft'`
4. Roll back on error and invalidate on settle

Implemented as a small `useOptimisticListAdd<T>(key, mutationFn)` hook in `src/hooks/useOptimisticList.ts` so all three forms share the pattern.

## 3 + 4. Drag/drop uploads with progress

Replace the single-file label in `src/routes/uploads.tsx` with a real `<DropZone />` component (`src/components/uploads/DropZone.tsx`):

- Native `onDragEnter/Leave/Over/Drop` with a hover state (`ring-2 ring-primary border-dashed`)
- Multi-file: accept many `audio/*` files, queue them serially
- Each file gets a row with thumbnail (file-type icon), name, size, per-file progress bar, status badge, cancel button
- A composite top progress shows total bytes uploaded / total bytes queued
- XHR upload (already present) extracted into `uploadFile(file, init, onProgress, signal)` so cancellation works via `AbortController` → `xhr.abort()`

## 5. Waveform previews

New `src/components/audio/Waveform.tsx`:

- Accepts a `File` (locally selected) or `url` (decoded audio asset)
- Uses `AudioContext.decodeAudioData()` to compute peaks (downsampled to ~600 buckets)
- Renders bars on a `<canvas>` sized to the container, with `--primary` / `--muted` colors and a playhead overlay synced to the existing `AudioEngine` when a `trackId` is provided
- Falls back to an animated placeholder while decoding
- Shown in: upload queue rows (small variant) and `tracks.$id.tsx` detail (large variant)

No new dependency. Decoding runs lazily and is gated by file size (< 80 MB) to avoid main-thread jank.

## 6. Artwork previews

New `src/components/media/Artwork.tsx`:

- Square aspect, rounded, with cover-art URL or a generated gradient placeholder derived from the artist/release name hash (deterministic `from-` / `to-` tokens)
- Loading shimmer + graceful broken-image fallback
- Used on the new release detail page (large), in releases/artists list rows (small), and in dashboard "recently added".

## 7. Metadata editing UX

A reusable `<EditableField label value onSave validate />` (`src/components/EditableField.tsx`):

- Click-to-edit inline (text/number/select variants)
- Enter saves, Esc cancels, blur saves
- Loading spinner inside the field while the mutation is in flight
- Uses the optimistic update hook from #2

Wired into:
- `artists.$id.tsx` — name, country, displayName
- `releases.$id.tsx` — title, type, releaseDate, status
- `tracks.$id.tsx` — title, ISRC, durationSec

The PATCH calls go through new thin wrappers `api.updateArtist/Release/Track` added to `src/lib/api.ts` (`PATCH /api/{resource}/:id` — the existing convention). If a 405/404 comes back the field shows an "endpoint not yet available" hint and rolls back, same pattern as the admin views.

## 8. Processing timeline

New `src/components/ProcessingTimeline.tsx` — a vertical stepper used on the upload page and on `tracks.$id.tsx`:

- Steps: Uploaded → Probed → Transcoded → Waveform generated → Tagged → Ready
- Each step shows a status icon (pending/active/done/failed), timestamp, and an optional error inline
- Pulls from `track.processingEvents` if backend returns it; otherwise renders an inferred timeline from `track.status`

## 9. Status badges

The existing `StatusBadge` already covers most statuses. Improvements:

- Add `size: "sm" | "md"`, a leading icon variant (✓, ⏳, ⚠), and a `pulse` variant for active processing states
- Add the missing statuses surfaced by upload (`uploading`, `finalizing`)
- Replace ad-hoc badges in `admin.workers.tsx`, upload page, and `releases.tsx` with this single component

## 10. Searchable catalog tables

New `src/components/CatalogTable.tsx` built on top of the existing table markup:

- Sticky header, zebra hover, sortable column headers (client-side, `onSort` toggles asc/desc)
- Top toolbar: search input (filters by any visible string column), column visibility menu, count
- URL-synced state via TanStack Router `validateSearch` (`q`, `sort`, `dir`) so deep links and back/forward work
- Empty state slot, skeleton during load
- Drop into `tracks.tsx`, `artists.tsx`, `releases.tsx`, `albums.tsx`

## 11. Release detail page

Rewrite `src/routes/releases.$id.tsx` (currently a JSON dump) into a proper detail layout:

- Hero: large `<Artwork />`, title, artist link, type, release date, status badge, primary actions (Edit metadata, Distribute, Open in catalog)
- Tabs (shadcn `Tabs`): **Overview** (description, credits, EditableField grid), **Tracks** (sortable list with play button, waveform thumb, ISRC), **Processing** (`<ProcessingTimeline />`), **Distribution** (placeholder cards per platform), **Activity** (recent audit events for this release)
- Loader uses `ensureQueryData` + `useSuspenseQuery`; `errorComponent` and `notFoundComponent` set; `head()` now derives `og:title` / `og:image` from the loader's release data

## 12. Dark/light theme polish

The shell currently hard-codes `<html className="dark">`. Make it dynamic:

- New `src/lib/theme.ts` exporting `useTheme()` and a `<ThemeProvider>` that reads `localStorage('theme')` (default `system`), applies `dark`/`light` class to `<html>`, and listens to `prefers-color-scheme`
- An inline boot script injected via `__root.tsx` `scripts: [{ children: "..." }]` sets the class **before paint** to prevent flash
- A `<ThemeToggle />` button (sun/moon/system) lives in the AppShell sidebar footer
- Audit `src/styles.css`: light tokens are already defined; the polish is to tighten `--card` contrast in light mode, raise `--muted-foreground` contrast for WCAG AA on small text, and add subtle `box-shadow` tokens used on cards (`--shadow-sm`, `--shadow-card`) so light mode doesn't look flat

## 13. Responsive tablet layout

Currently the shell breakpoint is `md:` (≥768) which collapses to a hamburger on tablets. Refine:

- AppShell grid: `grid-cols-1` on mobile, `grid-cols-[72px_1fr]` on `md` (collapsed icon-only sidebar with tooltips), `grid-cols-[260px_1fr]` on `lg` (full sidebar)
- PlayerBar: stacks controls in a 2-row layout under 640px; full single-row on tablet/desktop
- Catalog tables: hide low-priority columns (`isrc`, `country`, `updatedAt`) on tablet via per-column `hideBelow: "lg"` prop on `CatalogTable`; the column visibility menu lets users re-show them
- Release detail hero switches from side-by-side (cover left, info right) on `lg` to stacked on `md` with a smaller cover

## Files

Created:
- `src/components/Skeleton.tsx`
- `src/components/EditableField.tsx`
- `src/components/CatalogTable.tsx`
- `src/components/ProcessingTimeline.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/uploads/DropZone.tsx`
- `src/components/uploads/UploadQueueItem.tsx`
- `src/components/audio/Waveform.tsx`
- `src/components/media/Artwork.tsx`
- `src/hooks/useOptimisticList.ts`
- `src/lib/theme.ts`
- `src/lib/upload.ts` (extracted XHR helper with cancellation)

Edited:
- `src/lib/api.ts` (add `updateArtist/Release/Track`, optional `processingEvents` type)
- `src/styles.css` (shadow tokens, light-mode contrast tweak)
- `src/routes/__root.tsx` (boot script, ThemeProvider)
- `src/components/layout/AppShell.tsx` (3-breakpoint sidebar, ThemeToggle)
- `src/components/StatusBadge.tsx` (size + icon + pulse variants)
- `src/features/player/PlayerBar.tsx` (small-screen stack)
- `src/routes/uploads.tsx` (drag/drop + queue + waveform + timeline)
- `src/routes/tracks.tsx`, `artists.tsx`, `releases.tsx`, `albums.tsx` (CatalogTable + skeletons + optimistic add)
- `src/routes/releases.$id.tsx` (full rewrite, tabbed detail)
- `src/routes/tracks.$id.tsx`, `artists.$id.tsx` (EditableField, skeleton, waveform on tracks)
- `src/routes/dashboard.tsx` (Artwork in "recently added", KpiSkeleton)

## Open questions (assuming as noted)

- **Theme default**: defaulting to `system` with manual override remembered in `localStorage`. Say if you'd rather force dark.
- **Metadata PATCH endpoints**: assuming `PATCH /api/{resource}/:id` exists or is coming; the UI handles 404/405 gracefully and rolls back.
- **Cover art field name**: trying `coverUrl` then `image_url`/`imageUrl` — drop a note if the backend uses a different field.
