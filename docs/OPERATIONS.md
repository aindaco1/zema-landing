# Operations runbook

**Audience:** maintainers, venue owners with technical support, release managers, and software agents

**Purpose:** provide tested procedures for local development, content maintenance, deployment, rollback, and service changes

**Last verified:** August 2, 2026

## Production endpoints

| Resource | Value |
| --- | --- |
| Repository | `https://github.com/aindaco1/zema-landing` |
| Approval site | [https://aindaco1.github.io/zema-landing/](https://aindaco1.github.io/zema-landing/) |
| Pages source | GitHub Actions workflow on `main` |
| Formspree form | `xdaqrwyo` in `Zema Vinyl Lounge Website` |
| Complete film | YouTube `He3yv-EXuRk` via `youtube-nocookie.com` |
| Events source | Hotel Zazz events calendar, targeted to “Zazzy Events” |

No production secret is stored in the repository.

## Local setup

Match CI where possible: Ruby 3.3, Bundler from `Gemfile.lock`, and Node 24.

```sh
bundle install
npm ci
npx playwright install chromium
```

Start the editable Jekyll server:

```sh
bundle exec jekyll serve
```

Open [http://127.0.0.1:4000/zema-landing/](http://127.0.0.1:4000/zema-landing/). The base path is intentional; testing only `/` can hide broken GitHub project-page asset URLs.

Create a one-off production build:

```sh
JEKYLL_ENV=production bundle exec jekyll build
```

Generated `_site/`, dependencies, reports, traces, and local caches are ignored and must not be committed.

## Normal change workflow

1. Start from current `main` and create a focused branch.
2. Read the relevant handbook page and `agents.md` before editing.
3. Change the canonical source, not generated `_site` output.
4. Update documentation and regression coverage when a contract changes.
5. Run the checks in [Quality assurance](QUALITY_ASSURANCE.md).
6. Open a pull request and wait for the regression gate.
7. Merge with history preserved.
8. Watch the Pages and `main` regression runs.
9. Smoke-test the public URL.

Never rewrite project history to “reset” a design. Earlier prototypes are part of the record.

## Common maintenance tasks

### Change copy, hours, links, phone, address, credits, or form endpoint

1. Edit `_data/frames.yml`.
2. If the public URL/SEO defaults change, edit `_config.yml` too.
3. Run `npm run test:seo` and `npm test`.
4. Inspect visible content and JSON-LD.
5. Confirm time-sensitive facts with the venue.

Do not hard-code a second copy in a template or script.

### Change CSS, JavaScript, scrub media, soundtrack, pointer, or inquiry poster

1. Make the implementation/media change.
2. Bump `asset_version` in `_config.yml` using the enforced `YYYYMMDDx` form, such as `20260802u`.
3. Run `npm test` and a production build.
4. Verify the new version appears on all versioned runtime URLs.

The version currently covers CSS, JavaScript, scrub media, soundtrack sources, the pointer, and inquiry poster. For an unversioned logo, gallery poster, hero poster, film poster, icon, or social image replacement, prefer a new filename or explicitly verify cache invalidation.

### Replace media

Follow [Media pipeline](MEDIA_PIPELINE.md). Preserve dimensions, codec/keyframe behavior, editorial boundaries, and file budgets. Decode the complete file before browser testing.

### Change design tokens or responsive behavior

Start in `assets/css/_theme70s.scss`; reuse `%page-gutters`, `%utility-label`, and `%cover-media`. Update [Brand guide](BRAND_GUIDE.md) if a role changes, then run the full responsive suite. Do not patch the same exception into several components.

### Add or change a form field

1. Update `_includes/frame-form.html` with a real label and explicit required/optional copy.
2. Confirm the field name in Formspree submissions.
3. Update form accessibility tests.
4. Test native validation, enhanced success, enhanced failure, and no-JavaScript POST.
5. Never add a secret token to markup or JavaScript.

## Deployment

`.github/workflows/pages.yml` runs on every `main` push and manual dispatch:

1. check out the exact commit;
2. configure Pages paths;
3. build Jekyll into `_site`;
4. upload the Pages artifact;
5. deploy to the protected `github-pages` environment.

Official Actions are pinned to immutable commit SHAs with release comments. Update both when refreshing an action. Confirm the selected release uses Node 24 or newer to avoid deprecated-runtime annotations.

The regression workflow independently re-runs the 15 browser tests on `main`. The deploy and regression workflows can run concurrently, so the pull-request test is the release gate.

### Post-deploy smoke test

```sh
curl --fail --location --output /dev/null --write-out '%{http_code}\n' \
  https://aindaco1.github.io/zema-landing/

curl --fail --location --range 0-1023 --output /dev/null \
  --write-out '%{http_code} %{size_download}\n' \
  https://aindaco1.github.io/zema-landing/assets/media/zema-scroll.mp4
```

Expected responses are `200` and `206 1024`.

Also verify title, header navigation, zero 320 px overflow, lazy YouTube facade, form endpoint, and canonical/sitemap URLs.

### Known Pages annotation

GitHub's `jekyll-build-pages` container may emit a generic advisory that its preinstalled `github-pages` gem cannot satisfy the repository Gemfile. It is non-blocking only when all of the following are true:

- the Jekyll build step succeeds;
- the Pages deployment succeeds;
- the regression workflow succeeds on the same commit;
- the public URL serves the expected build.

Do not ignore an actual Bundler or build failure because the advisory has appeared before.

## Rollback

GitHub Pages publishes `main`. Use a new revert commit; do not reset or force-push history.

```sh
git revert COMMIT_SHA
git push origin main
```

Watch both workflows and repeat the smoke test. If the bad deployment involves an external service or venue fact, correct that source as well; a code rollback cannot reverse changes made in Formspree, YouTube, or Hotel Zazz.

## Custom domain migration

When the owner supplies the production domain:

1. Set `url` to the HTTPS origin and set `baseurl` appropriately in `_config.yml`.
2. Update or remove project-path assumptions in Playwright configuration and SEO assertions.
3. Configure the domain in GitHub Pages and add the required DNS records.
4. Enable HTTPS enforcement after DNS is valid.
5. Restrict Formspree submissions to the production domain.
6. Update `robots.txt`, sitemap assertions, canonical/social/JSON-LD checks, and any public approval links.
7. Test cross-origin form submission, YouTube facade, audio/video requests, and byte ranges.
8. Submit the new sitemap and inspect the URL in Google Search Console.
9. Decide whether and how the GitHub Pages project URL should redirect; Pages does not provide an application-level redirect service automatically.

Do not add a `CNAME` until the domain and DNS plan are confirmed.

## External-service runbooks

### Formspree

- Endpoint is public by design; credentials are not required in code.
- Confirm recipient verification, spam settings, allowed domains, and notification delivery in the Formspree project.
- If the form ID changes, update `_data/frames.yml`, then test enhanced and native submission.
- Never use a real guest's information in a test submission.

### YouTube

- Change only the `youtube_id` in `_data/frames.yml` when replacing the film.
- Keep the privacy-enhanced origin and local facade.
- Confirm availability, title, poster fit, native controls, and captions.
- A removed/private video is an owner/service incident, not a static-site build failure.

### Hotel Zazz

- The ZEMA venue page is the source for venue-specific operating information.
- The external events calendar remains the source for current event listings.
- The text-fragment calendar link depends on visible “Zazzy Events” text; re-test after Hotel Zazz redesigns its page.

## Troubleshooting

### Local site returns missing assets

Open `/zema-landing/`, not `/`. Check that templates use `relative_url` and that `_config.yml` still has the correct `baseurl`.

### Playwright server cannot start

- Confirm `bundle install` and `bundle check` succeed.
- The test server must use `bundle exec ruby` so WEBrick from the GitHub Pages bundle is visible.
- Choose another `PW_TEST_PORT` if the port is occupied.

### Scrub jumps, stalls, or will not reverse

- Confirm the file decodes and every frame is a keyframe.
- Confirm the response supports byte ranges.
- Confirm the video has the expected duration and an `is-ready` state.
- Check whether a stale asset version is mixing old HTML/JS/media.
- Do not add arbitrary scroll delays; inspect the latest-target seek controller and hydration path.

### YouTube loads too early

The initial DOM should contain no YouTube iframe. Confirm the template has a local facade and JavaScript creates the iframe only in the play-button handler.

### Form failure

Test the endpoint outside the enhancement, confirm Formspree recipient/domain configuration, and verify that the submit button recovers. Preserve the visible phone fallback.

### Header or footer overflows on mobile

Run the responsive test before adding a breakpoint. Check shared gutters, nav gap, footer equal tracks, long address wrapping, one-line credit, and soundtrack clearance.

## Periodic maintenance

Quarterly while the project is active:

- verify venue facts and every external link;
- test a Formspree delivery and YouTube captions;
- review dependency and GitHub Action releases;
- check Pages certificate/domain state;
- run the full automated and manual release checklist;
- inspect file sizes and compressed CSS/JavaScript budgets;
- update the handbook's verification date when the procedures are actually retested.
