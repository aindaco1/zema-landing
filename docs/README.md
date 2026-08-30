# ZEMA project handbook

**Audience:** venue owners, designers, developers, producers, and software agents

**Status:** living documentation for the production GitHub Pages site

**Last verified:** August 29, 2026

This handbook records what the ZEMA Vinyl Lounge site is, why it works the way it does, how to change it safely, and how to verify a release. The documents live beside the implementation so changes to the site and changes to its operating knowledge can be reviewed together.

The live production site is [https://zemabar.com/](https://zemabar.com/).

## Start here

| If you need to… | Read |
| --- | --- |
| Understand the project, audience, and page experience | [Project overview](PROJECT_OVERVIEW.md) |
| Understand the build, code boundaries, data flow, and external services | [Technical architecture](ARCHITECTURE.md) |
| Work on hierarchy, interaction, responsive behavior, or progressive enhancement | [Experience design](EXPERIENCE_DESIGN.md) |
| Apply the visual language, voice, colors, and typography | [Brand guide](BRAND_GUIDE.md) |
| Replace or re-encode film, audio, poster, or logo assets | [Media pipeline](MEDIA_PIPELINE.md) |
| Preserve accessibility, metadata, structured data, and crawl behavior | [Accessibility and SEO baseline](ACCESSIBILITY_SEO.md) |
| Choose and run the right automated or manual checks | [Quality assurance](QUALITY_ASSURANCE.md) |
| Develop locally, publish, roll back, or change domains and services | [Operations runbook](OPERATIONS.md) |
| Understand the major architectural choices and their tradeoffs | [Decision record](DECISIONS.md) |
| Make a safe code or content change as an agent | [Agent playbook](AGENT_PLAYBOOK.md) |

The root [`README.md`](../README.md) is the quick-start page. [`agents.md`](../agents.md) is the short, always-on project brief. This handbook is the detailed source for durable project knowledge.

## Sources of truth

Documentation explains the system; it does not replace executable sources. When facts conflict, use this order:

| Concern | Canonical source |
| --- | --- |
| Public copy, hours, contact details, credits, external URLs, form endpoint, and media paths | [`_data/frames.yml`](../_data/frames.yml) |
| Public URL, asset cache version, and Jekyll configuration | [`_config.yml`](../_config.yml) |
| Pages CMS editing schema and protected field/media boundary | [`.pages.yml`](../.pages.yml) |
| Raw-media slots, limits, focal paths, and canonical outputs | [`_admin/media-slots.json`](../_admin/media-slots.json) |
| Page order and semantic composition | [`index.html`](../index.html), [`_layouts/`](../_layouts), and [`_includes/`](../_includes) |
| Design tokens and component styles | [`assets/css/_theme70s.scss`](../assets/css/_theme70s.scss) and the remaining SCSS partials |
| Enhanced interaction behavior | [`assets/js/main.js`](../assets/js/main.js) |
| Enforced browser contracts | [`tests/e2e/`](../tests/e2e) |
| Deployment and CI behavior | [`.github/workflows/`](../.github/workflows) and [the shared verification action](../.github/actions/verify-site/action.yml) |
| Product and engineering invariants | [`agents.md`](../agents.md) |

For venue facts that may change, the final authority is the venue. Confirm hours, policies, reservation guidance, phone, address, and event links with Hotel Zazz before a public launch.

## Documentation rules

1. Update the canonical document in the table above instead of copying the same fact into several files.
2. Prefer links to source files over pasted implementation excerpts that will drift.
3. Put reasons and constraints in documentation; put exact current values in data, configuration, or tests whenever possible.
4. Test every command before publishing it.
5. Update relevant docs in the same change as architecture, interaction, design-token, media, service, or release-process changes.
6. Record a durable change in [the decision record](DECISIONS.md) when it alters a project boundary or reverses an earlier choice.
7. Use absolute dates for audits and time-sensitive venue verification.

## Documentation ownership and review cadence

- **Every change:** check links, commands, terminology, and any directly affected guide.
- **Before each public launch:** verify venue facts, Formspree delivery, YouTube captions, canonical URLs, and the manual accessibility checklist.
- **Quarterly while active:** review external links, dependency/action versions, media budgets, and owner decisions.
- **After a domain or service change:** update architecture, operations, accessibility/SEO, data/configuration, and regression tests together.

Documentation is part of the release artifact even though Jekyll excludes `docs/` from the public website.
