# ChipTech mobile app studio rebrand

## Direction

ChipTech leads with its own mobile apps. The homepage introduces the studio, features First Then Board, explains its family origin, and provides direct app, beta signup, and support links.

The central line is **Good apps. For real life.** The site uses product imagery and an illustrated routine example instead of general technology imagery. The illustration is labeled as an example. The actual iPad screenshot remains unmodified and is framed with CSS.

## Identity

- Navy: `#04093C`, sampled from the supplied favicon artwork.
- Gold: `#C9A227`, from the supplied vector logo.
- White: `#FFFFFF`.
- Light background: `#F8F7F2`.
- Interface type: Plus Jakarta Sans, with Arial fallback.
- Editorial accents: Georgia italic.

The new CT mark uses an app-shaped tile and a simplified guiding star. Wordmarks for dark and light backgrounds, SVG and PNG icons, an Apple touch icon, and a social image are in `assets/brand/`. The original branding assets remain available in `assets/` and Git history.

The same header, footer, typography, and colors carry through the app, support, and policy pages. Beta pages use the updated brand assets and colors with their existing form layout. Existing policy body text, consent language, beta invitation links, Worker code, database migrations, and hosting configuration are preserved.

## Recovery point

Git tag: `backup/pre-mobile-rebrand-2026-09-15`

Source commit: `a3584986e402e7a7ea15c60114ce735dcfc84955`

The annotated tag is pushed to GitHub. A separate complete-history Git bundle was created and verified locally before edits. This is a source backup. Runtime secrets and beta signup records are managed separately in Cloudflare and are not included in Git.

To inspect or rebuild the previous version without disturbing a current checkout:

```sh
git fetch origin --tags
git worktree add ../chiptech-original backup/pre-mobile-rebrand-2026-09-15
cd ../chiptech-original
npm ci
npm test
npm run build
```

## Validation

- Production asset build passes.
- All 17 existing backend tests pass.
- JavaScript syntax check passes.
- All 7 HTML pages pass local link and asset checks, covering 160 references.
- Each page has one main landmark, one H1, unique IDs, and image alternative text.
- Navigation open/close, Escape, focus return, outside click, and link selection pass in a local DOM test.
- All three stylesheets parse without syntax or property validation errors.
- Existing main privacy, terms, and beta privacy text matches the backup after normalizing HTML formatting whitespace.
- New logo and social image exports were visually inspected.

Browser visual QA remains pending. The app's browser tool reported that it could not verify its required security policy, for both the live website and local preview. Desktop and phone layouts still need to be inspected in an actual browser before production deployment. DOM tests do not establish rendered layout quality.

## Review and release

Work is isolated on `codex/mobile-studio-rebrand`. The production branch is `main`; it automatically deploys to Cloudflare. This draft has not been merged or deployed.

For a static design preview, run `npm run build` and serve `dist/` with a local HTTP server. For Worker behavior, use `npm run dev`. Keep production secrets and tester records out of local design fixtures.
