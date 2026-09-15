# Cloudflare migration and Android beta signup

Updated September 15, 2026.

## Completed

- The Cloudflare Worker `chiptech-website` serves the website assets and backend.
- Both `chiptechllc.com` and `www.chiptechllc.com` are active custom domains with valid HTTPS responses.
- Cloudflare Workers Builds is connected to this GitHub repository, restricted to this repository, with automatic deployments from `main`. A real Git-triggered build succeeded.
- The existing public pages, styles, script, and app-ads.txt matched the deployed asset contents during verification.
- Google Workspace email DNS records were preserved. Netlify was retired after migration verification; see README.md.
- D1 database and signup schema are deployed.
- Turnstile widget is created for chiptechllc.com. Its secret is encrypted in the Worker; its public site key is in configuration.
- Private Google group `beta@chiptechllc.com` (previous address retained as an alias) exists (Admin console ID `01mrcu09217igyx`). Members cannot see other members or group conversations. Owners and managers can manage membership and add external members; tester members cannot manage or view other members.
- That group is saved in the Google Play Alpha closed testing track (`4698194921065361138`). Feedback address is support@chiptechllc.com. Google Play has no closed release yet, and the changes still require the applicable publishing/review flow.
- Seventeen local automated tests pass, including the Google JWT signature, narrow scope, duplicate enrollment, pending retry, invitation validation, request limits, Turnstile validation, consent, and closed-release gating.
- Phone-width UI was tested at 390 pixels without horizontal overflow using a local fixture. Fixture signup reached the correct waiting-list confirmation. This did not enroll a real tester or validate live Google enrollment.
- QR PNG/SVG and activation SQL were generated privately under ignored artifacts/community-01. The PNG was decoded and confirmed to match its invitation URL.

## Signup verification

- The Google Cloud Identity API is enabled in `chiptech-beta-enrollment`. Its service account owns only `beta@chiptechllc.com`, without administrator impersonation or project roles.
- `GOOGLE_SERVICE_ACCOUNT_JSON` is encrypted in Cloudflare. The group resource was resolved through the live Google API as `groups/01mrcu09217igyx`.
- A real browser signup for the owner's account passed the production Turnstile check, saved consent and device selection in D1, and added that account to Google Groups on the first attempt. Membership was independently verified in Google Admin. No external tester account has been used for this verification.
- The community-01 invitation is active and BETA_ACCEPTING=true. The printable letter-size flyer is in ignored output/pdf and its rendered QR code was decoded and matched against the invitation URL.
- The temporary project exception for key creation was removed and the inherited restriction shows Enforced. The temporary Organization Policy Administrator role was removed after setup.
- Seventeen automated tests pass. Local DNS caching has cleared and ordinary HTTPS works.

## Release still pending

BETA_OPEN remains false. Google Play closed testing must have an approved, available release before installation is possible. Signup adds eligibility automatically; testers must separately accept Google's testing invitation with the same account. Registration does not itself complete that opt-in. Cloudflare automatic signup confirmations are enabled. Once an approved closed release is available, setting BETA_OPEN=true and deploying also starts the invitation email queue. Google Play publication is not automatically detected. See docs/BETA-EMAILS.md.

Enrollment failures are retried every 15 minutes, up to five attempts. Inspect pending records and last_error in D1 if a provider outage or account issue occurs. Routine successful registrations require no manual additions.

## Email verification

Cloudflare sending is enabled for notify.chiptechllc.com with authenticated DNS and a sender-restricted Worker binding. Google Workspace MX records remain intact. Migration 0002 is applied. A scheduled-handler test against live Cloudflare resources sent one welcome email to the owner’s registered account and recorded a provider receipt. A repeated run did not send another welcome. Automated tests cover release gating, concurrent processing, rate-limit retries, ambiguous-send handling, and the daily sending cap. Delivery acceptance does not prove inbox placement.

## Netlify retirement, September 15, 2026

Verified both custom domains are enabled on the production chiptech-website Worker. All 26 published asset files matched the local build byte for byte. Cloudflare API confirmed the live assets, D1, email and protection bindings. Public registry data identifies Cloudflare as the domain registrar, with Cloudflare authoritative nameservers. No runtime Netlify references were found in the website source.

Netlify showed one project and one team, on the free plan with no saved card, invoices or receipts. Forms and Identity were not enabled. After explicit final approval, user deletion completed and returned the browser to login. The former Netlify site now returns 404, while both website domains and the beta page continue returning 200. Both obsolete Netlify rollback DNS records were removed. Google Workspace MX records were preserved.

The Netlify GitHub App was uninstalled and its Netlify Auth OAuth authorization revoked. GitHub confirmed revocation and the installed-app list now contains only Cloudflare Workers and Pages.
