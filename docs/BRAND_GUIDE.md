# ZEMA Vinyl Lounge Brand Guide

This is the working brand system for the ZEMA Vinyl Lounge website. It translates the official marks, the *From Zema with Love* film, the original proposal, the Research & Planning direction, and the venue’s practical needs into repeatable rules.

## Brand idea

**Vintage intelligence with contemporary hospitality.**

ZEMA should feel magnetic, composed, electric, and impossibly cool—but never so mysterious that a guest cannot find the hours, address, or inquiry form. The film supplies the intrigue; the website supplies the invitation.

The experience combines four qualities:

- **Cinematic:** confident scale, deliberate pacing, noir framing, and vivid light.
- **Analog:** vinyl, paper, tactile grain, warm imperfection, and editorial typography.
- **Cultured:** Ethiopian jazz, considered cocktails, artistic community, and attentive listening.
- **Welcoming:** useful information, plain language, legible interfaces, and low-pressure hospitality.

## Audience

The primary audiences are prospective lounge guests and people considering ZEMA for a private event. Creative collaborators and film viewers are welcome secondary audiences, but the site must remain a venue experience rather than a production portfolio.

## Voice and copy

### Voice principles

1. **Assured, not loud.** Use short statements and let the atmosphere do the work.
2. **Sensory, not florid.** Choose one memorable image instead of stacking adjectives.
3. **Inviting, not exclusive.** Mystery should create curiosity, not confusion or social distance.
4. **Specific when it matters.** Hours, policies, location, accessibility, and inquiry expectations use direct language.
5. **Human, not corporate.** Prefer “Tell us what you are planning” to process-heavy business language.

### Copy patterns

- Headlines use sentence case and may end with a period: “Put your night on the record.” The ZEMA file may use uppercase procedural styling inside the dossier.
- Eyebrows are short noun phrases in uppercase: “PRIVATE EVENTS & VENUE INQUIRIES.”
- Calls to action begin with a verb: “Plan an evening,” “See current events,” “Send inquiry.”
- Practical content favors complete, literal sentences.
- Avoid generic luxury language, excessive “speakeasy” clichés, unexplained insider language, and multiple metaphors in one paragraph.

## Typography

Typography uses two primary families plus two tightly controlled narrative textures: a dossier-specific typewriter face and a film-title script. Any other unplanned family—especially browser-default Times—is a defect.

### Families

| Role | Stack | Character |
| --- | --- | --- |
| Display | `Georgia, "Times New Roman", serif` | Warm, editorial, cinematic, and appropriate to the lounge’s vintage polish |
| Body and utility | `Arial, Helvetica, sans-serif` | Clear, modern, neutral, and dependable across GitHub Pages devices |
| ZEMA file | `"Courier New", Courier, monospace` | Archival, procedural, and restricted to the dossier experience |
| Film title | `"ZEMA Script", cursive` | A self-hosted subset of Italianno that echoes the thin, connected handwriting on the film’s napkin |

### Scale and tokens

| Token | Intended use | Size | Line height | Tracking |
| --- | --- | --- | --- | --- |
| `--type-display-xl` | Hero narrative | `clamp(3.25rem, 8vw, 8.75rem)` | `0.84` | `-0.06em` |
| `--type-display-lg` | Major section titles | `clamp(3rem, 7vw, 7.25rem)` | `0.86` | `-0.055em` |
| `--type-display-md` | Compact dossier title | `clamp(2.75rem, 4.6vw, 4.75rem)` | `0.92` | `-0.045em` |
| `--type-display-number` | Decorative gallery numerals | `clamp(1.75rem, 3vw, 3.25rem)` | `1` | normal |
| `--type-lead` | Introductory and supporting copy | `clamp(1.05rem, 1.6vw, 1.35rem)` | `1.45` | normal |
| `--type-body` | Default body and controls | `1rem` | `1.55` | normal |
| `--type-small` | Notes and credits | `0.875rem` | `1.45` | normal |
| `--type-label` | Eyebrows, captions, navigation, field labels | `0.72rem` | `1.3` | `0.16em` |

### Usage rules

- Georgia is reserved for the hero, major non-dossier `h2` headings other than the film title, and decorative gallery numerals.
- Arial/Helvetica handles general paragraphs, navigation, buttons, links, forms, addresses, credits, captions, and section labels.
- Courier New/Courier is reserved for the ZEMA file title, metadata, hours, notes, and FAQ content. Do not use it elsewhere.
- ZEMA Script is reserved for the “From Zema with Love” film title. It is a 7 KB, self-hosted WOFF2 subset of the SIL Open Font License–licensed Italianno face and uses `font-display: swap`; never use it for body copy or controls.
- Display text is regular weight. Do not fake bold Georgia.
- Utility labels are uppercase, bold, and tracked with the shared label tokens.
- Body copy is sentence case with normal tracking.
- Never set an isolated component in Times, a condensed novelty face, or an arbitrary font size. Extend the shared scale if a genuinely new role appears.
- Keep display lines short and balanced. Keep long-form text to roughly 65 characters per line.

## Color

| Token | Value | Role |
| --- | --- | --- |
| Deep plum | `#120b16` | Primary dark canvas |
| Ink | `#181018` | Text on paper and deep control surfaces |
| Cream | `#f2ead5` | Primary text on dark backgrounds |
| Paper | `#d8caa6` | Dossier and tactile information surfaces |
| Paper dark | `#b3a178` | Paper depth and secondary detailing |
| Coral | `#e26177` | Labels, editorial emphasis, and warm accents |
| Electric blue | `#4cc9ff` | Progress, focus, and interaction accents |
| Magenta | `#b72c78` | Atmospheric glow and film-derived color |

Use cream/deep-plum and ink/paper as the primary readable pairs. Coral identifies; electric blue signals action and echoes the film’s cyan-blue lounge lighting. Neither accent color replaces body text. Magenta should appear as atmosphere, not as a competing UI state.

## Layout and composition

- Use cinematic scale for one idea at a time.
- Maintain a clear editorial grid and align related labels, headings, and content starts.
- Alternate immersive dark sections with the paper dossier to create rhythm.
- Preserve generous negative space, but keep operational information compact and scannable.
- Use rules, borders, and progress lines as precise graphic elements; avoid decorative cards without a content purpose.
- Keep footer utility icons unboxed, visually equal in scale, and inside at least 44 × 44 CSS-pixel link targets.
- Divide the footer into three equal columns at every viewport, using compact type and media within those tracks on phones, and keep all three column labels on the shared navigation-label typography tokens.
- Treat breakpoints as content decisions: stack the film header at 1100 px, use one active gallery panel at 900 px, stack the inquiry at 980 px, compact the footer at 760 px, and collapse the remaining compact grids at 720 px.
- Keep every hero beat inside short landscape viewports; reduce its display scale before removing copy or controls.
- Use the shared safe-area-aware page gutters instead of component-specific horizontal padding.

## Imagery and motion

- Film stills should emphasize the agent, ZEMA, vinyl, gestures, cocktails, and the room’s saturated magenta/blue light.
- Use full-bleed imagery for atmosphere and HTML text for meaning.
- Keep scroll scrubs muted and subordinate to native page scrolling.
- Reduced-motion and Save-Data experiences use purposeful still frames, never blank media boxes.
- Grain may unify film and layout surfaces at low opacity. Avoid filters that obscure faces or practical content.

## Marks

- Use the supplied official ZEMA marks without stretching, recoloring, cropping, or adding effects that compromise legibility.
- Use the complete official ZEMA lockup in the footer and the compact official mark in the header; do not reconstruct either mark with live type.
- Maintain clear space around the mark and keep decorative cursor artwork separate from the official identity.

## Accessibility and quality

- Essential information remains selectable HTML text.
- Maintain WCAG 2.2 AA contrast, visible focus, logical headings, and a 320 px minimum viewport without horizontal overflow.
- Do not communicate state through color, motion, or typography alone.
- Avoid text embedded in atmospheric images.
- The two-family typography rule applies to form controls and browser-generated UI as well as visible content.

## Implementation source of truth

- Brand and typography tokens: `assets/css/_theme70s.scss`
- Shared layout primitives: `%page-gutters`, `%utility-label`, and `%cover-media` in `assets/css/_theme70s.scss`
- Global inheritance: `assets/css/_reset.scss`
- Component application: `assets/css/_layout.scss` and `assets/css/_frame.scss`
- Public copy and venue facts: `_data/frames.yml`
- Official production assets: `assets/media/`

When the system changes, update this guide, the CSS tokens, and regression coverage together.
