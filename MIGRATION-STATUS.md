# Cloudflare migration and Android beta signup

Updated September 14, 2026.

## Completed

- The Cloudflare Worker `chiptech-website` serves the website assets and backend.
- Both `chiptechllc.com` and `www.chiptechllc.com` are active custom domains with valid HTTPS responses.
- Cloudflare Workers Builds is connected to this GitHub repository, restricted to this repository, with automatic deployments from `main`. A real Git-triggered build succeeded.
- The existing public pages, styles, script, and app-ads.txt matched the deployed asset contents during verification.
- Google Workspace email DNS records were preserved. Netlify rollback records are documented in README.md.
- D1 database and signup schema are deployed.
- Turnstile widget is created for chiptechllc.com. Its secret is encrypted in the Worker; its public site key is in configuration.
- Private Google group `android-beta@chiptechllc.com` exists (Admin console ID `01mrcu09217igyx`). Members cannot see other members or group conversations. Administrators can add external members; ordinary users cannot.
- That group is saved in the Google Play Alpha closed testing track (`4698194921065361138`). Feedback address is support@chiptechllc.com. Google Play has no closed release yet, and the changes still require the applicable publishing/review flow.
- Eleven local automated tests pass, including the Google JWT signature, narrow scope, duplicate enrollment, pending retry, invitation validation, request limits, Turnstile validation, consent, and closed-release gating.
- Phone-width UI was tested at 390 pixels without horizontal overflow using a local fixture. Fixture signup reached the correct waiting-list confirmation. This did not enroll a real tester or validate live Google enrollment.
- QR PNG/SVG and activation SQL were generated privately under ignored artifacts/community-01. The PNG was decoded and confirmed to match its invitation URL.

## Remaining before distributing the QR code

1. Complete the separate Google Cloud sign-in verification.
2. Create the service identity and configure its group access. Prefer ownership limited to the tester group if supported by the chosen API. The current Directory adapter supports delegated group membership scope; no delegation or service-account credential has been granted yet.
3. Store the Google credential as a Worker secret and configure group settings.
4. Verify a real signup and Google group membership. Do not send invitations or messages to unrelated people as test data.
5. Apply the invitation activation SQL and enable BETA_ACCEPTING only after verification.
6. Keep BETA_OPEN=false until the closed release is available and eligibility settings are published.

At the last local DNS check, the local resolver had cached an empty answer from cutover. Cloudflare authoritative DNS, 1.1.1.1, and 8.8.8.8 returned the correct Cloudflare addresses. HTTPS checks using those addresses with the real hostnames passed. Recheck ordinary local resolution after the negative cache expires.

The signup is deliberately not accepting submissions yet. Neither automatic Google enrollment nor an installable closed beta has been verified live.
