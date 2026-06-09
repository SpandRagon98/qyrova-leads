# Deployment

Qyrova Leads can be deployed in two modes.

## GitHub Pages

The workflow at `.github/workflows/deploy.yml` enables GitHub Pages and publishes the static
browser application after lint, tests, and build pass.

1. Push to `main`, or run **Verify and deploy** manually.
2. If an organization policy blocks automatic enablement, open **Settings > Pages** and select
   **GitHub Actions** as the source.

The static app works without a server for local lead management, CSV/Maps imports, scoring, templates, and manual outreach.

To connect live providers from GitHub Pages, deploy the API server and add this repository variable:

```text
VITE_API_BASE_URL=https://your-api.example.com
```

Re-run the workflow after setting the variable.

## Full application server

The Docker image serves both the built frontend and the integration API.

```bash
docker build -t qyrova-leads .
docker run --env-file .env -p 8787:8787 qyrova-leads
```

Open `http://localhost:8787`.

Every push to `main` also publishes:

```text
ghcr.io/spandragon98/qyrova-leads:latest
```

## Render

The included `render.yaml` is a Render Blueprint for the full Docker application.

1. Create a new Blueprint in Render.
2. Select this repository.
3. Set `APP_URL` to the final Render URL.
4. Set `CORS_ORIGINS` to the GitHub Pages URL if the static frontend will use this API.
5. Add only the provider credentials you intend to use.

For LinkedIn, set the callback URL in the LinkedIn developer console and in `LINKEDIN_REDIRECT_URI`:

```text
https://your-api.example.com/api/linkedin/callback
```

LinkedIn OpenID Connect identifies the signed-in user only. It does not enable prospect search or automated messaging.
