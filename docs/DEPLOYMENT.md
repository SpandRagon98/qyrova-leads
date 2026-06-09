# Cloudflare Pages Deployment

Qyrova Leads uses one production architecture:

- React and Vite static assets on Cloudflare Pages
- Pages Functions for provider searches, LinkedIn OpenID Connect, and cloud persistence
- Cloudflare D1 for workspace snapshots and temporary OAuth records
- Cloudflare Access for user identity and workspace isolation
- Browser `localStorage` as an offline fallback

## 1. Create the Cloudflare resources

Create a free Cloudflare account, then create:

1. A Pages project named `qyrova-leads` using **Direct Upload**.
2. A D1 database named `qyrova-leads`.
3. A custom Cloudflare API token with:
   - Account / Cloudflare Pages / Edit
   - Account / D1 / Edit

Record the account ID, API token, and D1 database ID.

## 2. Bind D1 to Pages

The deployment workflow replaces the placeholder D1 ID in `wrangler.jsonc` and deploys the
binding as:

```text
Variable name: DB
Database: qyrova-leads
```

The committed all-zero database ID is deliberately invalid for production. This prevents an
accidental deployment before the GitHub variable is configured.

## 3. Configure GitHub

In `SpandRagon98/qyrova-leads`, open **Settings → Secrets and variables → Actions**.

Add repository secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Add repository variables:

```text
CLOUDFLARE_D1_DATABASE_ID=<the D1 database UUID>
CLOUDFLARE_PAGES_PROJECT=qyrova-leads
```

The workflow applies `migrations/0001_initial.sql`, builds the application, and deploys `dist`.

## 4. Protect workspace sync

The cloud workspace endpoint rejects anonymous requests by default.

Create a Cloudflare Zero Trust Access application for the production hostname and allow only the
email addresses that should use this CRM. Pages Functions use
`CF-Access-Authenticated-User-Email` as the D1 workspace key.

Do not set `ALLOW_ANONYMOUS_SYNC=true` in production unless a deliberately shared, public
workspace is acceptable.

## 5. Configure Pages variables

Open **Workers & Pages → qyrova-leads → Settings → Variables and Secrets**.

Plain variables:

```text
APP_URL=https://qyrova-leads.pages.dev
OSM_NOMINATIM_URL=https://nominatim.openstreetmap.org
DIRECTORY_NAME=Public directory
DIRECTORY_API_URL_TEMPLATE=
DIRECTORY_API_KEY_HEADER=Authorization
DIRECTORY_API_KEY_PREFIX=Bearer
DIRECTORY_RESULTS_PATH=results
LINKEDIN_REDIRECT_URI=https://qyrova-leads.pages.dev/api/linkedin/callback
```

Encrypted secrets:

```text
GOOGLE_PLACES_API_KEY
YELP_API_KEY
OSM_CONTACT_EMAIL
DIRECTORY_API_KEY
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
```

Only configure the providers you intend to use.

## 6. Provider requirements

### Google Places

Enable Places API (New), attach a billing account, restrict the key to Places API, set a small
quota, and configure billing alerts. Google billing is mandatory even when usage remains inside
an allowance.

### Yelp

Create an official Yelp Places API application and add its API key. Available allowances and
plans can change.

### OpenStreetMap

Set an identifying contact email. Use Nominatim only for small, user-triggered searches. Do not
use the public service for bulk extraction or systematic business discovery.

### Public directory

Use only an API whose terms permit this use. The URL template supports:

```text
{query}
{location}
{limit}
```

### LinkedIn

Create a LinkedIn developer app, enable **Sign in with LinkedIn using OpenID Connect**, and add
the exact production callback URL. This connects the current user's identity only. Lead search,
profile scraping, automated visits, and automated messages remain intentionally unsupported.

## 7. Local full-stack development

Copy `.dev.vars.example` to `.dev.vars`, then run:

```bash
npm install
npm run db:migrate:local
npm run dev:cloudflare
```

Open `http://127.0.0.1:8788`.

Local development enables the shared `local` D1 workspace. Provider values in `.dev.vars` remain
untracked.

## 8. Deployment verification

After the workflow succeeds:

1. Open `/api/health` and confirm `databaseConfigured` is `true`.
2. Sign in through Cloudflare Access.
3. Open Settings and confirm **Cloudflare D1 sync** is displayed.
4. Add a test lead, refresh, and verify it remains.
5. Test only configured providers.
6. Complete LinkedIn sign-in and verify the app returns to the LinkedIn workspace.
