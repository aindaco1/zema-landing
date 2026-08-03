# ZEMA Vinyl Lounge

A cinematic, accessible landing page for ZEMA Vinyl Lounge at Hotel Zazz in Albuquerque. The site translates *From Zema with Love* into a practical venue journey: discover the lounge, check visitor information, ask about an event, and watch the complete film.

Live approval site: [https://aindaco1.github.io/zema-landing/](https://aindaco1.github.io/zema-landing/)

## Technical summary

- Jekyll, Liquid/HTML, compressed SCSS, and framework-free JavaScript.
- Static deployment to GitHub Pages through pinned GitHub Actions.
- Structured public content in `_data/frames.yml`.
- Local all-intra H.264 derivatives for scroll scrubbing; local WebP fallbacks.
- Privacy-enhanced, intent-loaded YouTube player for the complete film.
- Formspree inquiry delivery with native no-JavaScript POST fallback.
- Self-hosted licensed film-title font; no font CDN, analytics, or custom backend.
- Playwright and axe-core regression coverage for accessibility, SEO, responsive layout, media, and interaction.

## Run locally

Match CI with Ruby 3.3 and Node.js 24 where practical.

```sh
bundle install
npm ci
npx playwright install chromium
bundle exec jekyll serve
```

Open [http://127.0.0.1:4000/zema-landing/](http://127.0.0.1:4000/zema-landing/).

## Validate

```sh
JEKYLL_ENV=production bundle exec jekyll build
npm run test:docs
npm test
npm run test:accessibility
npm run test:seo
```

The complete browser suite builds and serves the site under its real project base path and runs 15 production-oriented checks. See [Quality assurance](docs/QUALITY_ASSURANCE.md) for test coverage, the responsive matrix, manual release checks, and diagnosis.

## Documentation

The [project handbook](docs/README.md) is the documentation entry point for humans and agents.

| Guide | Covers |
| --- | --- |
| [Project overview](docs/PROJECT_OVERVIEW.md) | Product goals, audiences, experience sequence, and success criteria |
| [Technical architecture](docs/ARCHITECTURE.md) | Build/runtime structure, content flow, external services, privacy, and budgets |
| [Experience design](docs/EXPERIENCE_DESIGN.md) | UX/UI hierarchy, interaction contracts, motion, responsive behavior, and fallbacks |
| [Brand guide](docs/BRAND_GUIDE.md) | Voice, typography, colors, imagery, marks, and design tokens |
| [Media pipeline](docs/MEDIA_PIPELINE.md) | Source ranges, encodes, posters, audio, file budgets, and validation |
| [Accessibility and SEO](docs/ACCESSIBILITY_SEO.md) | WCAG posture, structured data, metadata, audits, and manual checks |
| [Quality assurance](docs/QUALITY_ASSURANCE.md) | Test commands, coverage, change matrix, release checklist, and CI |
| [Operations runbook](docs/OPERATIONS.md) | Local setup, maintenance, deployment, rollback, domain migration, and troubleshooting |
| [Decision record](docs/DECISIONS.md) | Why the major technical and experience boundaries exist |
| [Agent playbook](docs/AGENT_PLAYBOOK.md) | Safe change routing, invariants, regression traps, and definition of done |

[`agents.md`](agents.md) remains the short, always-on working brief. Read it before making a project change.

## Canonical sources

| Concern | Source |
| --- | --- |
| Public copy, venue facts, credits, form endpoint, links, and media paths | `_data/frames.yml` |
| Site URL, SEO defaults, asset cache version, and Jekyll settings | `_config.yml` |
| Semantic composition | `index.html`, `_layouts/`, `_includes/` |
| Design implementation | `assets/css/` |
| Enhanced interaction | `assets/js/main.js` |
| Enforced browser behavior | `tests/e2e/` |
| CI and deployment | `.github/workflows/` |

Confirm changing hours and operational policies with the venue before public launch.

## Deployment

Pull requests run the regression workflow. Pushes to `main` run regression again and deploy the Jekyll artifact to GitHub Pages.

If a custom domain is added, follow [the custom-domain migration runbook](docs/OPERATIONS.md#custom-domain-migration) so configuration, canonical URLs, crawl files, Formspree restrictions, tests, and DNS move together.
