# Quality assurance

**Audience:** developers, designers, reviewers, release owners, and software agents

**Purpose:** map project risks to repeatable automated and manual checks

**Last verified:** August 29, 2026

## Quality model

The suite treats the site as a browser experience, not a set of isolated functions. Jekyll builds the production markup first; a local byte-range-capable server serves the project from `/`, matching `https://zemabar.com/`; Playwright then exercises Chromium with real layout, media, focus, and network behavior.

Automation protects known contracts. It does not replace editorial review, assistive-technology testing, cross-browser judgment, or venue fact confirmation.

## Environment

Match CI where practical:

- Ruby 3.3 with the Bundler version recorded in `Gemfile.lock`.
- Node.js 24.
- Playwright's managed Chromium.

Install once:

```sh
bundle install
npm ci
npx playwright install chromium
```

`npm ci` is preferred for repeatable validation. Use `npm install` only when intentionally changing JavaScript dependencies and the lockfile.

## Test commands

| Command | Use |
| --- | --- |
| `npm run test:docs` | Required handbook files, duplicate headings, trailing whitespace, and relative links |
| `npm run test:content` | Pages CMS, public-content, service-boundary, and nine-slot media-manifest contract |
| `npm run test:uploader` | Worker types/dry-run bundle plus five Miniflare/R2 request tests |
| `npm run test:workflows` | GitHub Actions syntax, expression contexts, shell, and dependency checks |
| `npm test` | Content, documentation, Worker, and complete 16-test browser release gate |
| `npm run test:accessibility` | Focused WCAG, interaction-state, keyboard, and form checks |
| `npm run test:seo` | Focused metadata, JSON-LD, sitemap, and social-image checks |
| `npm run test:regression:headed` | Interactive browser diagnosis |
| `bundle exec jekyll build` | Production Jekyll/Sass build |

The Playwright server uses a unique port when `PW_TEST_PORT` is supplied:

```sh
PW_TEST_PORT=44020 npm test
```

This is useful when another local Jekyll process is running.

## Automated coverage

### Content and editorial control plane

`scripts/validate-content.js` verifies:

- required text, public HTTPS links, phone format, YouTube ID, and machine-readable opening hours;
- exactly four hero beats and three gallery movements;
- valid focal-point percentages and existing canonical output files for all nine media slots;
- Pages CMS ownership of `_data/frames.yml`, merge preservation, editorial-media containment, and exclusion of Formspree/brand assets;
- immutable Formspree endpoint and one-to-one alignment between `_admin/media-slots.json` and `_data/frames.yml`.

`_admin/uploader/test/uploader.spec.ts` verifies the Worker fails closed without Access configuration, returns authorized slot data, rejects invalid source types, creates/cancels R2 multipart uploads, and protects raw-source streaming with its independent bearer token. Type generation, strict TypeScript, and a real Wrangler dry-run bundle are part of the same command.

### Accessibility and SEO

`tests/e2e/accessibility-seo.spec.js` verifies:

- axe rules tagged through WCAG 2.2 AA at desktop and 320 px;
- one `h1`, language, landmarks, skip-link focus, visible focus, and minimum target size;
- hidden narrative states are `inert` and contain no hidden focus targets;
- native FAQ and form keyboard behavior;
- accessible required-field names and validation recovery;
- polite success/assertive error semantics;
- soundtrack and YouTube facade accessible names and keyboard operation;
- canonical URL, title, description, robots directives, Open Graph, Twitter cards, social image, and conservative JSON-LD;
- reachable `robots.txt`, sitemap, and JPEG social image.

### Interaction and media

`tests/e2e/regression.spec.js` verifies:

- repeated forward and reverse hero scrubbing;
- first and third gallery scrubbing and staged hydration;
- the compact, full-width, media-free dossier;
- repeated inquiry montage scrubbing;
- Save-Data soundtrack deferral and explicit sound intent;
- YouTube deferral until play and pointer handoff;
- opaque black compact header, immediate anchor jumps, and vinyl pointer behavior;
- typography family roles and self-hosted font loading;
- reduced-motion fallbacks and zero hydrated scrub videos;
- one cache version across versioned runtime assets;
- three equal footer tracks, icon targets, address/phone parity, and mobile clearance;
- `206` byte-range responses for representative video and audio assets.

### Responsive matrix

The layout test checks these viewports:

| Width × height | Risk represented |
| --- | --- |
| `320×568` | Minimum-width/short phone |
| `360×640` | Small phone |
| `390×844` | Modern phone portrait |
| `430×932` | Large phone portrait |
| `568×320` | Short phone landscape |
| `760×1024` and `768×1024` | Footer/header breakpoint boundary and tablet |
| `900×1200` | Gallery breakpoint boundary |
| `1024×768` | Landscape tablet/small laptop |
| `1101×800` | Film-header breakpoint boundary |
| `1440×900` | Desktop |
| `1920×1080` | Wide desktop |

At each size the test asserts zero document/section overflow, usable header gutters, all three navigation items, contained hero copy, equal address/phone sizing, one-line footer credit, fixed-audio containment, and the expected gallery/film/footer column count.

## Change-to-test matrix

| Change | Minimum validation | Additional review |
| --- | --- | --- |
| Copy, hours, contact, events URL, credits | `npm run test:seo`, `npm test` | Compare visible facts with venue source |
| CSS token, typography, header, footer, breakpoint | `npm test` | 320 px, short landscape, desktop, zoom, forced colors |
| Scroll geometry or scrub controller | `npm test` | Repeated forward/reverse real-browser scrub |
| Video/audio/poster replacement | Full decode, metadata/keyframe checks, `npm test` | Editorial first/last frames and production range request |
| Pages CMS schema or editable boundary | `npm run test:content`, `npm test` | Pages CMS save/preview and generated commit scope |
| Uploader, R2, Access, or GitHub App bridge | `npm run test:uploader`, `npm test` | Authenticated multipart upload, cancellation, release dispatch, and secret-free logs |
| Raw-media processor/workflow | Temp-source transcode, `npm test` | GitHub run, report artifact, generated diff, live ranges, and rollback commit |
| Form fields or Formspree behavior | `npm run test:accessibility`, `npm test` | Live success/failure delivery and no-JS POST |
| Metadata/schema/canonical/domain | `npm run test:seo`, `npm test` | Search Console/Rich Results after deploy |
| YouTube facade or soundtrack | `npm test` | Keyboard, captions, sound consent, Save-Data |
| Jekyll, dependencies, scripts, workflows | `bundle exec jekyll build`, `npm test` | CI logs and Pages artifact |
| Documentation only | Jekyll build, link/command review | Confirm no stale duplicated value |

## Manual release checklist

### Content and conversion

- Confirm hours, happy hour, last call, food, parking, reservation guidance, address, phone, and event link with the venue.
- Submit the production Formspree form and confirm delivery to the intended verified recipient.
- Disable JavaScript and confirm the form can still post normally.
- Open address, phone, Instagram, Events, Dust Wave, and Phantasmagoria links.
- Check that copy describes the venue rather than the implementation.

### Accessibility

- Safari + VoiceOver on macOS and iOS: landmarks, headings, FAQs, form, soundtrack, and YouTube player.
- Keyboard only: skip link, navigation, every summary/form/button/link, error recovery, and player controls.
- Zoom to 200% and 400%; test text zoom where available.
- Test Windows High Contrast or `forced-colors` equivalent.
- Confirm published YouTube captions and their accuracy.
- Confirm no essential content depends on a video frame, color, pointer, hover, or motion.

### Responsive and browser

- iOS Safari and Android Chrome on at least one physical device each.
- Chrome/Safari/Firefox desktop at common laptop and wide-desktop sizes.
- Short landscape phone and 320 px width.
- Safe-area behavior on a notched device.
- Footer/audio clearance at the bottom of the page.

### Motion and performance

- Rapidly scrub hero, first gallery clip, third gallery clip, and inquiry section in both directions.
- Enable Reduced Motion and verify meaningful posters and no rotating pointer.
- Enable a Save-Data simulation and verify media deferral.
- Confirm no audible playback before explicit intent.
- Confirm YouTube network activity begins only after play.
- Check that the hero poster—not the MP4—is the LCP candidate.

### Production

- The Pages workflow succeeds on the exact ordinary `main` commit, or the media-release workflow succeeds and deploys the exact generated commit.
- Public URL returns `200` over HTTPS.
- Representative media range request returns `206` with 1024 bytes.
- Browser console has no unexplained error.
- Canonical, sitemap, JSON-LD, and social-image URLs use the production host.

The detailed accessibility/SEO checklist lives in [Accessibility and SEO baseline](ACCESSIBILITY_SEO.md).

## Failure artifacts and diagnosis

CI retains Playwright reports, screenshots, videos, and traces for seven days when a regression fails. Locally, artifacts live under `test-results/` and `playwright-report/`; both are ignored by Git.

Useful diagnosis sequence:

1. Read the first failing assertion and its viewport/state.
2. Run the one named test with Playwright's `-g` filter.
3. Re-run headed.
4. Inspect the trace before changing timing tolerances.
5. Fix the underlying state/geometry/network contract; do not simply add sleeps.

Example:

```sh
npx playwright test -g "hero repeatedly" --headed
```

## Quality budgets

- Accessibility/SEO/best-practice Lighthouse target: 95+.
- Exactly one page `h1`.
- Zero horizontal overflow at 320 px and above.
- No unexplained console errors.
- CSS below 20 KB gzip; current build approximately 7.0 KB.
- JavaScript below 8 KB gzip; current build approximately 4.1 KB.
- Current production media below approximately 15 MB per file and GitHub's 100 MB hard limit.

Measure compressed code after a production build:

```sh
bundle exec jekyll build
gzip -c _site/assets/css/main.css | wc -c
gzip -c _site/assets/js/main.js | wc -c
```

## CI contract

The composite `.github/actions/verify-site` action owns one DRY release gate: checksum-verified actionlint, Ruby/Node setup, dependency installation, Chromium, `npm test`, and the production Jekyll build. Pull requests invoke it through the regression workflow. Ordinary `main` pushes invoke it through the Pages workflow before any artifact upload. Media releases invoke it after generation and rebase but before push and deployment. CI uses Node 24 and pinned official Actions.

The media workflow additionally installs `cwebp`, checks the required FFmpeg encoders, streams the private source, validates the generated diff, commits locally, and retains a release report for 30 days. A failure before the push leaves `main` and production unchanged; do not treat an uploaded R2 object as a release.

Do not delete or weaken a regression because it complicates a visual change. If a documented contract is intentionally changing, update the experience/design decision, implementation, test, and relevant handbook page in the same pull request.
