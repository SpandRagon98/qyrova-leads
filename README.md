# Qyrova Leads

Qyrova Leads is a compliant lead discovery and manual outreach workspace for Qyrova quotation
and invoice software.

## Features

- Browser CRM for leads, scoring, statuses, campaigns, templates, and follow-ups
- Google Places, Yelp, OpenStreetMap, and permitted public-directory searches
- Google Maps, CSV, TSV, JSON, and KML imports
- CSV and XLSX exports plus complete JSON backup and restore
- Cloudflare D1 persistence protected by Cloudflare Access
- Offline browser persistence when cloud sync is unavailable
- Official LinkedIn OpenID Connect for the signed-in user's identity
- Manual LinkedIn profile review, message generation, copying, and contact tracking
- Personalized email drafts and `mailto:` handoff

LinkedIn scraping, prospect API access without approval, automatic profile visits, and automated
messages are not implemented.

## Stack

- React 19 and Vite
- Cloudflare Pages and Pages Functions
- Cloudflare D1
- Cloudflare Access
- Papa Parse and `write-excel-file`

## Local Development

Requirements: Node.js 22.12 or newer.

Frontend-only development:

```bash
npm install
npm run dev
```

Full Cloudflare development:

```bash
copy .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev:cloudflare
```

Open `http://127.0.0.1:8788` for the full-stack environment.

## Commands

```bash
npm run dev                 # Vite frontend
npm run dev:cloudflare      # Pages assets, Functions, and local D1
npm run db:migrate:local    # Apply the D1 schema locally
npm run build               # Production frontend
npm run lint
npm test
npm run check
```

## Project Structure

```text
.github/workflows/  code verification
docs/               deployment and provider setup
functions/
  _shared/          Pages Function helpers and provider adapters
  api/              serverless API routes
migrations/         D1 schema
src/
  app/              application shell
  components/       reusable interface components
  features/         feature modules
  hooks/            local and cloud state orchestration
  pages/            application pages
  services/         browser storage, cloud sync, and API clients
  styles/           responsive application styles
  utils/            imports, exports, scoring, and templates
```

## Deployment

The workflow at `.github/workflows/deploy.yml` verifies every pull request and push to `main`.
Cloudflare Pages deploys `main` through its native GitHub integration. D1 tables are initialized
automatically on the first API request.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for D1, Cloudflare Access, Pages build settings,
provider credentials, LinkedIn callback configuration, and go-live verification.

## Data and Compliance

Provider credentials remain in Pages Functions. D1 workspaces are keyed by the authenticated
Cloudflare Access email. Browser storage remains an offline fallback and can be exported at any
time.

Use only provider APIs and directories whose terms permit your intended use. LinkedIn outreach
remains manual and user-controlled.
