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
Required configuration: `TURNSTILE_SITE_KEY`, `GOOGLE_ADMIN_EMAIL`, `GOOGLE_GROUP_EMAIL`.
Google Workspace delegation needs only the Directory group member scope.
Use a private tester group and limit membership visibility to managers.

Invitation tokens are hashed in D1 and provided in the URL fragment. Never commit invitation tokens or tester records.
Turnstile must return the current hostname and the `beta_signup` action.
The database prevents duplicate email records. Failed group enrollment remains pending and is retried every 15 minutes, up to five attempts.
`BETA_OPEN` must remain `false` until Google Play has an installable closed release and the group is configured as eligible testers.
Registration does not opt a tester into Google Play; the tester must accept the Google Play testing invitation separately.

## Migration rollback

The old Netlify site remains available at `magenta-bonbon-076e06.netlify.app`.
Previous web records were A `@` -> `75.2.60.5` and CNAME `www` -> `magenta-bonbon-076e06.netlify.app`, DNS only, automatic TTL.
They were retained under `netlify-rollback` and `www-netlify-rollback` in Cloudflare DNS.
To roll back, detach the two Worker custom domains and restore the previous web records. Preserve all email and verification records.

Cloudflare Workers Builds is connected to `ChipTechLLC/firstthen-website`, production branch `main`.
Its build command is `npm test && npm run build`, followed by `npx wrangler deploy`.
Non-production branch builds are disabled to keep unreviewed changes away from production bindings.
