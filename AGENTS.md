# ZEMA Vinyl Lounge — Working Brief

This is the living brief for the ZEMA Vinyl Lounge landing page. Older prototypes remain available in Git history; do not rewrite history to reset the implementation.

Before changing the project, read the [handbook index](docs/README.md), [agent playbook](docs/AGENT_PLAYBOOK.md), and the specialist guide for the requested area. Inspect the canonical source and tests, and preserve unrelated worktree edits. Update the canonical guide in the same change when architecture, experience behavior, design tokens, media policy, services, testing, or operations change.

## Product goal

Use the look and rhythm of *From Zema with Love* to introduce the actual ZEMA Vinyl Lounge, answer practical visitor questions, collect venue/event inquiries, and make the complete film available with sound.

The site is for the venue—not a portfolio page for the web build or a generic film microsite. Public copy should help a prospective guest or event organizer understand where ZEMA is, when it is open, what to expect, and how to inquire.

## Technical boundary

- Jekyll + GitHub Pages.
- Static Liquid/HTML, SCSS compiled by Jekyll, and framework-free JavaScript.
- No GSAP or other animation runtime unless a future interaction demonstrably cannot be delivered with native sticky layout and a small script.
- No public database or custom backend. Formspree handles inquiry delivery. The approved owner-only media uploader and bearer-only source Worker are an isolated Cloudflare Worker/R2 control plane and must never enter the visitor runtime.
- No analytics by default.
- Keep every production asset below GitHub's normal per-file limit. The hero, three gallery scrubs, and closing inquiry scrub are local; the complete film is embedded from YouTube.

The [project overview](docs/PROJECT_OVERVIEW.md) owns the page sequence, source material, and open owner decisions. The [handbook source map](docs/README.md#sources-of-truth) identifies the canonical implementation for each concern. Confirm hours and operational policies with the venue immediately before public launch.

## Interaction invariants

- Native page scroll always works. Never intercept wheel/touch input or trap the visitor in the hero.
- The hero, three gallery videos, and inquiry montage are muted, decorative, and controlled only through scroll position.
- Reduced-motion and Save-Data visitors receive static posters and functional content.
- The complete-film YouTube iframe never loads or plays without explicit play intent; render the local poster/button facade first.
- The fixed site soundtrack loops muted by default and never emits sound without an explicit button press. Defer its source hydration until after page load, and do not hydrate automatically for Save-Data visitors.
- Only HTML text communicates essential facts; imagery is atmospheric.
- The form works without JavaScript and provides an inline status when JavaScript is available.
- The custom vinyl pointer appears only for fine pointers, never intercepts input, retains native form cursors, and stops rotating under reduced motion.
- In-page anchor links jump immediately; do not restore smooth scrolling.
- Preserve the opaque black header, cream navigation, and three equal footer tracks at every supported width.

Follow [Experience design](docs/EXPERIENCE_DESIGN.md) for the complete section, responsive, and fallback contracts.

## Accessibility and quality bar

- Exactly one page-level `h1`; headings remain ordered.
- Skip link, landmarks, real form labels, visible focus, meaningful alt text, and native FAQ controls.
- Avoid text embedded in images, hover-only interactions, or animation-dependent navigation.
- Maintain zero horizontal overflow at 320 px and above.
- Target Lighthouse accessibility/SEO/best-practice scores of 95+ and no console errors.
- Keep CSS under 20 KB gzipped and JavaScript under 8 KB gzipped.
- Hero LCP is the poster, not the MP4. The YouTube iframe is created only after the visitor activates the local play facade.
- Run `npm test` before merging interaction, responsive-layout, footer, or media changes. Keep the Playwright scrub, reduced-motion, cache-version, overflow, and byte-range assertions intact.
- Keep the Pages CMS content/ownership validator and the uploader Worker tests in that same gate. Formspree/service fields and official brand assets are not editor-owned.
- Preserve the axe-backed WCAG 2.2 AA, keyboard, focus, target-size, required-field, and form-error assertions. Automated checks do not replace the manual VoiceOver, zoom, forced-colors, and YouTube-caption release checks in [Accessibility and SEO](docs/ACCESSIBILITY_SEO.md).
- Keep canonical, Open Graph, Twitter, JSON-LD, `robots.txt`, and sitemap facts aligned with visible content and `_data/frames.yml`. Do not add FAQ, review, rating, offer, or event schema without complete authoritative visible data.
- Follow the [brand guide](docs/BRAND_GUIDE.md) and shared tokens in `assets/css/_theme70s.scss`. Preserve the documented font roles; browser-default Times and isolated component type scales are regressions.
- Follow [Quality assurance](docs/QUALITY_ASSURANCE.md) for validation by change type. Documentation changes require `npm run test:docs`, a production Jekyll build, and `git diff --check`. Keep the handbook index, decision records, and implementation links current; do not duplicate canonical facts across guides.

## Media boundary

Read [Media pipeline](docs/MEDIA_PIPELINE.md) before changing media. It owns the inventory, source ranges, encoding rationale, poster requirements, hydration behavior, and decode/browser validation. Exact slot limits, focal paths, output names, and processor settings belong in [`_admin/media-slots.json`](_admin/media-slots.json).

Keep raw masters outside Git and web derivatives in `assets/media/editorial/`; official marks, favicon, and pointer remain protected. Scrubs must stay lossy, all-intra, silent, and fully decoded after every encode. Preserve Blob buffering, coalesced seeks, staged hydration, matching posters, and explicit aspect ratios.

## Deployment

Follow [Operations](docs/OPERATIONS.md) for release, rollback, domains, services, and production acceptance. Ordinary pushes and raw-media releases must pass the shared release gate before deployment. Keep upload completion, generated commit, CI, deployment, and public acceptance as separate claims. Commit, push, or deploy only when authorized by the user.
