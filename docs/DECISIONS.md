# Architecture and experience decision record

**Audience:** project owners, designers, developers, reviewers, and software agents

**Purpose:** preserve the reasons behind durable project boundaries so future work does not accidentally reopen settled tradeoffs

**Last verified:** August 29, 2026

These are lightweight architecture decision records. A decision is “accepted” until a later entry explicitly supersedes it. Record a new decision when a change affects hosting, runtime dependencies, data ownership, privacy, core interaction, media strategy, or release quality.

## D-001 — Static Jekyll on GitHub Pages

**Status:** Accepted

**Decision:** Use Jekyll, Liquid/HTML, SCSS, and framework-free JavaScript deployed through GitHub Pages.

**Why:** The venue needs a maintainable, low-cost landing page with no application data or authenticated user flow. GitHub Pages provides HTTPS, versioned deployments, and a natural match for the owner's requested stack.

**Consequences:**

- No custom server, database, server-side form handling, or runtime framework.
- Dynamic needs must use deliberate external services or remain out of scope.
- Paths must honor the configured `baseurl`; the current production root uses an empty value.
- A custom domain can be added without replacing the architecture.

## D-002 — Structured YAML is the public-content source

**Status:** Accepted

**Decision:** Keep venue facts, links, hours, credits, form endpoint, and media assignments in `_data/frames.yml`.

**Why:** The same facts appear in visible content and structured data. Centralization reduces contradiction and makes updates reviewable by non-framework specialists.

**Consequences:**

- Templates render data; JavaScript does not own public copy.
- Time-sensitive facts must still be confirmed with the venue.
- Tests assert coherence between data-derived visible content and metadata.

## D-003 — Native scroll with small progressive enhancement

**Status:** Accepted

**Decision:** Use sticky CSS, passive scroll listeners, geometry, and coalesced `requestAnimationFrame` seeks. Do not intercept scrolling or add a general animation runtime.

**Why:** The cinematic concept needs scroll-linked media, but navigation must stay predictable, accessible, and performant on touch, keyboard, and lower-power devices.

**Consequences:**

- No wheel/touch capture, scroll lock, synthetic smooth scrolling, GSAP, or animation framework without a demonstrated unmet need.
- Native content order remains meaningful when enhancement is unavailable.
- Scroll pacing and media seeking are browser-regression contracts.

## D-004 — Local all-intra scrubs; remote complete film

**Status:** Accepted

**Decision:** Store short, muted, all-intra H.264 derivatives locally for deterministic scrubbing; deliver the complete film through an opt-in privacy-enhanced YouTube embed.

**Why:** All-intra files make any scroll target independently decodable. A local full film would duplicate a large asset, lose YouTube's mature player/captioning, and increase repository/CDN cost.

**Consequences:**

- Scrub files are intentionally lossy and larger than ordinary long-GOP web video.
- Each derivative must stay below file limits and pass decode/keyframe/range tests.
- The YouTube iframe must remain absent until play intent.
- The production owner remains responsible for YouTube availability and captions.

## D-005 — Progressive enhancement, Reduced Motion, and Save-Data are first-class

**Status:** Accepted

**Decision:** Render complete semantic HTML and posters before JavaScript; disable decorative scrub hydration when motion/data preferences request it.

**Why:** Content, navigation, and conversion should not depend on decoder support, network conditions, motion tolerance, or JavaScript success.

**Consequences:**

- Every decorative motion region needs a meaningful poster.
- Essential facts may not be embedded only in images/video.
- Native form POST, FAQ, and fragment navigation remain functional.
- Static and deferred states require tests, not just enhanced states.

## D-006 — No audible autoplay and no default analytics

**Status:** Accepted

**Decision:** Keep the site soundtrack muted until explicit activation and ship no analytics or tracking pixel by default.

**Why:** Respect, privacy, and trust are more valuable than involuntary atmosphere or unrequested behavioral data.

**Consequences:**

- The control must expose accurate sound state and always allow muting.
- Save-Data skips automatic source hydration.
- Adding analytics requires a new owner decision covering purpose, consent, privacy notice, data retention, and performance impact.

## D-007 — Formspree handles inquiries

**Status:** Accepted

**Decision:** Submit the static form to Formspree and enhance the native POST with Fetch-based inline status.

**Why:** The site needs dependable inquiry delivery without a backend or database.

**Consequences:**

- The public form ID is safe in source; private API credentials are not.
- Delivery, recipients, spam controls, and domain restrictions are managed in Formspree.
- The form must work without JavaScript and recover from enhanced failure.
- Visitor submission content is not stored by this repository.

## D-008 — A small self-hosted type system

**Status:** Accepted

**Decision:** Use system Georgia for display, Arial/Helvetica for body/utility, Courier for the dossier, and one 7 KB self-hosted licensed script subset for the film title.

**Why:** The system needs editorial warmth, dependable readability, dossier texture, and one film-specific gesture without font-CDN dependency or typographic sprawl.

**Consequences:**

- New type roles require a deliberate brand decision.
- Only one WOFF2 resource should load.
- The script face may not be used for body text or controls.
- Typography roles are regression-tested.

## D-009 — Conservative SEO and structured data

**Status:** Accepted

**Decision:** Publish only `WebSite`, `WebPage`, and `BarOrPub` schema backed by visible authoritative content.

**Why:** Accurate local-business signals are more durable than speculative rich-result markup.

**Consequences:**

- No FAQ, review, rating, offer, or event schema without complete visible source data.
- Canonical, social, JSON-LD, robots, and sitemap URLs move together with the production domain.
- Events remain linked from Hotel Zazz rather than duplicated as stale schema/content.

## D-010 — Browser regressions define critical behavior

**Status:** Accepted

**Decision:** Treat Playwright and axe-backed tests as release gates for scroll media, responsive behavior, accessibility, lazy loading, content contracts, and media ranges.

**Why:** The most serious past failures were intermittent browser/decoder issues and responsive regressions that unit tests would not detect.

**Consequences:**

- Pull requests run the complete production-mode browser suite.
- A changed contract requires updated rationale, implementation, and tests together.
- CI uses Node 24 and pinned official action commits.
- Manual assistive-technology and cross-browser testing remains necessary.

## D-011 — Preserve history

**Status:** Accepted

**Decision:** Keep earlier prototypes and redesigns in Git history. Use normal commits, merges, and reverts; do not rewrite history to reset the project.

**Why:** The design process and reversals are valuable context, and a recoverable audit trail is safer than destructive cleanup.

**Consequences:**

- Rollbacks use `git revert`.
- Large obsolete assets may be removed from the current tree while remaining in history.
- Force-push and destructive reset are not normal project operations.

## D-012 — Persistent black header

**Status:** Accepted

**Decision:** Keep the fixed site header opaque black with cream navigation and the white ZEMA mark across every section and scroll position.

**Why:** The header crosses rapidly changing video frames, a saturated room photo, and the light dossier. A stable black surface gives the navigation consistent contrast and a clearer visual boundary.

**Consequences:**

- Header appearance no longer depends on dossier geometry or JavaScript.
- The header remains visually present over the cinematic sections.
- Responsive and accessibility tests assert the black surface and cream foreground at representative scroll positions.

## D-013 — Canonical production origin at zemabar.com

**Status:** Accepted

**Decision:** Serve the GitHub Pages artifact from `https://zemabar.com/` with an empty Jekyll `baseurl`, and redirect `www.zemabar.com` to the apex domain.

**Why:** The venue needs a durable, branded production origin rather than the repository-specific GitHub Pages project path.

**Consequences:**

- Canonical, social, JSON-LD, robots, and sitemap URLs use `https://zemabar.com/`.
- Local and CI browser tests serve the built artifact from `/` so generated asset paths match production.
- GoDaddy remains the authoritative DNS provider while GitHub Pages provides hosting and certificates.
- Domain ownership verification, HTTPS enforcement, Formspree restrictions, and post-deploy checks remain release responsibilities.

## D-014 — Repository-backed Pages CMS editing

**Status:** Accepted

**Decision:** Use Pages CMS as an editing interface over `_data/frames.yml` and `assets/media/editorial/`, without adding a second content database.

**Why:** The owner wants future non-code content and web-ready media changes to remain possible while preserving Git history, Jekyll rendering, and one public-content source.

**Consequences:**

- `.pages.yml` defines the editor schema, fixed structural counts, and media boundary.
- Formspree/service fields, official marks, the favicon, and the pointer remain outside CMS ownership.
- CMS saves are ordinary Git commits and must pass the same Pages release gate as developer changes.
- Four hero beats and three gallery movements remain fixed; notes, FAQs, credits, and production links remain reorderable.

## D-015 — Private raw masters and atomic generated-media releases

**Status:** Accepted

**Decision:** Upload exact editorial masters through a Cloudflare Access-protected Worker to private R2, stream them through a separate bearer-only source Worker, and use a repository-scoped GitHub App plus GitHub Actions to generate, test, commit, and deploy canonical derivatives.

**Why:** Large ProRes/HEVC, lossless audio, and image masters need automatic web conversion without entering Git or granting the browser a long-lived personal token. Production must not change when transcoding or regression checks fail.

**Consequences:**

- `_admin/media-slots.json` is the single contract for the Worker UI, source validation, focal points, canonical outputs, and processor settings.
- One role-gated Worker module backs two deployments: the Access-protected admin plane and a source-only plane that rejects all admin routes. This prevents the edge Access policy from blocking the GitHub runner without duplicating upload or source logic.
- Raw objects under `incoming/` expire after 30 days; incomplete multipart uploads abort after one day.
- Video posters are generated from the exact first encoded frame; audio loudness is preserved; every video output is fully decoded and proven all-intra.
- `media-release.yml` permits only the selected slot outputs plus content/cache metadata, rebases before verification, and pushes/deploys only after the full shared gate passes.
- Access, GitHub App, and source-stream credentials remain outside the repository. Upload completion, generated commit, workflow success, Pages deployment, and public acceptance are separate evidence states.

## Adding a decision

Use this shape:

```md
## D-0XX — Short decision title

**Status:** Proposed | Accepted | Superseded by D-0XX

**Decision:** One direct sentence.

**Why:** The constraint or problem being solved.

**Consequences:**

- Positive and negative operational effects.
```

Do not use decision records for ordinary copy edits or implementation details that are already clear from code.
