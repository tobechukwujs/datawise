# DashWise

Turn any CSV into a live, AI-generated dashboard in seconds. Upload a spreadsheet, describe what you want to see in plain English, and get a fully-rendered chart grid instantly — no SQL, no drag-and-drop.

## Features

- **CSV upload** — drag-and-drop or browse, up to 10 MB
- **Smart column detection** — automatically classifies dates, numbers, and categories
- **Plain-English prompts** — describe your dashboard; Claude builds it
- **Live chart grid** — bar, line, area, pie, scatter, table, and KPI metric cards
- **OAuth sign-in** — Google and GitHub, no passwords
- **Per-user data isolation** — each user only sees their own datasets and dashboards

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v4 (Google + GitHub OAuth) |
| Database | PostgreSQL via Supabase + Prisma ORM |
| File Storage | Vercel Blob |
| AI | Anthropic Claude (claude-opus-4-6) |
| Charts | Recharts |
| Animations | Framer Motion |
| Validation | Zod |

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Supabase recommended)
- Anthropic API key
- Google and/or GitHub OAuth app credentials
- Vercel project with Blob storage enabled

### 1. Clone and install

```bash
git clone https://github.com/tobechukwujs/datawise.git
cd datawise
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root with the following values:

```
DATABASE_URL="postgresql://user:password@db.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@db.supabase.co:5432/postgres"
ANTHROPIC_API_KEY="your-api-key"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-oauth-id"
GITHUB_CLIENT_SECRET="your-github-oauth-secret"
GOOGLE_CLIENT_ID="your-google-oauth-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

`NEXTAUTH_SECRET` can be generated with:

```bash
openssl rand -base64 32
```

`BLOB_READ_WRITE_TOKEN` is provided automatically when you add Blob storage to your Vercel project (see Deployment section).

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase pooler connection string (port 6543) — must include `?pgbouncer=true` |
| `DIRECT_URL` | Yes | Supabase direct connection string (port 5432, used by Prisma Migrate) |
| `NEXTAUTH_SECRET` | Yes | Random secret for signing session tokens |
| `NEXTAUTH_URL` | Yes | Full URL of the app (`http://localhost:3000` in dev) |
| `ANTHROPIC_API_KEY` | Yes | Key from [console.anthropic.com](https://console.anthropic.com) |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud OAuth client secret |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token — auto-injected when Blob storage is connected in Vercel dashboard |
| `USE_MOCK_AI` | No | Set `true` to skip Claude and return hardcoded charts (for UI dev) |

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Go to **Storage** in the Vercel dashboard → **Create** → **Blob** → connect to the project. This auto-injects `BLOB_READ_WRITE_TOKEN`.
4. Add all remaining environment variables from the table above in **Settings → Environment Variables**
5. Set `NEXTAUTH_URL` to your production domain (e.g. `https://datawise-pi.vercel.app`)
6. Ensure `DATABASE_URL` includes `?pgbouncer=true` (required for Supabase PgBouncer)
7. Update your OAuth app redirect URIs:
   - Google: `https://yourdomain.com/api/auth/callback/google`
   - GitHub: `https://yourdomain.com/api/auth/callback/github`

### Other platforms

The app requires a writable object store for CSV uploads. On non-Vercel platforms, replace `@vercel/blob` with an S3-compatible client (AWS S3, Supabase Storage, Cloudflare R2) and update `app/api/datasets/upload/route.ts`.

## Project Structure

```
datawise/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── dashboards/           # Dashboard CRUD + AI generation
│   │   └── datasets/             # Dataset upload + preview
│   ├── dashboard/                # Dashboard list + detail + new
│   ├── login/                    # Sign-in page
│   └── upload/                   # CSV upload page
├── components/
│   ├── charts/                   # ChartRenderer, MetricCard
│   ├── providers/                # SessionProvider wrapper
│   └── ui/                       # Navbar, FileUpload, PageTransition
├── lib/
│   ├── anthropic.ts              # Claude API + Zod response validation
│   ├── auth.ts                   # NextAuth options
│   ├── csv-parser.ts             # PapaParse wrapper + column inference
│   ├── data-processor.ts         # Aggregation + chart data transforms
│   ├── prisma.ts                 # Prisma client singleton
│   ├── prompt-builder.ts         # System prompt construction
│   └── session.ts                # requireSession() server helper
├── prisma/
│   └── schema.prisma             # Database schema
├── types/                        # Shared TypeScript types
└── middleware.ts                 # Route protection (NextAuth)
```

## License

MIT
