# Beta email workflow

The existing 15-minute scheduled worker handles email after group enrollment retries.

- With `BETA_EMAIL_ENABLED=true` and a verified Cloudflare `EMAIL` binding, existing and new registrants receive one signup confirmation while the beta is closed.
- After the closed release is confirmed available, set `BETA_OPEN=true` in wrangler.jsonc and deploy. This simultaneously enables the installation link in the signup response and queues launch instructions for every successfully enrolled account. Do not turn this on for a draft or unapproved Play release.
- Registrants arriving after opening receive installation instructions rather than an outdated waiting-list email.
- Messages go to each recipient separately and reply to support@chiptechllc.com. There are no tracking pixels or marketing messages.
- The sender uses a dedicated notification subdomain. Existing Workspace MX records remain unchanged.
- Up to ten messages are processed per scheduled run, capped at 90 send attempts per UTC day. Extra messages stay queued. This bounds this application's email usage to at most 2,790 attempts per month; other Workers/email usage can still incur account-level charges.

## Verification and operations

Inspect `beta_notifications` in D1 for status, provider receipt, attempts, and sanitized error. `sent` means Cloudflare accepted the send, not proof of inbox placement. Cloudflare Email logs show delivery/bounce status.

The unique signup/kind key and atomic claim prevent routine duplicates. Explicit rate-limit rejections retry later. Unknown or interrupted sends are marked `unknown` and require checking Cloudflare logs before requeuing; do not retry an uncertain delivery blindly.

A tester can reply to support to request removal. Remove the corresponding signup record and Google group membership when processing the request; the notification processor joins against current signups so deleted registrations are not mailed again. Keep the email opt-out request in the support workflow until fulfilled.

Pause email by setting `BETA_EMAIL_ENABLED=false` and deploying. Signup/group enrollment continue independently.
