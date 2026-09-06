# ZEMA Vinyl Lounge

A cinematic, accessible landing page for ZEMA Vinyl Lounge at Hotel Zazz in Albuquerque. The site translates *From Zema with Love* into a practical venue journey: discover the lounge, check visitor information, ask about an event, and watch the complete film.

Live production site: [https://zemabar.com/](https://zemabar.com/)

## Technical summary

- Jekyll, Liquid/HTML, compressed SCSS, and framework-free JavaScript.
- Static deployment to GitHub Pages through pinned GitHub Actions.
- Structured public content in `_data/frames.yml`.
- Pages CMS editing backed by Git commits, with service and brand fields protected.
- Access-protected raw-master upload to private R2 with automatic test-gated media releases.
- Local all-intra H.264 derivatives for scroll scrubbing; local WebP fallbacks.
- Privacy-enhanced, intent-loaded YouTube player for the complete film.
- Formspree inquiry delivery with native no-JavaScript POST fallback.
- Self-hosted licensed title fonts; no font CDN, analytics, or public custom backend.
- Playwright and axe-core regression coverage for accessibility, SEO, responsive layout, media, and interaction.

## Run locally

Match CI with Ruby 3.3 and Node.js 24 where practical.

```sh
bundle install
npm ci
npx playwright install chromium
bundle exec jekyll serve
```

Open [http://127.0.0.1:4000/](http://127.0.0.1:4000/).

## Validate

```sh
JEKYLL_ENV=production bundle exec jekyll build
npm run test:docs
npm test
npm run test:accessibility
npm run test:seo
```

The complete gate validates content/CMS ownership, documentation, and workflows, type-checks and tests the uploader Worker, and runs the browser suite against a production-mode build. See [Quality assurance](docs/QUALITY_ASSURANCE.md) for test coverage, the responsive matrix, manual release checks, and diagnosis.

## Documentation

The [project handbook](docs/README.md) owns the guide directory, canonical-source map, and documentation rules. Start there for product, design, architecture, media, accessibility, and operating guidance.

Read [AGENTS.md](AGENTS.md) before changing the project, then follow the [agent playbook](docs/AGENT_PLAYBOOK.md) and the relevant specialist guide.

Use the [operations runbook](docs/OPERATIONS.md) for deployment, rollback, domains, and external services. Confirm changing venue facts with the owner before public launch.
