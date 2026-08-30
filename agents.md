# ZEMA Vinyl Lounge — Working Brief

This is the living brief for the ZEMA Vinyl Lounge landing page. Older prototypes remain available in Git history; do not rewrite history to reset the implementation.

The detailed project handbook begins at `docs/README.md`. Agents must also read `docs/AGENT_PLAYBOOK.md` and the specialist guide for the requested area before changing the project. When a change alters architecture, experience behavior, design tokens, media policy, services, testing, or operations, update the canonical guide in the same change.

## Product goal

Use the look and rhythm of *From Zema with Love* to introduce the actual ZEMA Vinyl Lounge, answer practical visitor questions, collect venue/event inquiries, and make the complete film available with sound.

The site is for the venue—not a portfolio page for the web build or a generic film microsite. Public copy should help a prospective guest or event organizer understand where ZEMA is, when it is open, what to expect, and how to inquire.

## Technical boundary

- Jekyll + GitHub Pages.
- Static Liquid/HTML, SCSS compiled by Jekyll, and framework-free JavaScript.
- No GSAP or other animation runtime unless a future interaction demonstrably cannot be delivered with native sticky layout and a small script.
- No database or custom backend. Formspree handles inquiry delivery.
- No analytics by default.
- Keep every production asset below GitHub's normal per-file limit. The hero, three gallery scrubs, and closing inquiry scrub are local; the complete film is embedded from YouTube.

## Current page sequence

1. Sticky scroll-scrub hero with four narrative beats.
2. Plain-language introduction to the lounge.
3. Sticky three-part gallery that sequentially scrubs arrival, cocktails, and dance clips, with native-resolution WebP fallbacks.
4. Full-width film-derived dossier with hours, policies, and FAQs.
5. Venue/event inquiry form layered over a section-wide scrubbable closing montage.
6. Complete film embedded from YouTube with sound, credits, and native controls.
7. Venue footer.

The Bloomscroll reference informs the cinematic scale, restrained navigation, tactile transitions, and editorial typography. Do not clone its implementation or obscure basic venue information for the sake of spectacle.

## Sources of truth

- Lounge information: `https://www.hotelzazz.com/zema-vinyl-lounge`
- Current events: `https://www.hotelzazz.com/events-calendar`
- Film master: supplied out-of-repository by the owner
- Brand direction and official marks: Notion Research & Planning
- Narrative chapters, creative intent, credits, and deliverables: original ZEMA proposal PDF
- Site content model: `_data/frames.yml`
- Form endpoint: Formspree form `xdaqrwyo`, project `Zema Vinyl Lounge Website`

Hours and operational policies can change. Confirm them with the venue immediately before public launch; do not preserve expired seasonal schedules just because they exist on an older page.

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

## Accessibility and quality bar

- Exactly one page-level `h1`; headings remain ordered.
- Skip link, landmarks, real form labels, visible focus, meaningful alt text, and native FAQ controls.
- Avoid text embedded in images, hover-only interactions, or animation-dependent navigation.
- Maintain zero horizontal overflow at 320 px and above.
- Target Lighthouse accessibility/SEO/best-practice scores of 95+ and no console errors.
- Keep CSS under 20 KB gzipped and JavaScript under 8 KB gzipped.
- Hero LCP is the poster, not the MP4. The YouTube iframe is created only after the visitor activates the local play facade.
- Run `npm test` before merging interaction, responsive-layout, footer, or media changes. Keep the Playwright scrub, reduced-motion, cache-version, overflow, and byte-range assertions intact.
- Preserve the axe-backed WCAG 2.2 AA, keyboard, focus, target-size, required-field, and form-error assertions. Automated checks do not replace the manual VoiceOver, zoom, forced-colors, and YouTube-caption release checks in `docs/ACCESSIBILITY_SEO.md`.
- Keep canonical, Open Graph, Twitter, JSON-LD, `robots.txt`, and sitemap facts aligned with visible content and `_data/frames.yml`. Do not add FAQ, review, rating, offer, or event schema without complete authoritative visible data.
- Treat `docs/BRAND_GUIDE.md` and the tokens in `assets/css/_theme70s.scss` as the typography source of truth. Georgia handles general display copy; the licensed TAN Kindred subset is restricted to the `ZEMA` word in the opening hero title; Arial/Helvetica handles body and utility text. Browser-default Times or isolated component type scales are regressions.
- Treat documentation as versioned project infrastructure. Keep `docs/README.md` routing, documented commands, decision records, and implementation links current; do not duplicate canonical facts across guides.

## Current media policy

- `zema-scroll.mp4`: a 12.0-second 1440×810 H.264 hero scrub with 288 all-intra frames. It repeats the clean overhead-vinyl range once with a four-frame dissolve, keeping the 80 px rightward shift while making the spin feel faster across the first three beats. A twenty-four-frame dissolve then introduces the final beat's 8× close-up aligned on ZEMA's eye; it pulls back and reverses from the portrait until her hand releases the finished glass on the bar. The drink-preparation passage is intentionally omitted. The underlying master-film ranges are `15.223542–16.766750` and `51.289250→46.989250`. This is the highest tested all-intra size that seeks reliably in the target Chromium decoder; do not restore the 1080p all-intra encode without browser testing.
- `zema-gallery-arrival.mp4`, `zema-gallery-cocktails.mp4`, and `zema-gallery-dance.mp4`: 1280×720 H.264 scrubs covering master-film ranges `58.75–79.5`, `84.2–94.8`, and `160.0–175.75`. Present all three with the same edge-to-edge `cover` treatment.
- `zema-inquiry-scrub.mp4`: a 1280×720 H.264 scrub covering `186.52–212.003`, beginning when the agent awakens and ending on the last clean record frame at `211.961750`, before the new master’s first credited frame at `212.003458`.
- Complete film: privacy-enhanced YouTube embed, video ID `He3yv-EXuRk`, with its max-resolution YouTube thumbnail stored locally as the play facade.
- Site soundtrack: the complete 201.817642-second owner-supplied `From Zema With Love Final audio.wav`. Serve `zema-soundtrack.webm` as 64 kbps VBR Opus with `zema-soundtrack.m4a` as the 80 kbps AAC fallback; only the browser-selected source should download.
- WebP assets: 1920×1080 hero/inquiry posters and gallery stills, the native 1280×720 YouTube film-thumbnail facade, the native 1500×1215 listening-room photo, and 1200×1200 official ZEMA marks.

The scrub encodes are intentionally lossy, high-quality web derivatives; do not replace them with lossless encodes. Every scrub frame is an I-frame. Each derivative buffers into a local Blob before scrubbing begins so a rapid seek cannot cancel an in-flight server range read; the poster remains visible until that buffer is ready and the requested frame has been decoded and painted. Hero posters must match the scrub's exact opening frame and crop. Responsive seeking then comes from making every frame independently decodable and coalescing rapid scroll updates to the latest target. Gallery sources hydrate one movement at a time as the visitor approaches it; the inquiry montage also hydrates only near its section. Keep aspect ratios explicit in markup to avoid layout shift. Run a full decode check after every encode.

## Deployment

The repository is deployed through GitHub Actions to the canonical production origin `https://zemabar.com/`; `www.zemabar.com` redirects to the apex domain. Pull requests run the regression gate; pushes to `main` run regression and Pages deployment. `_config.yml` owns the HTTPS origin and empty root `baseurl`. Use `docs/OPERATIONS.md` for release, rollback, domain, and troubleshooting procedures.

Pages HTTPS enforcement is enabled. Before public acceptance, retain GitHub's domain-verification TXT record, restrict Formspree submissions to `zemabar.com`, and re-run the cross-origin form checks; media range requests are part of the automated and post-deploy gates.

## Remaining owner decisions

- Whether the venue wants a separate reservation link in addition to the inquiry form.
- Whether event inquiries should notify another verified Formspree address.
- Final legal/credit line for the film and any captions supplied by the production.
