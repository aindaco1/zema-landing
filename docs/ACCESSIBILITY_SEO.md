# Accessibility and SEO baseline

**Audience:** designers, content owners, developers, SEO reviewers, release owners, and software agents

**Purpose:** document the enforced accessibility/crawl posture and the manual work automation cannot replace

**Last verified:** August 2, 2026

This project targets WCAG 2.2 Level AA and a conservative, single-page local-business SEO model. Metadata and structured data must describe visible public content; the site does not publish FAQ, review, rating, event, or offer schema unless those features later gain complete, visible, authoritative data.

## Accessibility posture

The page uses native landmarks, links, form controls, and `details`/`summary`. The complete film starts as a local poster with a named native play button; after activation, it becomes a privacy-enhanced iframe with an accessible title. The scroll-scrub videos are muted and decorative. The optional site soundtrack also starts muted, exposes its state through a native button, and can always be muted again; Save-Data prevents its automatic hydration. Reduced-motion and Save-Data visitors receive static imagery and all practical venue information remains ordinary HTML.

Current automated coverage verifies:

- axe-core rules tagged for WCAG 2.0, 2.1, and 2.2 Level A/AA at desktop and 320 px;
- one `h1`, named landmarks, document language, and an accessible heading/form tree;
- skip-link focus transfer to the main landmark;
- keyboard operation of the FAQ;
- visible required-field instructions and accessible required control names;
- native form-validation focus and an assertive server-error announcement;
- inactive scrub beats cannot retain focus while hidden;
- enhanced and reduced-motion scroll states;
- a minimum 24 × 24 CSS-pixel target for visible interactive controls;
- a visible three-pixel keyboard focus indicator;
- keyboard and pressed-state operation of the soundtrack mute control;
- keyboard activation and request deferral for the complete-film YouTube facade;
- zero horizontal overflow, contained fixed controls, and unclipped hero content across a viewport matrix from 320 × 568 through 1920 × 1080, including short phone landscape;
- single-panel tablet gallery behavior, readable tablet film credits, a compact three-track mobile footer, and content-driven form breakpoints;
- consistent cream navigation contrast on the persistent black header across every section.

Run the focused gate with:

```sh
npm run test:accessibility
```

Automation does not prove screen-reader usability. Before public launch or a substantial interaction change, manually verify:

1. Safari with VoiceOver on macOS and iOS: landmarks, heading navigation, FAQ state, form labels, required state, errors, and the YouTube player.
2. Keyboard only: skip link, fixed navigation, inquiry links, all FAQ summaries, every form control, submit/error recovery, soundtrack mute/unmute, footer links, and YouTube controls.
3. Browser zoom at 200% and 400%, plus text-only zoom where available.
4. Windows High Contrast or an equivalent forced-colors mode.
5. Captions for *From Zema with Love* in the published YouTube player. Captions remain an owner-controlled media requirement and are not verifiable from the static repository.

## SEO model

The only indexable route is the public landing page. Its crawl contract includes:

- one canonical HTTPS URL;
- a descriptive title and meta description;
- explicit index/follow and large-preview directives;
- complete Open Graph and Twitter large-image metadata;
- a crawler-friendly 1200 × 630 JPEG share image with alt text;
- `WebSite`, `WebPage`, and `BarOrPub` JSON-LD linked by stable `@id` values;
- LocalBusiness address, telephone, social profile, containing hotel, imagery, and opening hours derived from `_data/frames.yml`;
- `robots.txt`, canonical XML sitemap, and a diagnostic text sitemap.

Run the focused gate with:

```sh
npm run test:seo
```

After deployment, validate the public URL with Google Search Console URL Inspection, Rich Results Test, and sitemap submission. When a custom domain is chosen, update `_config.yml` before deployment so canonical, social, JSON-LD, and sitemap URLs change together.

## Audit findings remediated

- The skip link previously scrolled to `<main>` without moving keyboard focus. `<main>` is now programmatically focusable and has a visible focus state.
- The dossier telephone target measured 19 CSS pixels high. Standalone navigation and contact actions now meet or exceed WCAG 2.2's 24-pixel minimum target.
- An inactive narrative CTA could remain inside an `aria-hidden` beat. Inactive beats now use `inert`, synchronized with scroll state.
- Required form fields were only conveyed by native constraint state. Required instructions are now visible and included in each required control's accessible name.
- A Formspree failure used a polite status. Blocking server errors now become assertive alerts while successful submissions remain polite statuses.
- Social metadata lacked a stable site name, locale, dimensions, Twitter fields, and a broadly supported share raster. These fields and the dedicated JPEG are now present.
- Local-business facts were duplicated between visible copy and JSON-LD. Opening-hour schema and address fields now derive from the shared data model.
- Crawl endpoints were absent. `robots.txt` and sitemap outputs are now built and regression-tested.

## Content verification note

On August 1, 2026, the official ZEMA lounge page listed happy hour Monday–Thursday, while the separate Hotel Zazz FAQ described happy hour as daily. This site follows the dedicated lounge page and its structured data only publishes regular opening hours, not happy-hour promotional data. Confirm the discrepancy with the venue before launch.

Use [Quality assurance](QUALITY_ASSURANCE.md) for the complete automated/manual release matrix and [Operations](OPERATIONS.md) for post-deploy validation and domain migration.
