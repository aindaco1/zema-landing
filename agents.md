# ZEMA Vinyl Lounge — Working Brief

This is the living brief for the ZEMA Vinyl Lounge landing page. Older prototypes remain available in Git history; do not rewrite history to reset the implementation.

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
- Treat `docs/BRAND_GUIDE.md` and the tokens in `assets/css/_theme70s.scss` as the typography source of truth. Georgia is display-only; Arial/Helvetica handles body and utility text. Browser-default Times or isolated component type scales are regressions.

## Current media policy

- `zema-scroll.mp4`: a 14.6-second 1440×810 H.264 hero scrub joining master-film ranges `15.223542–16.766750` and `40.832458–53.845458`. It moves directly from the overhead vinyl shot into the drink-preparation montage and ends before the photograph flash. This is the highest tested all-intra size that seeks reliably in the target Chromium decoder; do not restore the 1080p all-intra encode without browser testing.
- `zema-gallery-arrival.mp4`, `zema-gallery-cocktails.mp4`, and `zema-gallery-dance.mp4`: 1280×720 H.264 scrubs covering master-film ranges `58.75–79.5`, `84.2–94.8`, and `160.0–175.75`. Present all three with the same edge-to-edge `cover` treatment.
- `zema-inquiry-scrub.mp4`: a 1280×720 H.264 scrub covering `186.52–212.02`, beginning when the agent awakens and ending on the clean record frame before the credits.
- Complete film: privacy-enhanced YouTube embed, video ID `Qb-E5il1lZ0`.
- Site soundtrack: master-film audio range `13.90–215.78`, beginning on the needle drop and ending with the final musical tail. Serve `zema-soundtrack.webm` as 64 kbps VBR Opus with `zema-soundtrack.m4a` as the 80 kbps AAC fallback; only the browser-selected source should download.
- WebP assets: native-resolution 1920×1080 posters/gallery stills and 1200×1200 official ZEMA marks.

The scrub encodes are intentionally lossy, high-quality web derivatives; do not replace them with lossless encodes. Every scrub frame is an I-frame. Each derivative buffers into a local Blob before scrubbing begins so a rapid seek cannot cancel an in-flight server range read; the poster remains visible until that buffer is ready. Responsive seeking then comes from making every frame independently decodable and coalescing rapid scroll updates to the latest target. Gallery sources hydrate one movement at a time as the visitor approaches it; the inquiry montage also hydrates only near its section. Keep aspect ratios explicit in markup to avoid layout shift. Run a full decode check after every encode.

## Deployment

The repository is configured for `https://aindaco1.github.io/zema-landing/`. GitHub Pages still needs to be enabled in repository settings if the URL returns 404. After a custom domain is known:

1. Update `_config.yml`.
2. Add the Pages custom-domain configuration.
3. Restrict Formspree submissions to that production domain.
4. Re-run cross-origin form and media range-request tests.

## Remaining owner decisions

- Final production domain.
- Whether the venue wants a separate reservation link in addition to the inquiry form.
- Whether event inquiries should notify another verified Formspree address.
- Final legal/credit line for the film and any captions supplied by the production.
