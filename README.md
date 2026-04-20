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

### 1. Clone and install

```bash
git clone https://github.com/your-username/dashwise.git
cd dashwise
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in every value in `.env` — see [.env.example](.env.example) for descriptions. The `NEXTAUTH_SECRET` can be generated with:

```bash
openssl rand -base64 32
```

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
| `DATABASE_URL` | Yes | Supabase pooler connection string (port 6543) |
| `DIRECT_URL` | Yes | Supabase direct connection string (port 5432, used by Prisma Migrate) |
| `NEXTAUTH_SECRET` | Yes | Random secret for signing session tokens |
| `NEXTAUTH_URL` | Yes | Full URL of the app (`http://localhost:3000` in dev) |
| `ANTHROPIC_API_KEY` | Yes | Key from [console.anthropic.com](https://console.anthropic.com) |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud OAuth client secret |
| `USE_MOCK_AI` | No | Set `true` to skip Claude and return hardcoded charts (for UI dev) |

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from the table above in the Vercel dashboard
4. Set `NEXTAUTH_URL` to your production domain (e.g. `https://dashwise.vercel.app`)
5. Update your OAuth app redirect URIs:
   - Google: `https://yourdomain.com/api/auth/callback/google`
   - GitHub: `https://yourdomain.com/api/auth/callback/github`

### Other platforms

The app is a standard Next.js server — any platform that supports Node.js works (Railway, Render, Fly.io, etc.). Run `npm run build && npm start`.

## Project Structure

```
dashwise/
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
├── middleware.ts                 # Route protection (NextAuth)
└── .env.example                  # Environment variable template
```

## Contributing

1. Fork the repo and create a branch: `git checkout -b feature/my-feature`
2. Make your changes and run `npm run build` to confirm it compiles
3. Open a pull request

## License

MIT
