# ChipTech website

Public ChipTech website, hosted on Cloudflare Workers with static assets. First Then Board is available from the App Store and Google Play.

## Development

Use Node.js 22.13 or newer. Run `npm ci`, `npm test`, and `npm run build`.
`npm run dev` starts Wrangler locally. `npm run deploy` deploys the site.
Only `dist/` is uploaded as public assets. Keep credentials and private records out of Git.

## Production

Worker: `chiptech-website`. Domains: `chiptechllc.com` and `www.chiptechllc.com`.
Cloudflare Workers Builds is connected to `ChipTechLLC/firstthen-website`, production branch `main`.
Its build command is `npm test && npm run build`, followed by `npx wrangler deploy`.
Non-production branch builds are disabled.

## Closed-test retirement, October 25, 2026

- Public buttons link directly to the stores. The former signup form and its browser assets are no longer published.
- `/android-beta`, `/android-beta/`, and `/android-beta/index.html` redirect to the public Google Play listing. The redirect strips query parameters and explicitly clears any old invitation fragment.
- Former signup/config API routes return HTTP 410 without reading input or accessing external services. Old signup privacy links redirect to the Past Website Registrations section of the current privacy policy.
- The scheduled handler is a no-op and the cron list is empty. No automatic enrollment, invitation, reminder, or Premium-code emails are sent by the deployed Worker.
- Database, email, and signup rate-limit bindings were removed from the website. This does not delete the private D1 database `chiptech-beta-signups` (`1597b538-7638-4c64-8d9a-44d850570e26`), its audit/code records, or existing Google Group members. Existing Premium entitlements are unaffected.
- The old service modules, migrations, and email documentation are historical source references only. The public Worker does not import them. Do not redeploy an older enrollment Worker as a routine site rollback; it can restart enrollment and emails.
- Past registrations remain private for outstanding support/access requests, subject to the updated privacy notice. No new announcement campaign was sent as part of this change.

## Hosting and Netlify retirement

Cloudflare manages website hosting, domain registration, and authoritative DNS. Source code remains in GitHub; ordinary email remains in Google Workspace.

The Netlify account was deleted on September 15, 2026 after verifying both production domains, all 26 published files, and the live Cloudflare bindings. The former Netlify site returns HTTP 404. Both Netlify rollback DNS records were removed. Do not restore the retired Netlify origin.

For recovery, use Git history and Cloudflare Worker deployments with the closed-test retirement constraints above. A verified Git bundle was saved locally under ignored artifacts/netlify-retirement before Netlify account closure.
