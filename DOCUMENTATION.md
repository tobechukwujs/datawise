# DashWise — Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [CSV Processing Pipeline](#csv-processing-pipeline)
6. [AI Generation Pipeline](#ai-generation-pipeline)
7. [Chart System](#chart-system)
8. [Security Model](#security-model)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## Architecture Overview

DashWise is a Next.js 14 App Router application. All pages and API routes are server-rendered on demand (`ƒ` in the build output). Authentication is enforced at two layers: the Next.js middleware (page routes) and individual API route handlers (API routes).

```
Browser
  └── Next.js App Router (Edge Middleware → Server Components / Route Handlers)
        ├── NextAuth.js  ──────────────► Supabase PostgreSQL (User table)
        ├── Prisma ORM   ──────────────► Supabase PostgreSQL (Dataset / Dashboard / Chart)
        ├── Anthropic SDK ─────────────► Claude API (dashboard generation)
        └── @vercel/blob ──────────────► Vercel Blob (CSV file storage)
```

### Key design decisions

- **File storage on Vercel Blob** — uploaded CSVs are stored as public blobs via `@vercel/blob`. The blob URL is stored in `Dataset.filePath`. For non-Vercel deployments, replace the `put`/`del` calls in `app/api/datasets/upload/route.ts` with an S3-compatible client.
- **CSV re-fetched on every dashboard view** — chart data is not cached in the database. On each `GET /api/dashboards/[id]`, the CSV is fetched from its blob URL and the aggregations are recomputed. This keeps the DB simple but adds one network round-trip per request.
- **Claude streams with adaptive thinking** — the generation endpoint uses `anthropic.messages.stream` with `thinking: { type: 'adaptive' }`. The thinking blocks are discarded; only the first text block is used.
- **Zod validates the AI response** — the parsed JSON from Claude is validated against `AIResponseSchema` in `lib/anthropic.ts` before it is written to the database.

---

## Authentication

### Provider setup

NextAuth.js v4 is configured in `lib/auth.ts` with two OAuth providers:

| Provider | Callback URL |
|---|---|
| Google | `/api/auth/callback/google` |
| GitHub | `/api/auth/callback/github` |

### Session flow

1. User clicks "Continue with Google/GitHub" on `/login`
2. NextAuth redirects to the provider's consent screen
3. On success, the `signIn` callback upserts the user into the `User` table (email as unique key)
4. The `session` callback fetches the internal DB user ID and attaches it to `session.user.id`
5. The session is stored as a JWT cookie (`NEXTAUTH_SECRET` signs it)

### Route protection

**Page routes** — `middleware.ts` uses `withAuth` from NextAuth. Any unauthenticated request to `/upload/*` or `/dashboard/*` is redirected to `/login?callbackUrl=...`.

**API routes** — each handler calls `requireSession()` from `lib/session.ts`:

```ts
const { userId, error } = await requireSession();
if (error) return error; // returns 401 JSON response
```

If the session is valid, `userId` is the authenticated user's DB ID. All subsequent DB queries are scoped to that `userId`.

### Ownership enforcement

Every mutable operation (read-by-id, delete) verifies that the resource's `userId` matches the session's `userId`. A mismatch returns `403 Forbidden`.

### Supabase PgBouncer requirement

`DATABASE_URL` must include `?pgbouncer=true`. Without it, Prisma uses named prepared statements which conflict with PgBouncer's connection pooling, causing `prepared statement "s0" already exists` errors (PostgreSQL error 42P05).

---

## Database Schema

Managed by Prisma. Source of truth: `prisma/schema.prisma`.

### User

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `email` | `String` | Unique — used as OAuth identity key |
| `name` | `String?` | From OAuth profile |
| `avatar` | `String?` | Profile image URL |
| `provider` | `String` | Always `"oauth"` currently |
| `createdAt` | `DateTime` | |
| `updatedAt` | `DateTime` | |

### Dataset

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `name` | `String` | Original filename without extension |
| `source` | `String` | `"csv"` (future: `"postgres"`, `"mysql"`) |
| `filePath` | `String?` | Full Vercel Blob URL, e.g. `https://xxxx.public.blob.vercel-storage.com/csvs/...` |
| `columns` | `Json` | Array of `ColumnMeta` objects |
| `rowCount` | `Int` | Total data rows |
| `userId` | `String?` | FK → User (Cascade delete) |
| `createdAt` | `DateTime` | Indexed |

Indexes: `userId`, `createdAt`

### Dashboard

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `title` | `String` | AI-generated |
| `description` | `String?` | AI-generated |
| `prompt` | `String` | The user's original prompt |
| `config` | `Json` | Full `DashboardAIResponse` from Claude |
| `theme` | `String` | Default `"default"` |
| `isPublic` | `Boolean` | Default `false` |
| `shareSlug` | `String?` | Unique slug for public sharing (future) |
| `userId` | `String?` | FK → User (Cascade delete) |
| `datasetId` | `String` | FK → Dataset |
| `createdAt` | `DateTime` | Indexed |
| `updatedAt` | `DateTime` | |

Indexes: `userId`, `datasetId`, `createdAt`

### Chart

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `type` | `String` | `bar \| line \| pie \| area \| scatter \| table \| metric` |
| `title` | `String` | AI-generated |
| `config` | `Json` | `ChartConfig` object |
| `position` | `Json` | `{ x, y, w, h }` for the 12-column grid |
| `dashboardId` | `String` | FK → Dashboard (Cascade delete) |

---

## API Reference

All endpoints require a valid session cookie. Unauthenticated requests return `401`. Requests for resources owned by another user return `403`.

---

### `POST /api/datasets/upload`

Upload a CSV file and create a Dataset record. The file is stored in Vercel Blob; the returned `filePath` is the full blob URL.

**Request:** `multipart/form-data`

| Field | Type | Constraints |
|---|---|---|
| `file` | `File` | `.csv` extension, max 10 MB |

**Response `200`:**
```json
{
  "dataset": {
    "id": "clxyz...",
    "name": "sales_data",
    "source": "csv",
    "filePath": "https://xxxx.public.blob.vercel-storage.com/csvs/1234-sales_data.csv",
    "columns": [ { "name": "Date", "type": "date", ... } ],
    "rowCount": 1500,
    "createdAt": "2026-04-20T..."
  },
  "preview": [ { "Date": "2024-01-01", "Revenue": "5000" }, ... ]
}
```

**Errors:** `400` (no file, wrong type, too large, empty CSV), `500`

---

### `GET /api/datasets`

List all datasets belonging to the authenticated user.

**Response `200`:**
```json
{
  "datasets": [
    { "id": "...", "name": "...", "source": "csv", "rowCount": 1500, "columns": [...], "createdAt": "..." }
  ]
}
```

---

### `GET /api/datasets/[id]`

Fetch a single dataset's metadata.

**Response `200`:** `{ "dataset": { ...full Dataset object... } }`

---

### `DELETE /api/datasets/[id]`

Delete a dataset record and its associated blob from Vercel Blob storage.

**Response `200`:** `{ "success": true }`

---

### `GET /api/datasets/[id]/preview`

Return the first 100 rows of a dataset's CSV. The CSV is fetched from its blob URL on each request.

**Response `200`:**
```json
{
  "datasetId": "...",
  "name": "sales_data",
  "rowCount": 1500,
  "columns": [...],
  "rows": [ { "Date": "2024-01-01", "Revenue": "5000" }, ... ]
}
```

---

### `POST /api/dashboards/generate`

Generate a dashboard from a dataset and a natural-language prompt.

**Request body (JSON):**

| Field | Type | Constraints |
|---|---|---|
| `datasetId` | `string` | Must belong to the authenticated user |
| `prompt` | `string` | 1–2000 characters |

**Response `200`:**
```json
{
  "dashboard": {
    "id": "...", "title": "...", "description": "...",
    "prompt": "...", "theme": "default", "isPublic": false,
    "datasetId": "...", "createdAt": "..."
  },
  "charts": [
    {
      "id": "...", "type": "bar", "title": "Revenue by Region",
      "config": { "xAxis": "Region", "yAxis": "Revenue", "aggregation": "sum", ... },
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "data": [ { "Region": "North", "Revenue": 45000 }, ... ]
    }
  ]
}
```

**Errors:** `400` (invalid body, dataset has no file), `403` (dataset not owned), `404` (dataset not found), `500` (Claude failure, blob fetch failure)

---

### `GET /api/dashboards`

List all dashboards belonging to the authenticated user.

**Response `200`:**
```json
{
  "dashboards": [
    {
      "id": "...", "title": "...", "description": "...", "prompt": "...",
      "theme": "default", "isPublic": false, "createdAt": "...", "datasetId": "...",
      "dataset": { "name": "sales_data", "rowCount": 1500 },
      "_count": { "charts": 5 }
    }
  ]
}
```

---

### `GET /api/dashboards/[id]`

Fetch a dashboard with fully-processed chart data. The CSV is fetched from Vercel Blob and aggregations are recomputed on each request.

**Response `200`:**
```json
{
  "dashboard": { "id": "...", "title": "...", "dataset": { "name": "...", "filePath": "https://...", "rowCount": ... }, ... },
  "charts": [ { "id": "...", "type": "...", "data": [...], "metricValue": 95000 } ]
}
```

---

### `DELETE /api/dashboards/[id]`

Delete a dashboard and all its charts (cascade).

**Response `200`:** `{ "success": true }`

---

## CSV Processing Pipeline

```
Raw CSV string
      │
      ▼
  PapaParse
  (header: true, skipEmptyLines, trim)
      │
      ▼
  analyzeColumns()          ← lib/csv-parser.ts
      │
      ├── For each column, sample up to 50 non-empty values
      ├── inferType(): numeric → date → categorical → text
      │     numeric:     ≥ 80% of sample passes isNumeric()
      │     date:        ≥ 70% of sample matches date patterns or Date.parse()
      │     categorical: uniqueCount/totalCount < 0.5 or uniqueCount ≤ 20
      │     text:        fallback
      └── Stats for numeric columns: min, max, mean
      │
      ▼
  ColumnMeta[]  (stored in Dataset.columns JSON column)
```

### Column type detection rules

| Type | Rule |
|---|---|
| `numeric` | ≥ 80% of sampled values parse as a number (strips `$`, `%`, `,`) |
| `date` | ≥ 70% match known date patterns or `Date.parse()` succeeds |
| `categorical` | unique-value ratio < 50% **or** fewer than 20 distinct values |
| `text` | anything else |

---

## AI Generation Pipeline

```
User prompt + ColumnMeta[]
        │
        ▼
  buildSystemPrompt()       ← lib/prompt-builder.ts
  (injects column schema into a structured system prompt)
        │
        ▼
  Claude claude-opus-4-6
  (adaptive thinking, system prompt cached with cache_control: ephemeral)
        │
        ▼
  Extract first text block from response
        │
        ▼
  Strip markdown fences → JSON.parse()
        │
        ▼
  AIResponseSchema.safeParse()   ← Zod validation in lib/anthropic.ts
  (validates title, description, charts array, positions, aggregation values)
        │
        ▼
  DashboardAIResponse
        │
        ▼
  fetch(dataset.filePath)        ← Vercel Blob URL
  parseCSV() → rows[]
        │
        ▼
  processChartData() / computeMetric()   ← lib/data-processor.ts
  (applies aggregations against CSV rows)
        │
        ▼
  prisma.dashboard.create()  (with charts: { create: [...] })
```

### Prompt caching

The system prompt (which contains the full column schema) is marked with `cache_control: { type: "ephemeral" }`. On repeated generation calls for the same dataset, Anthropic's API reuses the cached prompt prefix, reducing token cost and latency.

### AI response validation

Claude's response must conform to this Zod schema or the request fails with a 500:

- `title`: non-empty string, max 200 chars
- `description`: string, max 500 chars
- `charts`: array of 1–20 items, each with:
  - `type`: one of `bar | line | pie | area | scatter | table | metric`
  - `title`: non-empty string, max 200 chars
  - `config.aggregation`: one of `sum | avg | count | min | max | none`
  - `position.w`: integer 1–12, `position.x + w` must fit in a 12-column grid (enforced by the prompt, not the schema)

---

## Chart System

### Chart types

| Type | Description | Required config |
|---|---|---|
| `bar` | Vertical bar chart | `xAxis`, `yAxis`, `aggregation` |
| `line` | Line chart (good for time series) | `xAxis`, `yAxis`, `aggregation`, optional `dateGrouping` |
| `area` | Filled area chart | Same as line |
| `pie` | Pie / donut chart | `xAxis` (label), `yAxis` (value), `aggregation` |
| `scatter` | Scatter plot | `xAxis`, `yAxis` |
| `table` | Data table | `xAxis` (or any column) |
| `metric` | KPI card with a single value | `valueColumn`, `aggregation` |

### Data processing (`lib/data-processor.ts`)

`processChartData(config, rows)` applies the following in order:

1. **Date grouping** — if `dateGrouping` is set and `xAxis` is a date column, values are bucketed into day/week/month/year
2. **Aggregation** — rows are grouped by `xAxis` (and `groupBy` if set), then the `yAxis` column is aggregated with `sum | avg | count | min | max`
3. **Sorting** — by `sortBy` column in `sortOrder` direction
4. **Limiting** — top N rows if `limit` is set

`computeMetric(rows, column, aggregation)` applies a single aggregate over all rows for KPI cards.

### Grid layout

Charts use a 12-column grid. Each chart has a `position: { x, y, w, h }` where:
- `x` + `w` must be ≤ 12 (enforced by the AI prompt)
- `y` is the row offset (increments by the tallest chart in the previous row)
- The frontend renders positions using CSS Grid or `react-grid-layout`

---

## Security Model

### What's protected

| Attack | Mitigation |
|---|---|
| Unauthenticated page access | NextAuth `withAuth` middleware redirects to `/login` |
| Unauthenticated API access | `requireSession()` returns `401` before any DB query |
| Accessing another user's data | `userId` ownership check returns `403` |
| Oversized AI prompts | Zod schema caps `prompt` at 2000 characters |
| Malformed request bodies | `req.json()` wrapped in try/catch; Zod validates all fields |
| Invalid AI responses | Zod `AIResponseSchema` validates structure before DB write |
| Secrets in git | `.gitignore` blocks `.env` and all `.env.*` files |
| Clickjacking | `X-Frame-Options: DENY` header |
| MIME sniffing | `X-Content-Type-Options: nosniff` header |
| Missing env vars | `next.config.mjs` throws at startup if any required variable is absent |
| Orphaned blob on DB failure | Upload route calls `del(blobUrl)` in a `finally`-style catch if Prisma create fails |
| PgBouncer prepared statement conflicts | `DATABASE_URL` includes `?pgbouncer=true` |

### What's not yet protected

| Gap | Recommendation |
|---|---|
| No rate limiting | Add Upstash Ratelimit on `/api/datasets/upload` and `/api/dashboards/generate` |
| Blob URLs are publicly accessible | Vercel Blob `access: 'public'` means URLs are unguessable but not authenticated. For stricter privacy, generate short-lived download tokens via `@vercel/blob` `generateClientTokens` or migrate to private blobs. |
| No error monitoring | Integrate Sentry or similar |
| CSV re-fetched on every request | Cache processed chart data in the DB or use Redis |
