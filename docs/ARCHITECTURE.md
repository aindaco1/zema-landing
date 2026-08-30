# Technical architecture

**Audience:** developers, technical owners, reviewers, and software agents

**Purpose:** describe the production system, its boundaries, and the runtime data flow

**Last verified:** August 30, 2026

## Architecture summary

ZEMA is a statically generated, single-page Jekyll site. Liquid templates render structured YAML content into semantic HTML; Jekyll compiles SCSS; one framework-free JavaScript file progressively enhances scroll media, audio, the YouTube facade, the custom pointer, and form feedback. GitHub Actions verifies and builds the site, and GitHub Pages serves the output over HTTPS.

The public site has no application server, database, client-side router, package runtime, or analytics SDK. A separate authenticated editorial control plane uses Pages CMS for content commits and a Cloudflare Worker/R2 uploader for private raw masters; none of that code executes for public visitors.

```mermaid
flowchart LR
    CMS["Pages CMS\nGitHub-authenticated editing"] --> A["_data/frames.yml\ncontent and service URLs"]
    U["Cloudflare Access\nprotected uploader"] --> R2["Private R2 raw master\n30-day retention"]
    R2 --> S["Bearer-only source Worker"]
    S --> M["Media release Action\ntranscode and verify"]
    M --> A
    M --> D["Editorial derivatives"]
    A --> B["Liquid templates\nand Jekyll"]
    C["SCSS tokens and partials"] --> B
    D --> B
    FONTS["Protected marks and fonts"] --> B
    B --> E["Static _site artifact"]
    E --> F["GitHub Pages CDN"]
    F --> G["Browser: semantic HTML first"]
    G --> H["main.js progressive enhancement"]
    H --> I["Local scrub media\non proximity"]
    H --> J["YouTube iframe\non play intent"]
    H --> K["Formspree\non form submission"]
```

## Technology boundary

| Layer | Choice | Reason |
| --- | --- | --- |
| Source and templates | Jekyll, Liquid, YAML | Supported by GitHub Pages; readable by non-framework specialists |
| Markup | Static semantic HTML | Fast first render, robust fallback, accessible browser behavior |
| Styling | SCSS compiled and compressed by Jekyll | Shared tokens and primitives without a client runtime |
| Interaction | Framework-free JavaScript | The behavior is small, page-specific, and based on native browser APIs |
| Media | Local optimized derivatives plus local posters | Reliable scroll seeking and controlled LCP |
| Content editing | Pages CMS over the Git repository | Owner-friendly editing without a runtime CMS or second content database |
| Raw-media processing | Access-protected admin Worker, bearer-only source Worker, private R2, and GitHub Actions | Large-master upload, automatic derivatives, and test-gated publication without committing raw files |
| Complete film | `youtube-nocookie.com` facade | Native video controls and captions without a second large local master |
| Inquiry delivery | Formspree | Static-site-compatible delivery with native POST fallback |
| Hosting | GitHub Pages | No server maintenance, low cost, HTTPS, and history-backed deployment |
| Testing | Playwright and axe-core | Browser-level contracts for interaction, accessibility, responsive layout, and network behavior |

See [the decision record](DECISIONS.md) for alternatives and tradeoffs.

## Repository map

| Path | Responsibility |
| --- | --- |
| `_config.yml` | Host/base path, cache version, Sass and build exclusions |
| `_data/frames.yml` | Public content model, venue facts, form endpoint, external links, film credits, and media paths |
| `.pages.yml` | Pages CMS schema, editable fields, media boundaries, and commit behavior |
| `_admin/media-slots.json` | Shared upload/transcode/output contract for all nine editable media slots |
| `_admin/uploader/` | Shared role-gated Worker code, private R2 multipart/source APIs, tests, framework-free admin UI, and both deployment configs |
| `index.html` | Ordered page composition and the inline intro/gallery sections |
| `_layouts/default.html` | Document shell, skip link, global header/footer, soundtrack, pointer, and script loading |
| `_includes/head.html` | Metadata, social cards, canonical URL, preload, and JSON-LD |
| `_includes/frame-*.html` | Hero, dossier, inquiry, and complete-film section templates |
| `_includes/site-audio.html` | Single soundtrack element and control |
| `assets/css/_theme70s.scss` | Design tokens and shared SCSS placeholders |
| `assets/css/_reset.scss` | Global inheritance, focus, selection, and reduced-motion reset |
| `assets/css/_layout.scss` | Header, footer, soundtrack, pointer, and global layout |
| `assets/css/_frame.scss` | Page-section layout and responsive behavior |
| `assets/js/main.js` | All progressive enhancement behavior |
| `assets/media/editorial/` | CMS-editable and pipeline-generated production media |
| `assets/media/` and `assets/fonts/` | Protected marks, icon, pointer, and licensed title fonts |
| `tests/e2e/` | Browser contracts and accessibility/SEO checks |
| `scripts/serve-test-site.sh` | Deterministic production-mode Jekyll build and byte-range-capable local server |
| `scripts/check-docs.js` | Dependency-free handbook presence, heading, whitespace, and relative-link validation |
| `scripts/validate-content.js` | Content/CMS/media-manifest ownership and integrity contract |
| `scripts/media/` | Private-source download, deterministic derivative generation, decoding, and release-scope validation |
| `.github/actions/verify-site/` | DRY full-site verification and production-build composite action |
| `.github/workflows/` | Pull-request regression, GitHub Pages, and atomic media-release pipelines |

## Content and rendering model

`_data/frames.yml` is the only public content model. Templates access it as `site.data.frames`; the same fields feed visible text, links, the form, audio sources, film metadata, social metadata, and LocalBusiness structured data. Pages CMS edits that file directly through repository commits; it does not introduce another content store.

This avoids a common static-site failure mode: duplicating venue facts in visible HTML, metadata, and schema. Opening hours, address, phone, and Instagram should be changed in YAML and then verified in both rendered content and JSON-LD.

The page has no client-side route. The production site is served from the root of `https://zemabar.com`, so `_config.yml` uses an empty `baseurl`. Liquid's `relative_url` and `absolute_url` filters keep root-relative assets and canonical metadata aligned with that origin.

Pages CMS exposes copy, public links, the YouTube ID, reorderable visitor notes/FAQs/credits/production links, and web-ready editorial media. Its schema keeps Formspree/service fields, official marks, the favicon, and pointer assets out of the editor. CMS media fields store root-relative public URLs such as `/assets/media/editorial/example.webp`; `_admin/media-slots.json` retains repository-relative filesystem paths, and the shared media contract derives the public form so CMS and raw-media releases converge. The content validator enforces four hero beats, three gallery movements, valid focal percentages, canonical derivative paths, and the protected service boundary before either release path can deploy.

## Editorial and media control plane

Content-only changes and raw-media changes share the same tested `main`/Pages destination but use different inputs:

- Pages CMS commits `_data/frames.yml` and web-ready files under `assets/media/editorial/`. A normal `main` push runs the complete shared verification action before Pages deployment.
- The protected uploader accepts an editorially final raw master for one declared slot. It uses browser-to-Worker multipart requests, stores the object below `incoming/` in private R2, and dispatches `media-release.yml` through a repository-scoped GitHub App.
- The uploader and source endpoints deploy the same role-gated Worker module. Cloudflare Access covers the complete admin Worker, while the separate source Worker exposes only `/pipeline/source` and requires the independent bearer secret shared with GitHub Actions.
- The media Action streams the private source from that source-only Worker to runner-temporary storage, checks its declared type, duration, codec, dimensions, and size, then writes only the canonical outputs declared in `_admin/media-slots.json`.
- Video outputs are silent all-intra H.264 and receive a WebP poster generated from their exact first encoded frame. Images are cropped from a percentage focal point. Soundtrack outputs preserve source loudness.
- The Action validates the exact diff, rebases on current `main`, runs the same content/docs/Worker/browser/build gate as an ordinary release, and only then pushes and deploys. A failure leaves both `main` and production unchanged.

Raw files never enter Git. R2 lifecycle policy expires completed raw objects after 30 days and aborts incomplete multipart uploads after one day. The admin Worker is protected by Cloudflare Access and independently validates the Access JWT. The source deployment rejects every admin route and its single download route requires a separate bearer secret shared only with GitHub Actions.

## JavaScript subsystem boundaries

`assets/js/main.js` is a single private IIFE. It does not expose globals. The major responsibilities are deliberately separated by functions and `data-*` hooks:

| Subsystem | Hooks and APIs | Contract |
| --- | --- | --- |
| Hero scrub | `data-scrub-*`, passive scroll, `requestAnimationFrame` | Map native section progress to media time and expose one narrative beat |
| Gallery scrub | `data-gallery-*`, `IntersectionObserver` | Divide progress into thirds; hydrate current/next video only |
| Inquiry scrub | `data-inquiry-*`, `IntersectionObserver` | Map ordinary section passage to a full-section background clip |
| Media hydration | `fetch`, Blob URLs, native `video.src` fallback | Buffer each scrub before rapid seeks; preserve poster until the requested frame is decoded and painted |
| Soundtrack | `data-site-audio-*`, idle callback | Remain muted by default; skip automatic hydration under Save-Data |
| Vinyl pointer | `data-vinyl-cursor`, pointer media query | Fine pointers only; never capture clicks; preserve native form/player cursors |
| Complete film | `data-youtube-*` | Create the privacy-enhanced iframe once, after explicit play intent |
| Inquiry form | `data-inquiry-form`, Fetch/FormData | Enhance native POST with inline success/error state; restore the submit control |
| Cleanup | `pagehide` | Pause media and revoke Blob URLs |

JavaScript hooks are behavior APIs. Renaming a `data-*` hook requires updating templates, code, and tests together.

## Scroll-scrub architecture

Each scroll sequence uses an ordinary tall section and a sticky viewport. No wheel or touch handler changes the user's scroll position.

1. Geometry converts section position into a clamped `0…1` progress value.
2. A scrub controller stores only the latest requested progress.
3. One animation-frame callback assigns `video.currentTime` when metadata is ready.
4. `seeked` and `progress` events request the latest position again, so direction reversals converge instead of replaying stale requests.
5. Every frame in the derivative is independently decodable, removing long group-of-pictures seek dependencies.
6. Blob hydration prevents rapid seeks from cancelling the same in-flight HTTP range load; native source loading remains the fallback.

This combination—not a lossless codec—is what makes scrubbing reliable. See [Media pipeline](MEDIA_PIPELINE.md).

## Progressive enhancement and failure modes

The static document is complete before JavaScript runs:

- posters are present for every decorative motion section;
- public facts and film credits are HTML;
- FAQs use native `details`/`summary`;
- anchors are normal fragment links and jump immediately;
- the inquiry form has a normal `action` and `method`;
- the complete film has a native button facade and a `noscript` iframe fallback.

When Reduced Motion or Save-Data is active, scrub sections receive a static state and avoid unnecessary video hydration. If Blob fetch fails, media falls back to its ordinary URL. If enhanced form submission fails, the page announces the failure and offers the phone number; without JavaScript, the browser submits directly to Formspree.

## External services and privacy

| Service | When contacted | Data shared |
| --- | --- | --- |
| GitHub Pages | On every site request | Standard web request data |
| Formspree | Only when the inquiry form is submitted | The fields the visitor entered |
| YouTube privacy-enhanced domain | Only after play intent; or through the `noscript` fallback | Standard embed/player request data |
| Hotel Zazz, Google Maps, Instagram, Dust Wave, Phantasmagoria | Only after an external link is activated | Standard outbound navigation data |
| Pages CMS and GitHub | Only while an authorized editor changes content | GitHub identity and the repository commit |
| Cloudflare Access, Worker, and R2 | Only while the owner uploads a raw master | Access identity, upload metadata, and private source bytes |
| GitHub Actions | Only for repository or media releases | Release payload and temporary private-source stream |

The public site sets no first-party analytics cookies and contains no tracking pixel. No API key or private credential belongs in committed source; the public Formspree endpoint is intentionally public. Editorial-plane secrets live in Cloudflare Worker secrets or GitHub Actions secrets.

## Performance model and budgets

- The hero poster is preloaded and is the intended LCP resource; the MP4 is not.
- Gallery, inquiry, soundtrack, and complete-film resources defer until proximity, idle time, Save-Data policy, or explicit intent.
- Intrinsic `width`/`height` and fixed aspect ratios prevent media layout shifts.
- CSS target: under 20 KB gzip. Current production build: approximately 7.0 KB gzip.
- JavaScript target: under 8 KB gzip. Current production build: approximately 4.1 KB gzip.
- Every production file stays below GitHub's normal 100 MB per-file limit; current video derivatives stay below roughly 15 MB each.
- The complete film is not duplicated in the repository.

## Build and deployment flow

```mermaid
sequenceDiagram
    participant Editor as Contributor or Pages CMS
    participant Main as main branch
    participant CI as Shared verification action
    participant CDN as GitHub Pages
    Editor->>Main: Merge or content commit
    Main->>CI: Content, docs, Worker, browser, and build checks
    CI-->>CDN: Upload and deploy only after success
```

Pull requests run the shared verification action without deployment. Every ordinary `main` push runs the same action inside the Pages workflow and cannot upload a Pages artifact until it succeeds. Media releases perform that gate after rebasing and before both push and deployment. Actions are pinned to commit SHAs with readable release comments; CI uses Ruby 3.3 and Node 24.

## Security and maintainability practices

- Minimal public runtime surface: no framework, package CDN, analytics, or custom backend.
- Dependencies are locked for local/CI tooling; production serves static output only.
- GitHub Actions receive least-privilege permissions. The ordinary gate is read-only; Pages gets deployment permissions; the media workflow alone gets `contents: write` for its tested generated commit.
- The uploader fails closed when Access or GitHub App configuration is absent, rejects cross-origin mutations, bounds JSON metadata, validates slot/key ownership, and never logs source bytes or credentials.
- External new-tab links use `noopener`.
- YouTube uses a strict referrer policy and privacy-enhanced origin.
- Form submission never logs visitor content in client code.
- Generated output and dependency folders are ignored and excluded from Jekyll.
- History is preserved. Rollbacks use a new revert commit rather than reset or force-push.

## Related guides

- [Experience design](EXPERIENCE_DESIGN.md)
- [Media pipeline](MEDIA_PIPELINE.md)
- [Quality assurance](QUALITY_ASSURANCE.md)
- [Operations runbook](OPERATIONS.md)
- [Decision record](DECISIONS.md)
