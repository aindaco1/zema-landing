# Agent playbook

**Audience:** coding agents and humans supervising agent work

**Purpose:** provide a fast, safe path from request to verified change

**Last verified:** August 30, 2026

## Required reading order

Before changing the project:

1. Read [`agents.md`](../agents.md) completely. It contains non-negotiable product and engineering boundaries.
2. Read [the handbook index](README.md) and the guide for the requested area.
3. Inspect the canonical source and its existing regression tests.
4. Check Git status and preserve unrelated user work.

Do not infer that a new visual request authorizes a new framework, backend, analytics service, or history rewrite.

## Fast project model

- Static single-page Jekyll project deployed to GitHub Pages.
- Public content and service URLs: `_data/frames.yml`.
- Global URL/SEO/cache settings: `_config.yml`.
- Semantic section templates: `index.html`, `_layouts/`, `_includes/`.
- Design system: `assets/css/_theme70s.scss`; component layout in the other SCSS partials.
- All enhanced behavior: `assets/js/main.js`.
- Editable production media: `assets/media/editorial/`; protected marks/icon/pointer remain in `assets/media/`; raw masters remain outside Git.
- Editorial schema: `.pages.yml`; shared raw-media contract: `_admin/media-slots.json`.
- Protected upload and source-only deployments: `_admin/uploader/`; deterministic processing: `scripts/media/` and `media-release.yml`.
- Browser contracts: `tests/e2e/`.
- Canonical production URL: `https://zemabar.com/`.

## Non-negotiable invariants

- Native page scroll always works; never trap wheel, touch, keyboard, or history navigation.
- One page-level `h1`; heading order remains logical.
- Essential content is HTML; decorative media is muted and hidden from assistive technology.
- Reduced Motion and Save-Data keep the site complete and avoid unnecessary media hydration.
- No audible playback without explicit intent.
- YouTube iframe is created only after play intent.
- Inquiry form retains native POST and provides enhanced inline state.
- In-page anchors jump immediately; no smooth-scroll restoration.
- Header remains opaque black with cream foreground content across every section.
- Three equal footer tracks, including mobile; 320 px minimum with no horizontal overflow.
- Fonts, colors, and layout roles follow `docs/BRAND_GUIDE.md`.
- No public analytics, tracking pixel, secret, custom backend, or runtime framework by default. The approved owner-only uploader remains isolated from the public site and fails closed behind Cloudflare Access.
- Preserve Git history.

## Change routing

| Request type | Start with | Also inspect | Required validation |
| --- | --- | --- | --- |
| Venue fact, CTA, credit, link | `_data/frames.yml` | head/schema templates and relevant test expectations | SEO + full regression |
| Pages CMS field or media ownership | `.pages.yml` | `_data/frames.yml`, protected service/brand fields, content validator | Content contract + full regression |
| Raw upload slot or derivative | `_admin/media-slots.json` | Worker, media scripts, workflow, media/operations guides | Worker + temp transcode + full regression |
| Page order or semantic markup | `index.html` / `_includes/` | heading/landmark tests and experience guide | Accessibility + full regression |
| Color, typography, spacing | `_theme70s.scss` | brand guide and typography tests | Full regression + visual review |
| Header/footer/responsive layout | `_layout.scss` | responsive matrix and footer assertions | Full regression |
| Section layout or breakpoints | `_frame.scss` | experience guide and responsive tests | Full regression |
| Scroll/media interaction | `main.js` and relevant template | media pipeline and scrub tests | Full regression + manual reverse scrub |
| Poster/video/audio replacement | media pipeline | YAML paths, cache version, range tests | Decode/keyframe + full regression |
| Form behavior | `frame-form.html` and form handler | Formspree configuration and accessibility tests | Accessibility + full regression + live/no-JS test |
| Metadata/domain | `_config.yml`, `head.html`, crawl files | operations custom-domain runbook | SEO + full regression + production inspection |
| Workflow/dependencies | `.github/workflows/`, lockfiles | operations and quality guides | Build + full regression + CI observation |
| Documentation | canonical handbook page | linked implementation and commands | `npm run test:docs` + Jekyll build |

## Implementation habits

### Stay DRY

- Put public facts in YAML, not templates or JavaScript.
- Reuse design tokens and SCSS placeholders before adding component values.
- Keep one audio element, one form handler, and the existing generic scrub controller/hydrator.
- Extend existing `data-*` behavior APIs instead of introducing parallel selectors.
- Add a breakpoint only when content pressure cannot be solved by fluid tokens/grid behavior.
- Link documentation to canonical values rather than copying values into multiple pages.
- Add a media role once in `_admin/media-slots.json`; the Worker UI and processor both consume that contract.
- Keep uploader/source behavior in the shared role-gated Worker module; do not fork a second implementation for the source deployment.

### Preserve progressive enhancement

Begin with the no-JavaScript/reduced-motion document, then layer enhancement. Before adding a listener or remote resource, state:

1. what the static fallback is;
2. what user/device preference suppresses the enhancement;
3. when network work begins;
4. how failure returns to a usable state;
5. how the behavior is tested.

### Treat media as code

Do not replace a scrub merely because another encode looks sharper. Confirm source range, aspect ratio, dimensions, codec, pixel format, all-intra keyframes, duration, full decode, file size, browser seeking, and byte ranges. Bump the asset version.

### Treat tests as contracts

Do not remove assertions to make a visual change pass. If the requested outcome intentionally changes a contract, update:

- the relevant decision/experience guide;
- the implementation;
- the test name and assertions;
- the owner-facing handoff.

## Standard agent workflow

1. Restate the requested outcome and inspect current state.
2. Identify the canonical source and affected invariants.
3. Make the smallest cohesive change.
4. Update related documentation/tests in the same patch.
5. Run `git diff --check`.
6. Run the validation from the routing table; default to `npm test` for interaction, responsive, footer, or media work.
7. Inspect the rendered result at relevant boundary viewports.
8. Report changed files, tests, known manual checks, and any owner decision still required.
9. Commit/push/deploy only when the user request authorizes it.

For an uploader release, keep upload, GitHub generation, commit, CI, Pages deployment, and public acceptance as separate claims. Never bypass the media workflow by committing a raw master or partially generated output.

## Commands

```sh
bundle check
JEKYLL_ENV=production bundle exec jekyll build
npm run test:docs
npm run test:content
npm run test:workflows
npm run test:uploader
npm test
npm run test:accessibility
npm run test:seo
git diff --check
```

Use `rg`/`rg --files` for repository searches. Edit source files with patch-based changes. Do not edit generated `_site` output.

## Regression traps from project history

- Long-GOP or oversized scrub encodes can appear correct but seek intermittently.
- Assigning `video.currentTime` for every raw scroll event can lose the latest reverse seek.
- Hydrating all gallery videos at once increases decoder/network contention.
- A transparent header can lose contrast across changing film and photo frames; preserve the persistent black surface.
- Smooth anchor scrolling conflicts with the desired immediate navigation.
- Hidden hero CTAs can remain focusable unless inactive beats are `inert`.
- A custom pointer can disappear or block input over an iframe unless player handoff is explicit.
- Footer logo dimensions can distort the layout if intrinsic ratio/object fit is not preserved.
- Independent mobile footer stacks break the one-row requirement; maintain three equal tracks.
- Venue facts duplicated in schema drift from visible copy.
- A plain Ruby test server cannot see Bundler-installed WEBrick; keep `bundle exec ruby`.
- Pinned Actions built on deprecated Node runtimes create warnings even if the job installs a newer Node for application steps; verify the action runtime itself.
- Allowing Vitest to discover Playwright files imports incompatible Node modules into the Workers runtime; keep uploader test inclusion scoped to `_admin/uploader/test/`.
- FFmpeg builds do not all include a WebP encoder; the media workflow owns `cwebp` explicitly.

## Stop and ask the owner when

- venue hours/policies conflict across official sources;
- a change needs a production domain, reservation provider, verified Formspree recipient, or legal/caption decision;
- requested media is unavailable or rights/credit are unclear;
- a request would add analytics, a backend, database, authentication, paid service, or new runtime framework;
- the requested outcome materially conflicts with an invariant and no safe interpretation exists.

Document the choice once the owner decides.

## Definition of done

A change is complete when:

- it satisfies the user-visible request;
- the canonical source and related docs agree;
- progressive fallbacks remain functional;
- applicable automated checks pass;
- responsive/accessibility/media behavior is manually reviewed in proportion to risk;
- no unrelated work was overwritten;
- the handoff identifies any external or owner-controlled validation still outstanding.
