# Qyrova Leads

Qyrova Leads is a compliant lead discovery and outreach workspace for Qyrova quotation and
invoice software. It combines a browser-based CRM with opt-in business data providers, file
imports, lead scoring, campaign tracking, and deliberately manual LinkedIn outreach.

## Features

- Google Places, Yelp, OpenStreetMap, and owner-approved directory searches through a server proxy
- Google Maps, CSV, TSV, JSON, and KML imports
- Lead scoring, pipeline tracking, campaigns, templates, and follow-up dates
- Dedicated LinkedIn workspace for saved profile URLs and personalized message drafts
- Official LinkedIn OpenID Connect for the signed-in user's own identity
- CSV and XLSX exports plus JSON backup and restore
- Local-first persistence with no lead database required
- Responsive, route-split React interface

LinkedIn prospect search, profile scraping, auto-visiting, and automated messaging are not
implemented. LinkedIn's generally available APIs do not authorize those workflows.

## Quick Start

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4173`. The browser-only features work without provider credentials.

For live provider searches, copy `.env.example` to `.env`, configure the providers you need, and
run the frontend and API in separate terminals:

```bash
npm run dev:server
npm run dev
```

Never commit `.env` or expose provider secrets through `VITE_*` variables.

## Commands

```bash
npm run dev          # Vite development server
npm run dev:server   # Integration API with file watching
npm run build        # Production frontend
npm start            # Production API and built frontend
npm run lint         # ESLint
npm test             # Vitest
npm run check        # Lint, tests, and production build
```

## Project Structure

```text
.github/workflows/   CI, GitHub Pages, and container publishing
docs/                Deployment documentation
server/
  config/            Environment configuration
  middleware/        Request controls
  providers/         Lead-source adapters
  routes/            Integration and LinkedIn endpoints
  services/          Shared server services
src/
  app/               Application shell and page loading
  components/        Reusable UI
  features/          Feature-specific modules
  hooks/             State orchestration
  pages/             Route-level screens
  services/          Browser API and persistence clients
  styles/            Application styles
  utils/             Imports, exports, scoring, and templates
```

## Provider Setup

Use `.env.example` as the complete configuration reference.

- **Google Places API (New):** requires billing, quota controls, and a server-restricted key.
- **Yelp:** requires an official Yelp API key.
- **OpenStreetMap:** requires an identifying contact email and is intended for small manual
  searches under Nominatim's usage policy.
- **Public directory:** accepts an app-owner-controlled JSON endpoint template. Browser users
  cannot supply arbitrary upstream URLs.
- **LinkedIn:** supports OpenID Connect for the current user's basic profile only. Add the exact
  server callback URL to the LinkedIn developer application.

## Deployment

Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. Installs locked dependencies and runs `npm run check`.
2. Publishes the static frontend to GitHub Pages.
3. Publishes the full Docker image to `ghcr.io/spandragon98/qyrova-leads`.

The included `render.yaml` deploys the full application as a Render Docker web service. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for GitHub Pages, API, Docker, Render, CORS, and LinkedIn
callback configuration.

## Data and Compliance

Lead data is stored in the current browser's `localStorage`. Provider credentials stay on the
server. The application searches only configured APIs, imports files supplied by the user, and
keeps LinkedIn review and sending under direct user control.
