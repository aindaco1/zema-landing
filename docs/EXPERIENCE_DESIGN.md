# Experience design

**Audience:** UX/UI designers, content designers, frontend developers, reviewers, and software agents

**Purpose:** preserve the user journey and interaction contracts behind the visual implementation

**Last verified:** August 16, 2026

## Design thesis

The site borrows the pace, intrigue, saturated light, vinyl imagery, and dossier language of *From Zema with Love*, then translates them into a practical hospitality journey. Bloomscroll informed the cinematic scale and editorial restraint, but ZEMA uses its own content, implementation, identity, and accessibility model.

The governing balance is:

> The film creates desire; the interface creates confidence.

A visitor should enjoy the site without studying it and understand the venue without watching the film.

## Information hierarchy

The page follows a deliberate shift from emotion to action:

| Stage | User question | Design response |
| --- | --- | --- |
| Invitation | “What does this place feel like?” | Large film-led hero with four concise beats |
| Orientation | “What is ZEMA?” | Plain-language venue introduction and two clear paths |
| Imagination | “What might my night feel like?” | Arrival, cocktails, and dance movements |
| Confidence | “When can I go and what should I know?” | Compact, high-contrast dossier with native FAQs |
| Conversion | “Can I hold something here?” | Event inquiry copy and accessible form over atmospheric motion |
| Depth | “What is the film behind this?” | Opt-in complete film and credits |
| Utility | “Where do I go next?” | Address, phone, Instagram, and current events |

Do not reorder these sections casually. The sequence is part of the conversion strategy.

## Interaction principles

### Native scroll is sovereign

- Never intercept `wheel`, touch, keyboard scrolling, or browser history behavior.
- Sticky sections may translate scroll position into media time, but they must not move the page themselves.
- In-page anchors use immediate native fragment jumps. Smooth scrolling is intentionally disabled because it made a media-heavy single page feel unpredictable and slowed access to practical content.
- All anchor targets remain useful when motion enhancement is disabled.

### Motion is atmospheric, not semantic

- Hero, gallery, and inquiry videos are muted, `aria-hidden`, and removed from the tab order.
- Essential meaning is provided by adjacent HTML text and purposeful poster imagery.
- The motion system may fail without taking navigation, information, or conversion with it.
- The page does not autoplay audible media.

### One visible narrative state

Only the active hero beat is exposed. Inactive beats are both `aria-hidden` and `inert`, preventing invisible controls from remaining in the focus order. Visual state, accessibility state, and interaction state must change together.

### Intent before third-party cost

The complete film begins as a local poster and named native button. The YouTube iframe does not exist until activation. This improves initial speed, privacy, pointer behavior, and keyboard clarity.

### Enhancement must be reversible

- Reduced Motion produces static sections.
- Save-Data avoids automatic scrub and soundtrack hydration.
- A failed Blob request falls back to native media loading.
- A failed Formspree Fetch restores the submit button and announces a useful alternative.
- Native HTML remains the baseline.

## Section contracts

### Header

- Compact, opaque black, and aligned to the safe-area-aware page gutters.
- Contains Visit, Inquire, and Events at every supported width, including 320 px.
- Retains the same black surface, cream foreground, and white mark across every section and scroll position.
- Events opens the live calendar in a new tab and targets the calendar area through the text fragment in `_data/frames.yml`.

### Hero

- The sticky viewport always contains the current beat between the header and bottom edge, including short landscape phones.
- The first beat contains the only page `h1`; remaining beats use `h2`.
- The opening `h1` reads “ZEMA Vinyl Lounge”; only `ZEMA` uses the TAN Kindred subset, while “Vinyl Lounge” retains the shared Georgia display treatment.
- The poster is eager, preloaded, decorative, and sized to prevent layout shift.
- The first three copy beats share the spinning record, shifted right so its spindle sits near center. The final beat begins tightly on ZEMA's eye at the spindle position, pulls back to her portrait, and reverses until her hand releases the finished drink on the bar; no drink-preparation footage appears in the hero.
- The final beat contains the inquiry CTA.
- Scroll progress and video progress remain synchronized in both directions.
- No visible progress rule separates the hero from the venue introduction.

### Venue introduction

- This is the first literal explanation of the lounge.
- A venue-supplied listening-room photo is a static decorative layer contained entirely within this section. It uses a responsive `cover` crop and reduced opacity beneath layered shading so the HTML heading, copy, and actions remain readable.
- The event-inquiry and upcoming-events paths are visually equal actions with different destinations.
- Copy remains short enough to scan after the immersive hero.

### Three-movement gallery

- Desktop presents three equal columns; at 900 px and below it presents one active full-width panel.
- The gallery starts on an opaque deep-plum canvas immediately after the listening-room photo ends.
- Each clip uses the same edge-to-edge `cover` treatment.
- The gallery hydrates the first movement near the section, the active movement on demand, and the next movement late in the current third.
- Static posters and captions remain complete under Reduced Motion and Save-Data.
- Captions describe the venue experience, not the scrolling mechanism.

### The ZEMA file

- Full viewport width, ordinary document flow, and no sticky or scrub media.
- Spy-film dossier language is expressed through paper, typewriter typography, file metadata, rules, and compact spacing.
- Essential facts are selectable HTML, never baked into an image.
- Hours use a definition list; FAQs use native `details`/`summary`.
- The section stays under approximately 720 CSS pixels at the desktop test viewport and avoids unnecessary bottom divider lines.

### Inquiry

- The closing montage is a full-section background, not a neighboring column.
- A dark overlay protects text and control contrast across every video frame.
- The form is the semantic and visual priority.
- Required and optional states are written in labels, not conveyed only by color or browser validation.
- The honeypot stays out of the accessibility tree and tab order.
- Enhanced success remains polite; blocking failure becomes an assertive alert.

### Film

- Production-company names are real links; film credits remain literal HTML lines.
- The hand-written title face is used only for the film title.
- The poster facade retains a 16:9 frame and a large named play target.
- Once the iframe loads, the custom pointer yields to the native player cursor and focus moves to the player.
- Captions are an owner-controlled release requirement.

### Soundtrack

- Fixed to the horizontal center of the viewport with safe-area clearance and enough room above the footer credit.
- Visible state and accessible name agree: “Sound off/on” and “Turn on/off ZEMA soundtrack.”
- Muted by default. Sound begins only after a click or keyboard activation.
- Save-Data prevents idle hydration but explicit activation still works.

### Vinyl pointer

- Fine-pointer/hover devices only; absent on touch/coarse pointers.
- Purely decorative and always `aria-hidden`.
- `pointer-events: none`; it never blocks the page or YouTube player.
- Inputs, selects, textareas, contenteditable regions, and the loaded external player retain native cursor behavior.
- Rotation stops under Reduced Motion.

### Footer

- Three equal tracks at every supported width, including mobile.
- Brand, Visit, and Going on now headings use the same utility-label typography as header navigation.
- Address and phone share family and size; address links to Google Maps and phone uses `tel:`.
- Instagram and calendar links are unboxed icons with 44 × 44 CSS-pixel targets.
- “Inside Hotel Zazz · Albuquerque, New Mexico” remains one line at all supported widths.
- No accent rule separates the footer from the section above it.

## Responsive strategy

Breakpoints reflect content pressure rather than device names:

| Threshold | Change |
| --- | --- |
| `1100px` | Film header moves from two columns to one |
| `980px` | Inquiry and dossier internal layouts simplify |
| `900px` | Gallery becomes a one-panel experience |
| `760px` | Header/footer typography and spacing compact while preserving three tracks |
| `720px` | Remaining dossier/form grids collapse |
| `480px` or `500px` viewport height | Soundtrack control becomes smaller |
| `420px` | Footer credit and smallest-space adjustments apply |
| `500px` viewport height | Hero typography and spacing protect short landscape viewports |

The site supports a minimum width of 320 CSS pixels. Shared `--page-gutter-left/right` tokens include safe-area insets; do not add isolated section paddings that drift from them.

The enforced responsive matrix is documented in [Quality assurance](QUALITY_ASSURANCE.md).

## Visual system

The complete color, type, imagery, voice, and mark rules live in [the brand guide](BRAND_GUIDE.md). The UX-level application is:

- deep plum creates the continuous night-time canvas;
- paper interrupts immersion with a practical, tactile information surface;
- coral identifies labels and editorial emphasis;
- electric blue communicates focus, progress, and action;
- Georgia provides cinematic display scale;
- Arial/Helvetica makes utility and body content dependable;
- Courier is restricted to the dossier;
- the self-hosted script face is restricted to the film title.

Do not introduce a new font, accent color, card style, isolated breakpoint, or animation language without updating the brand guide and regression coverage.

## Content design

- Headlines are specific, short, and sensory; practical content is literal.
- Calls to action begin with a verb and name the expected destination.
- Avoid generic luxury language and overuse of “speakeasy” tropes.
- Never describe an interaction (“scroll here”) when the same copy can describe the venue or user outcome.
- Keep venue facts in `_data/frames.yml`; verify time-sensitive facts with the venue.
- The spy conceit may frame a fact but may not obscure it.

## Accessibility and usability review triggers

Run a complete design and accessibility review when changing:

- section order or heading level;
- header height, sticky geometry, or scroll pacing;
- a breakpoint, gutter, fixed control, or footer track;
- any interactive target, focus behavior, hidden state, or form feedback;
- motion, video cropping, overlays, or foreground contrast;
- a public fact, CTA destination, or metadata claim.

Use [Accessibility and SEO baseline](ACCESSIBILITY_SEO.md) and [Quality assurance](QUALITY_ASSURANCE.md) as the release checklists.
