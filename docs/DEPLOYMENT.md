# Cloudflare Pages Deployment

Qyrova Leads uses:

- React and Vite on Cloudflare Pages
- Pages Functions for provider searches, LinkedIn OpenID Connect, and cloud persistence
- Cloudflare D1 for workspace snapshots and temporary OAuth records
- Cloudflare Access for user identity and workspace isolation
- Browser `localStorage` as an offline fallback

## 1. Cloudflare resources

Create:

1. A Pages project named `qyrova-leads-app` connected to this GitHub repository.
2. A D1 database named `qyrova-leads`.

Cloudflare's Git integration handles production deployment. GitHub Actions verifies the code but
does not require a Cloudflare API token.

## 2. D1 binding

The production database ID is configured in `wrangler.jsonc`:

```text
Variable name: DB
Database: qyrova-leads
```

The application runs `CREATE TABLE IF NOT EXISTS` through the D1 runtime binding on its first API
request. A remote schema import from GitHub Actions is not required.

## 3. Pages build settings

Open **Workers & Pages → qyrova-leads-app → Settings → Builds** and use:

```text
Production branch: main
Build command: npm run build
Build output directory: dist
Root directory: /
```

Every push to `main` is deployed by Cloudflare. The GitHub workflow only runs lint, tests, the
Vite build, and the Pages Functions compiler.

## 4. Protect workspace sync

The cloud workspace endpoint rejects anonymous requests by default.

Create a Cloudflare Zero Trust Access application for the production hostname and allow only the
email addresses that should use this CRM. Pages Functions use
`CF-Access-Authenticated-User-Email` as the D1 workspace key.

Do not set `ALLOW_ANONYMOUS_SYNC=true` in production unless a deliberately shared workspace is
acceptable.

## 5. Pages variables

Open **Workers & Pages → qyrova-leads-app → Settings → Variables and Secrets**.

Plain variables:

```text
APP_URL=https://qyrova-leads-app.pages.dev
OSM_NOMINATIM_URL=https://nominatim.openstreetmap.org
DIRECTORY_NAME=Public directory
DIRECTORY_API_URL_TEMPLATE=
DIRECTORY_API_KEY_HEADER=Authorization
DIRECTORY_API_KEY_PREFIX=Bearer
DIRECTORY_RESULTS_PATH=results
LINKEDIN_REDIRECT_URI=https://qyrova-leads-app.pages.dev/api/linkedin/callback
TELEGRAM_WORKSPACE_ID=owner@example.com
```

Encrypted secrets:

```text
GOOGLE_PLACES_API_KEY
YELP_API_KEY
OSM_CONTACT_EMAIL
DIRECTORY_API_KEY
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
```

Only configure providers you intend to use.

## 6. Provider requirements

### Google Places

Enable Places API (New), attach a billing account, restrict the key to Places API, set a small
quota, and configure billing alerts.

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
profile scraping, automated visits, and automated messages remain unsupported.

### Telegram enquiry bot

1. Message `@BotFather` in Telegram, run `/newbot`, and copy the bot token.
2. Generate a separate webhook secret containing 24-256 letters, numbers, underscores, or hyphens.
3. In Cloudflare Pages, add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` as encrypted secrets.
4. Set `TELEGRAM_WORKSPACE_ID` to the lowercase Cloudflare Access email that owns the Qyrova
   workspace. For an explicitly shared anonymous deployment, use the exact
   `ANONYMOUS_WORKSPACE_ID` instead.
5. Confirm that `APP_URL` is the exact production origin with no path or trailing slash, then
   redeploy after saving the variables.
6. Open Qyrova once and wait for **Cloudflare D1 sync** to show ready.
7. Open **Settings → Lead source connections** and choose **Connect Telegram**.
8. Open the displayed bot link, send `/start`, and complete the four-question enquiry.

The token and webhook secret remain server-side. Telegram updates are authenticated, deduplicated,
and mapped only to the configured workspace. The app checks D1 every ten seconds so new Telegram
leads appear without a manual refresh.

## 7. Local development

Copy `.dev.vars.example` to `.dev.vars`, then run:

```bash
npm install
npm run db:migrate:local
npm run dev:cloudflare
```

Open `http://127.0.0.1:8788`.

## 8. Deployment verification

After Cloudflare's production deployment succeeds:

1. Open `https://qyrova-leads-app.pages.dev/api/health`.
2. The health request initializes the D1 tables automatically.
3. Confirm `databaseConfigured` and `databaseReady` are both `true`.
4. Open the D1 database and confirm the tables are present.
5. Sign in through Cloudflare Access.
6. Open Settings and confirm **Cloudflare D1 sync** is displayed.
7. Add a test lead, refresh, and verify it remains.
8. Test only configured providers.
9. If Telegram is configured, submit a test enquiry and confirm it appears once with source
   **Telegram**.
