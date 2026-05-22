# Admin & Operations Tooling

Frontend-only build. We add an "Admin" nav group with 10 routes plus a shared health-aggregation hook, all calling backend endpoints under `/api/admin/*` and `/health/*`. Every view degrades gracefully when the backend endpoint isn't live yet (loading → typed empty state with the expected URL shown), so the UI ships now and lights up as the backend rolls out.

No backend changes, no auth changes (Clerk Bearer continues via `setApiTokenGetter`). No new dependencies — we reuse `@tanstack/react-query`, shadcn `Card`/`Table`/`Tabs`/`Badge`/`Button`, lucide icons, and existing tokens in `src/styles.css`.

## Navigation

New sidebar group **Operations** in `AppShell.tsx`, below Workspace:

- Admin (overview) → `/admin`
- Workers → `/admin/workers`
- Queues → `/admin/queues`
- Storage → `/admin/storage`
- Processing metrics → `/admin/processing-metrics`
- Failed jobs → `/admin/jobs`
- Logs → `/admin/logs`
- Diagnostics → `/admin/diagnostics`
- Audit log → `/admin/audit`
- API usage → `/admin/api-usage`

The existing `/status` page stays as the public health page; `/admin/diagnostics` is the operator-facing version with the aggregated `/health/all` endpoint plus environment + build info.

## Routes (each its own file with `head()` meta)

1. `src/routes/admin.tsx` — layout route with `<Outlet />` and a sub-nav (Tabs) for the section. Also serves as the **Admin Dashboard**: KPI cards (workers up, queue depth, failed jobs 24h, storage used, p95 processing time, requests/min) sourced from `api.admin.summary()`.
2. `src/routes/admin.workers.tsx` — table of workers (`id`, `host`, `version`, `status`, `lastHeartbeat`, `activeJobs`), 10s refetch.
3. `src/routes/admin.queues.tsx` — per-queue metrics (`name`, `waiting`, `active`, `completed`, `failed`, `delayed`, `paused`) + tiny sparkline (inline SVG, no chart dep).
4. `src/routes/admin.storage.tsx` — buckets/volumes with `used`, `quota`, `objectCount`, `egress24h` and a progress bar.
5. `src/routes/admin.processing-metrics.tsx` — throughput, success rate, p50/p95/p99 latency per job type; time range selector (1h/24h/7d).
6. `src/routes/admin.jobs.tsx` — **Failed jobs view + retry controls**. Paginated table with filters (queue, since), row actions: Retry, Retry with backoff reset, Discard. Bulk select + bulk retry. Uses `POST /api/admin/jobs/:id/retry` and `POST /api/admin/jobs/bulk-retry`.
7. `src/routes/admin.logs.tsx` — **Structured logs**. Filters: level, service, traceId, free-text, time range. Virtualized list (simple windowed render, no new dep), expandable rows showing the full JSON payload. Auto-tail toggle (5s poll).
8. `src/routes/admin.diagnostics.tsx` — **System diagnostics**. Calls `GET /health/all` (aggregated) and falls back to fanning out the existing per-subsystem `/health/*` checks if the aggregate isn't available. Shows env (API base URL, build sha, commit time), feature flags, and a "Copy diagnostics report" button.
9. `src/routes/admin.audit.tsx` — **Audit/event log**. Table of actor, action, resource, before/after diff (collapsible), ip, timestamp. Filters: actor, action, resource type, date range.
10. `src/routes/admin.api-usage.tsx` — **API usage metrics**. Requests by route, status-code breakdown, top consumers (by user/org), rate-limit hits. Time range selector.

## API client additions (`src/lib/api.ts`)

Add typed helpers under a new `admin` namespace; all authenticated:

```ts
api.admin = {
  summary:           () => apiRequest<AdminSummary>("/api/admin/summary"),
  workers:           () => apiRequest<Worker[]>("/api/admin/workers"),
  queues:            () => apiRequest<QueueStats[]>("/api/admin/queues"),
  storage:           () => apiRequest<StorageStats[]>("/api/admin/storage"),
  processing: (range) => apiRequest<ProcessingMetrics>("/api/admin/metrics/processing", { query: { range } }),
  failedJobs: (q)    => apiRequest<Page<Job>>("/api/admin/jobs/failed", { query: q }),
  retryJob: (id)     => apiRequest<void>(`/api/admin/jobs/${id}/retry`, { method: "POST" }),
  bulkRetry: (ids)   => apiRequest<void>("/api/admin/jobs/bulk-retry", { method: "POST", body: { ids } }),
  discardJob: (id)   => apiRequest<void>(`/api/admin/jobs/${id}`, { method: "DELETE" }),
  logs: (q)          => apiRequest<Page<LogEntry>>("/api/admin/logs", { query: q }),
  audit: (q)         => apiRequest<Page<AuditEvent>>("/api/admin/audit", { query: q }),
  apiUsage: (range)  => apiRequest<ApiUsage>("/api/admin/metrics/api-usage", { query: { range } }),
  healthAll:         () => apiRequest<HealthAggregate>("/health/all", { anonymous: true }),
};
```

Types added to the same file. `ApiError` already surfaces 404s cleanly — views render an "Endpoint not yet available — expected at `<url>`" empty state instead of a red error when status is 404.

## Shared building blocks

- `src/components/admin/MetricCard.tsx` — KPI card (label, value, delta, icon).
- `src/components/admin/DataTable.tsx` — thin wrapper over shadcn `Table` with sticky header, empty/loading/error states.
- `src/components/admin/RangePicker.tsx` — `1h | 24h | 7d | 30d` segmented control.
- `src/components/admin/JsonView.tsx` — collapsible pretty-printed JSON (no dep, simple recursive component).
- `src/hooks/useAutoRefresh.ts` — wraps `useQuery` with a toggleable interval.

## Styling

Premium music-tech feel consistent with the current dashboard: gradient header strip on `/admin`, mono font for IDs/timestamps, status badges using existing semantic tokens (`--primary`, `--destructive`, plus `emerald/amber/sky` already used on `/status`). No new design tokens.

## Open questions (assumptions if unanswered)

- **Access control**: assume all signed-in users see Admin for now; gating by role can be added once the backend exposes a roles claim.
- **Backend endpoints**: assumed shape under `/api/admin/*` as listed; if your backend uses different paths, only `src/lib/api.ts` needs to change.

## Files

Created:
- `src/routes/admin.tsx`
- `src/routes/admin.workers.tsx`
- `src/routes/admin.queues.tsx`
- `src/routes/admin.storage.tsx`
- `src/routes/admin.processing-metrics.tsx`
- `src/routes/admin.jobs.tsx`
- `src/routes/admin.logs.tsx`
- `src/routes/admin.diagnostics.tsx`
- `src/routes/admin.audit.tsx`
- `src/routes/admin.api-usage.tsx`
- `src/components/admin/MetricCard.tsx`
- `src/components/admin/DataTable.tsx`
- `src/components/admin/RangePicker.tsx`
- `src/components/admin/JsonView.tsx`
- `src/hooks/useAutoRefresh.ts`

Edited:
- `src/lib/api.ts` (add `api.admin.*` and types)
- `src/components/layout/AppShell.tsx` (add Operations nav group)
- `src/routes/sitemap[.]xml.ts` (add admin routes — or exclude, your call)
