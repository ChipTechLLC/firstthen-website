# ChipTech website

Static ChipTech website and an invitation-only Android beta signup backend, hosted on Cloudflare Workers with static assets.

## Development

Use Node.js 22.13 or newer. Run `npm ci`, `npm test`, and `npm run build`.
`npm run dev` starts Wrangler locally. `npm run deploy` deploys the site.

## Production

Worker: `chiptech-website`. Domains: `chiptechllc.com` and `www.chiptechllc.com`.
D1 binding: `BETA_DB`. Apply schema with `npx wrangler d1 migrations apply chiptech-beta-signups --remote`.
Only `dist/` is uploaded as public assets. Keep credentials out of Git.

Signup remains disabled until `BETA_ACCEPTING` is set to `true` and the integrations are verified.
Required secrets: `TURNSTILE_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON`.
Required configuration: `TURNSTILE_SITE_KEY`, `GOOGLE_GROUP_RESOURCE` (the Cloud Identity resource name).
Google Cloud Identity uses a service account that owns only the tester group, with the cloud-identity.groups scope and no admin impersonation or domain-wide delegation.
Use a private tester group and limit membership visibility to managers.

Invitation tokens are hashed in D1 and provided in the URL fragment. Never commit invitation tokens or tester records.
Turnstile must return the current hostname and the `beta_signup` action.
The database prevents duplicate email records. Failed group enrollment remains pending and is retried every 15 minutes, up to five attempts.
`BETA_OPEN` must remain `false` until Google Play has an installable closed release and the group is configured as eligible testers.
Registration does not opt a tester into Google Play; the tester must accept the Google Play testing invitation separately.

## Hosting and Netlify retirement

Cloudflare hosts the website assets, signup Worker, D1 database, Turnstile protection, and beta notification sender. Cloudflare also manages chiptechllc.com registration and authoritative DNS. Source code remains in GitHub; ordinary email and tester-group membership remain in Google Workspace.

The Netlify account was deleted on September 15, 2026 after verifying both production domains, all 26 published files, and the live Cloudflare bindings. The former Netlify site returns HTTP 404. Both Netlify rollback DNS records were removed. Do not restore the retired Netlify origin.

For recovery, use Git history and Cloudflare Worker deployments. A verified Git bundle was saved locally under ignored artifacts/netlify-retirement before account closure.

Cloudflare Workers Builds is connected to `ChipTechLLC/firstthen-website`, production branch `main`.
Its build command is `npm test && npm run build`, followed by `npx wrangler deploy`.
Non-production branch builds are disabled to keep unreviewed changes away from production bindings.
