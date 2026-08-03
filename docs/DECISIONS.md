# Architecture and experience decision record

**Audience:** project owners, designers, developers, reviewers, and software agents

**Purpose:** preserve the reasons behind durable project boundaries so future work does not accidentally reopen settled tradeoffs

**Last verified:** August 2, 2026

These are lightweight architecture decision records. A decision is “accepted” until a later entry explicitly supersedes it. Record a new decision when a change affects hosting, runtime dependencies, data ownership, privacy, core interaction, media strategy, or release quality.

## D-001 — Static Jekyll on GitHub Pages

**Status:** Accepted

**Decision:** Use Jekyll, Liquid/HTML, SCSS, and framework-free JavaScript deployed through GitHub Pages.

**Why:** The venue needs a maintainable, low-cost landing page with no application data or authenticated user flow. GitHub Pages provides HTTPS, versioned deployments, and a natural match for the owner's requested stack.

**Consequences:**

- No custom server, database, server-side form handling, or runtime framework.
- Dynamic needs must use deliberate external services or remain out of scope.
- Paths must work under the project `baseurl`.
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

## Adding a decision

Use this shape:

```md
## D-012 — Short decision title

**Status:** Proposed | Accepted | Superseded by D-0XX

**Decision:** One direct sentence.

**Why:** The constraint or problem being solved.

**Consequences:**

- Positive and negative operational effects.
```

Do not use decision records for ordinary copy edits or implementation details that are already clear from code.
