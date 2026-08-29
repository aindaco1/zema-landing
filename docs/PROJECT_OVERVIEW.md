# Project overview

**Audience:** venue stakeholders, creative collaborators, designers, developers, and approvers

**Purpose:** explain the product and experience without requiring code knowledge

**Last verified:** August 29, 2026

## One-sentence brief

The ZEMA Vinyl Lounge landing page turns the visual rhythm of *From Zema with Love* into an accessible venue experience that helps guests plan a visit, helps organizers inquire about events, and lets interested visitors watch the complete film.

## Product goals

The site has four jobs, in priority order:

1. Introduce the real ZEMA Vinyl Lounge and make its character memorable.
2. Answer practical questions about hours, reservations, parking, food, address, phone, and current events.
3. Convert interest into venue and event inquiries.
4. Present *From Zema with Love* and its credits without turning the venue site into a production portfolio.

Atmosphere earns attention; clear information and calls to action turn that attention into a visit or inquiry.

## Audiences

### Primary

- Albuquerque residents and visitors considering a night at ZEMA.
- People evaluating ZEMA for a private party, group reservation, performance, or creative/corporate event.

### Secondary

- Viewers of *From Zema with Love*.
- Creative collaborators, press, and members of Albuquerque's arts community.

The experience must never require familiarity with the film to understand the venue.

## Experience sequence

1. **Cinematic invitation:** a scroll-controlled opening holds on centered vinyl before pulling back from ZEMA's eye and reversing until she sets the finished drink on the bar, while four short statements establish the lounge.
2. **Plain-language orientation:** visitors learn what ZEMA is and can immediately choose an inquiry or the live Hotel Zazz events calendar.
3. **Three movements:** arrival, cocktails, and dance clips communicate the arc of a night at the lounge.
4. **The ZEMA file:** a compact dossier presents hours, operational notes, and native expandable FAQs.
5. **Event inquiry:** a readable form sits over a muted closing film sequence and posts to Formspree.
6. **Complete film:** a local poster reveals the privacy-enhanced YouTube player only after explicit play intent; full credits remain HTML.
7. **Venue footer:** brand, visit information, Instagram, and current events close the page.

## Experience principles

- **Cinematic, then useful.** Visual storytelling must lead into information rather than hide it.
- **Native behavior first.** Scrolling, links, forms, and FAQs work with browser primitives.
- **Invitation over exclusivity.** Spy-film mystery creates curiosity; it does not make guests solve a puzzle to find essential details.
- **One idea at a time.** Scale, pacing, and section contrast create rhythm without visual clutter.
- **Content survives enhancement failure.** Posters, HTML text, native links, and native form submission remain functional if JavaScript, media, or third-party services fail.
- **No involuntary sound.** The soundtrack begins muted and requires explicit user action before it is audible.
- **Respect user and device preferences.** Reduced Motion and Save-Data receive purposeful static fallbacks.

## Intentional non-goals

- A reservation engine, event CMS, customer database, or custom backend.
- A film-production portfolio or a frame-by-frame reconstruction of the film.
- Analytics, ad pixels, behavioral profiling, or autoplaying third-party video.
- A JavaScript framework or general-purpose animation runtime.
- A fully dynamic event listing duplicated from Hotel Zazz.

These boundaries keep hosting simple, deployment inexpensive, privacy strong, and ownership practical for a small venue team.

## Current production state

- Public repository: `aindaco1/zema-landing` on GitHub.
- Production site: [https://zemabar.com/](https://zemabar.com/), hosted by GitHub Pages.
- Inquiry delivery: Formspree form `xdaqrwyo`, project `Zema Vinyl Lounge Website`.
- Complete film: privacy-enhanced YouTube embed for video `He3yv-EXuRk`.
- Regression coverage: 15 Playwright tests, including axe-backed WCAG checks, responsive layout, scroll scrubbing, lazy loading, SEO, form states, and media range delivery.

## Success criteria

The project is healthy when:

- a guest can identify the venue, hours, location, current-events path, and contact method without watching the film;
- an organizer can reach and submit the inquiry form with or without JavaScript;
- native scroll is never captured or trapped;
- the site works at 320 CSS pixels and across the tested responsive matrix without horizontal overflow;
- reduced-motion and Save-Data visitors receive complete, readable content;
- the complete film and soundtrack remain opt-in network/audio experiences;
- automated accessibility, SEO, interaction, media, and responsive checks pass before merge;
- deployment remains a static GitHub Pages workflow with no secret required in the repository.

## Owner decisions still open

- Whether ZEMA needs a separate reservation link in addition to the venue inquiry form.
- Whether another verified address should receive Formspree event inquiries.
- Final legal/credit line and confirmation that the published YouTube film has complete captions.

## Related guides

- [Experience design](EXPERIENCE_DESIGN.md)
- [Brand guide](BRAND_GUIDE.md)
- [Technical architecture](ARCHITECTURE.md)
- [Operations runbook](OPERATIONS.md)
