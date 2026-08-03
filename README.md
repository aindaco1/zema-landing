# ZEMA Vinyl Lounge

A cinematic, scroll-led landing page for ZEMA Vinyl Lounge at Hotel Zazz in Albuquerque. It is intentionally a small static site: Jekyll, HTML, SCSS, and framework-free JavaScript, deployable on GitHub Pages.

## What the site does

- Scrubs a 14.6-second, all-intra sequence that moves directly from the clean overhead-vinyl shot into the drink-preparation montage and continues to the last frame before the photograph flash.
- Turns the middle gallery into three sequential scroll-controlled film movements: arrival, cocktails, and dance.
- Falls back to a poster for reduced-motion and Save-Data visitors.
- Presents the full-width ZEMA file with hours, policies, and FAQs in normal document flow.
- Scrubs from the agent awakening through the final tilt to the record as the full inquiry-section background, with the readable form and copy layered above it.
- Uses the official ZEMA marks and a film-still gallery informed by the Research & Planning brand board.
- Collects venue and event inquiries through Formspree, with native POST as a no-JavaScript fallback.
- Presents the complete 3:36 film through a local poster/play facade that creates the privacy-enhanced YouTube player only after play intent.
- Uses a spinning ZEMA vinyl pointer on fine-pointer devices, with native form cursors and a reduced-motion fallback.
- Keeps the compact header transparent and makes every in-page anchor jump immediately.
- Uses no framework, animation dependency, analytics, or externally hosted font; the napkin-inspired film-title face is a 7 KB self-hosted WOFF2 subset.

## Run locally

Requirements: Ruby, Bundler, and the GitHub Pages gem bundle.

```sh
bundle install
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/zema-landing/`.

Build the production output with:

```sh
bundle exec jekyll build
```

## Regression tests

The Playwright suite builds and serves the Jekyll site on an isolated local port, then exercises the production interaction in Chromium:

- repeated hero forward and reverse scrubbing, including its intended scroll pacing;
- repeated first and third gallery clip forward and reverse scrubbing;
- full-width, media-free dossier layout and inquiry montage scrubbing;
- reduced-motion static fallbacks and deferred video hydration;
- axe-backed WCAG 2.2 AA, keyboard, focus, target-size, and form-error behavior;
- footer/logo structure, cache-version consistency, and desktop/mobile overflow;
- responsive reflow across phone portrait/landscape, tablet, laptop, desktop, and wide desktop viewports;
- byte-range delivery for the native media-loading fallback.
- canonical/social metadata, LocalBusiness JSON-LD, crawl files, and share-image delivery.

Install and run it locally with:

```sh
npm install
npx playwright install chromium
npm test
```

Focused accessibility and SEO gates are also available:

```sh
npm run test:accessibility
npm run test:seo
```

Failures retain a screenshot, video, and Playwright trace in `test-results/`. The same suite runs automatically for pull requests and pushes to `main` via `.github/workflows/regression.yml`.

## Project map

```text
_config.yml                  Site URL, metadata, and Jekyll settings
_data/frames.yml             All public content, URLs, hours, FAQs, and media paths
_includes/head.html          Metadata and LocalBusiness structured data
_includes/frame-video.html   Sticky scroll-story hero
_includes/frame-dossier.html Lounge information and FAQ dossier
_includes/frame-form.html    Venue inquiry form
_includes/frame-film.html    Complete-film player
_layouts/default.html        Header, main landmark, footer, and script
assets/css/                  SCSS reset, theme, layout, and sections
assets/fonts/                Self-hosted film-title subset and its OFL license
assets/js/main.js            Scroll sync, lazy media, header, and form enhancement
assets/media/                Optimized production media
index.html                   Page composition
tests/e2e/                   Playwright browser regression coverage
playwright.config.js         Isolated Jekyll test server and browser settings
robots.txt / sitemap.*       Generated crawl directives and public URL inventory
docs/ACCESSIBILITY_SEO.md    Audit baseline and manual release checks
docs/BRAND_GUIDE.md          Brand, voice, color, type, image, and layout system
scripts/                     Deterministic production-mode test server
.github/workflows/           Regression suite for pull requests and main
agents.md                    Current product and engineering guardrails
```

## Content and settings

Edit [`_data/frames.yml`](_data/frames.yml) for public-facing copy, hours, contact details, external links, form endpoint, and media paths. The current hours and policies were taken from the Hotel Zazz ZEMA Vinyl Lounge page; verify them with the venue before launch and whenever operating hours change. Creative direction, official logo art, film chapter names, and credits were cross-checked against the Notion Research & Planning board and the original 18-page proposal.

`asset_version` in `_config.yml` is appended to the compiled CSS, JavaScript, and every scrub-video URL. Bump it whenever those files change so browsers cannot combine a new page with a stale interaction script or failed media response.

The inquiry form posts to Formspree form `xdaqrwyo` in the `Zema Vinyl Lounge Website` project. The client-side handler gives an inline result, while a normal browser POST still works if JavaScript is unavailable. The endpoint is public by design; no Formspree API key is stored in this repository. The complete-film credits are transcribed from the film's final credit card at `3:32–3:35`.

## Media

Current production assets are:

| Asset | Purpose | Approx. size |
| --- | --- | ---: |
| `zema-scroll.mp4` | 14.6-second vinyl-to-drink-prep hero scrub, 1440×810 H.264, every frame independently seekable | 7.8 MB |
| `zema-gallery-arrival.mp4` | 20.75-second agent/arrival scrub, 720p all-intra H.264 | 9.7 MB |
| `zema-gallery-cocktails.mp4` | 10.6-second cocktails scrub, 720p all-intra H.264 | 4.5 MB |
| `zema-gallery-dance.mp4` | 15.75-second dance scrub, 720p all-intra H.264 | 8.8 MB |
| `zema-inquiry-scrub.mp4` | 25.5-second agent-awakening-to-record scrub, 720p all-intra H.264 | 13 MB |
| `zema-hero-poster.webp` | 1920×1080 initial/LCP poster | 143 KB |
| `zema-inquiry-poster.webp` | 1920×1080 inquiry scrub fallback | 51 KB |
| `zema-vinyl-cursor.webp` | 256×256 transparent custom-pointer asset | 7 KB |
| `zema-vinyl-cursor.svg` | Editable source for the ZEMA-labeled pointer | 703 KB |
| `zema-film-poster.webp` | 1920×1080 complete-film poster/social image | 100 KB |
| `zema-*.webp` | Additional 1920×1080 gallery stills and 1200×1200 official logos | 74–225 KB each |

Recreate the scrub derivative from the master with FFmpeg:

```sh
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]trim=start=15.223542:end=16.766750,setpts=PTS-STARTPTS[v0];[0:v]trim=start=40.832458:end=53.845458,setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0,scale=1440:810:flags=lanczos,fps=24000/1001,setpts=PTS-STARTPTS[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset medium -crf 26 -profile:v high -level 4.1 \
  -pix_fmt yuv420p -g 1 -keyint_min 1 -bf 0 -refs 1 \
  -sc_threshold 0 -an -avoid_negative_ts make_zero \
  -movflags +faststart zema-scroll.mp4
```

The two hero ranges preserve the overhead vinyl shot at `15.223542–16.766750` and the drink-preparation sequence at `40.832458–53.845458`, removing the intervening lounge material. The join lands on native scene boundaries.

The gallery sources use the same all-intra settings at 1280×720. Their master-film ranges are `58.75–79.5`, `84.2–94.8`, and `160.0–175.75` seconds. The arrival panel opens on the agent reading the file and now uses the same edge-to-edge `cover` presentation as the cocktails and dance panels, keeping all three movements visually consistent. The inquiry scrub covers `186.52–212.02`, beginning on the first agent frame after the disco-ball cut and ending on the last clean record frame before the credits. These are high-quality delivery encodes, not lossless encodes. Lossless video would be dramatically larger without improving the source. Every frame in each scrub derivative is an I-frame, so the browser can seek to any frame without decoding a preceding group of pictures.

## Interaction model

The hero is a tall section with a `position: sticky` viewport. A passive scroll listener maps the section's native scroll progress to the all-intra H.264 video's `currentTime`. Before a scrub becomes interactive, its derivative is buffered into a local Blob so rapid seeking cannot cancel an in-flight range read and leave the decoder in an intermittent error state. Posters remain visible during that short load. The gallery divides its longer scroll progress into thirds and hydrates one movement at a time, with the next clip staged near the end of the current movement to reduce memory and decoder contention. The inquiry montage fills that section behind a dark contrast treatment and maps the section's ordinary viewport passage to video time. Coalesced seeks always resolve to the latest scroll position, including rapid direction changes. None of these interactions captures wheel or touch events, locks the page, or requires autoplay.

The custom vinyl pointer follows fine mouse/trackpad input and spins with CSS; it never captures clicks. Touch/coarse-pointer devices do not render it, reduced-motion visitors receive a static record, and text/form inputs retain their native cursor. In-page links use the browser's immediate fragment jump with compact-header clearance.

The complete film uses `youtube-nocookie.com` video ID `Qb-E5il1lZ0`. Following the Pool campaign-page pattern, the initial page contains only a local poster and native play button; JavaScript creates the remote iframe after that button is activated and starts playback from that explicit user action. The repository does not ship a second local copy of the complete film.

The fixed soundtrack control uses the film mix from the first needle drop at `13.90` seconds through the final audio tail at `215.78`. Its sources are a 64 kbps VBR Opus WebM (primary) and an 80 kbps AAC M4A (compatibility fallback); the browser selects and downloads only one. Source URLs live in `_data/frames.yml` and render through a single include. They remain unset until an idle task runs after page load, are skipped automatically for Save-Data visitors, and hydrate immediately when someone explicitly enables sound. Playback loops muted by default, so sound always requires a user action.

## Accessibility and performance rules

- Keep one page-level `h1`, logical landmarks, real labels, and native `details`/`summary` controls.
- Keep every essential lounge fact as selectable HTML text in the full-width dossier.
- Preserve visible focus states and a skip link.
- Keep inactive scrub beats `inert` whenever they are hidden from assistive technology.
- Keep visible controls at least 24 × 24 CSS pixels and test the page at 320 px.
- Do not remove the reduced-motion or Save-Data poster fallbacks.
- Keep the hero poster eagerly loaded; keep the gallery, inquiry, soundtrack, and YouTube media lazy.
- Test keyboard navigation, VoiceOver, 200%/400% zoom, iOS Safari, Android Chrome, YouTube captions, and the live Formspree endpoint before launch.

The current accessibility and SEO implementation, audit findings, and remaining manual checks are documented in [`docs/ACCESSIBILITY_SEO.md`](docs/ACCESSIBILITY_SEO.md). Metadata intentionally uses conservative `WebSite`, `WebPage`, and `BarOrPub` structured data; do not add fake FAQ, review, rating, offer, or event schema.

## Deploy to GitHub Pages

Pushes to `main` build and deploy through the pinned Actions workflow in `.github/workflows/pages.yml`. The workflow packages Jekyll's `_site` output as the Pages artifact and publishes it to the `github-pages` environment.

The configured project URL is `https://aindaco1.github.io/zema-landing/`.

If a custom domain is added, update `url` and `baseurl` in `_config.yml`, then restrict the Formspree form to the production domain.
