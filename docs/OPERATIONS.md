# Operations runbook

**Audience:** maintainers, venue owners with technical support, release managers, and software agents

**Purpose:** provide tested procedures for local development, content maintenance, deployment, rollback, and service changes

**Last verified:** August 30, 2026

## Production endpoints

| Resource | Value |
| --- | --- |
| Repository | `https://github.com/aindaco1/zema-landing` |
| Production site | [https://zemabar.com/](https://zemabar.com/) |
| Redirect alias | `https://www.zemabar.com/` |
| Pages source | GitHub Actions workflow on `main` |
| Formspree form | `xdaqrwyo` in `Zema Vinyl Lounge Website` |
| Complete film | YouTube `He3yv-EXuRk` via `youtube-nocookie.com` |
| Events source | Hotel Zazz events calendar, targeted to “Zazzy Events” |
| Content editor | [Pages CMS app](https://app.pagescms.org/), configured by `.pages.yml` |
| Raw-master storage | Private Cloudflare R2 bucket `zema-media-masters` |
| Media upload | Access-protected `zema-media-uploader` Worker |
| Private source stream | Bearer-only `zema-media-source` Worker → `media-release.yml` |

No production secret is stored in committed source. The media control plane uses Cloudflare Worker secrets plus one matching GitHub Actions secret.

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

Open [http://127.0.0.1:4000/](http://127.0.0.1:4000/). The root path matches the custom-domain production deployment.

Create a one-off production build:

```sh
JEKYLL_ENV=production bundle exec jekyll build
```

Generated `_site/`, dependencies, reports, traces, and local caches are ignored and must not be committed.

## Normal change workflow

1. Start from current `main` and create a focused branch.
2. Read the relevant handbook page and [AGENTS.md](../AGENTS.md) before editing.
3. Change the canonical source, not generated `_site` output.
4. Update documentation and regression coverage when a contract changes.
5. Run the checks in [Quality assurance](QUALITY_ASSURANCE.md).
6. Open a pull request and wait for the regression gate.
7. Merge with history preserved.
8. Watch the Pages and `main` regression runs.
9. Smoke-test the public URL.

Never rewrite project history to “reset” a design. Earlier prototypes are part of the record.

## Common maintenance tasks

### Change copy, hours, links, phone, address, or credits

1. Sign into the [Pages CMS app](https://app.pagescms.org/) with the GitHub account authorized for `aindaco1/zema-landing`, then open **ZEMA site content**.
2. Edit and save. Pages CMS commits `_data/frames.yml` directly; it does not maintain a second copy of the content.
3. Watch the Pages workflow. Its content, documentation, Worker, browser, and build checks must pass before deployment.
4. Inspect visible content and JSON-LD on production.
5. Confirm time-sensitive facts with the venue before saving them.

Developers can still edit `_data/frames.yml` directly and use the normal pull-request flow. Do not hard-code a second copy in a template or script. Formspree/service fields and official brand assets are intentionally absent from Pages CMS; change them through reviewed source work.

### Change CSS, JavaScript, scrub media, soundtrack, pointer, or inquiry poster

1. Make the implementation/media change.
2. Bump `asset_version` in `_config.yml` using the enforced `YYYYMMDDx` form, such as `20260802u`.
3. Run `npm test` and a production build.
4. Verify the new version appears on all versioned runtime URLs.

The version currently covers CSS, JavaScript, scrub media, soundtrack sources, the pointer, hero poster, and inquiry poster. For an unversioned logo, gallery poster, film poster, icon, or social image replacement, prefer a new filename or explicitly verify cache invalidation.

### Replace a web-ready editorial asset

Pages CMS may upload already optimized images, MP4, WebM, or M4A files inside `assets/media/editorial/`. Use a new safe filename so caches cannot retain a same-name replacement, update the corresponding field, and wait for the full Pages release gate. Do not upload raw masters or ordinary long-GOP video through this path.

### Replace media from a raw master

1. Open the Access-protected ZEMA media uploader and authenticate with the allowed Cloudflare Access identity.
2. Choose the semantic site slot. For images/video, set the crop focal point as percentages from the left and top; `50 / 50` is centered.
3. Select the editorially final source and choose **Upload and publish**. Video accepts MOV/MP4 H.264, HEVC, or ProRes up to 4K, 60 seconds, and 5 GB. Audio accepts WAV/AIFF/FLAC up to 15 minutes. Images accept JPEG/PNG/TIFF/WebP.
4. Keep the page open for browser upload progress, retry, or cancellation. Upload state is intentionally not resumed after the browser closes.
5. Open the linked GitHub run. It downloads the private object, transcodes canonical derivatives, validates the exact diff, rebases on current `main`, runs the complete release gate, commits, and deploys automatically.

Raw upload success is not production success. Production remains unchanged unless the GitHub run passes and the Pages deployment completes. Follow [Media pipeline](MEDIA_PIPELINE.md) for the derivative contract and editorial review.

### Change design tokens or responsive behavior

Start in `assets/css/_theme70s.scss`; reuse `%page-gutters`, `%utility-label`, and `%cover-media`. Update [Brand guide](BRAND_GUIDE.md) if a role changes, then run the full responsive suite. Do not patch the same exception into several components.

### Add or change a form field

1. Update `_includes/frame-form.html` with a real label and explicit required/optional copy.
2. Confirm the field name in Formspree submissions.
3. Update form accessibility tests.
4. Test native validation, enhanced success, enhanced failure, and no-JavaScript POST.
5. Never add a secret token to markup or JavaScript.

## Deployment

`.github/workflows/pages.yml` runs on every ordinary `main` push and manual dispatch:

1. check out the exact commit;
2. run the shared content, documentation, Worker, browser, and production-build verification;
3. configure Pages paths;
4. upload the verified `_site` artifact;
5. deploy to the protected `github-pages` environment.

Official Actions are pinned to immutable commit SHAs with release comments. Update both when refreshing an action. Confirm the selected release uses Node 24 or newer to avoid deprecated-runtime annotations.

The regression workflow runs the same shared gate on pull requests. `media-release.yml` uses that gate after generating and rebasing a media commit and before pushing or deploying it. A failed ordinary or media verification never uploads a Pages artifact.

### Post-deploy smoke test

```sh
curl --fail --location --output /dev/null --write-out '%{http_code}\n' \
  https://zemabar.com/

curl --fail --location --range 0-1023 --output /dev/null \
  --write-out '%{http_code} %{size_download}\n' \
  https://zemabar.com/assets/media/editorial/zema-scroll.mp4
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

For a generated media release, revert its single `media: publish …` commit. The raw source remains private in R2 until lifecycle expiry, so a corrected replacement can be re-uploaded without restoring the old derivative by hand.

## Custom domain migration

The canonical production origin is `https://zemabar.com/`, served from the root with an empty Jekyll `baseurl`. GoDaddy is authoritative for DNS; the apex publishes GitHub Pages A records and `www` is a CNAME to `aindaco1.github.io`. The repository uses a custom Actions workflow, so a source-tree `CNAME` file is ignored and not required.

On August 29, 2026, the authoritative and public DNS answers matched GitHub Pages, the repository custom domain was `zemabar.com`, GitHub's certificate was approved for both apex and `www`, and HTTPS enforcement was enabled. Complete these owner-controlled release steps:

1. Add and retain GitHub's account-level domain-verification TXT record.
2. Restrict Formspree submissions to `zemabar.com` and test both enhanced and native POST delivery with non-guest test data.
3. Submit `https://zemabar.com/sitemap.xml` and inspect the origin in Google Search Console.

For any future domain change:

1. Set `url` to the new HTTPS origin and set `baseurl` appropriately in `_config.yml`.
2. Update Playwright configuration, crawl/SEO assertions, and public documentation.
3. Verify domain ownership, configure the domain in GitHub Pages, and then change DNS.
4. Wait for certificate approval and enable HTTPS enforcement.
5. Update Formspree's allowed domain.
6. Test canonical/social/JSON-LD output, redirects, the YouTube facade, form submission, audio/video requests, and byte ranges.
7. Submit the new sitemap and inspect the origin in Google Search Console.

Do not point DNS at GitHub Pages before the domain is verified and assigned to the repository.

## External-service runbooks

### Pages CMS

- `.pages.yml` is the schema and editable-boundary source. Keep `settings.content.merge: true` so unmanaged service fields survive CMS saves.
- The CMS edits only `_data/frames.yml` and `assets/media/editorial/`; it cannot delete the content file or edit Formspree, logos, favicon, or pointer assets.
- Media fields serialize the configured root-relative `/assets/media/editorial/...` public URL. The validator and raw-media processor derive that value from each repository-relative manifest output; do not hand-maintain a second path mapping.
- Four hero beats and three gallery movements are fixed structural counts. Visitor notes, FAQs, credits, and production links remain reorderable.
- A Pages CMS save is a Git commit, not a live database mutation. Confirm the resulting commit, Pages run, and deployed public page separately.

### Cloudflare media uploader

The canonical slot/output contract is `_admin/media-slots.json`; the Worker UI and GitHub processor both consume it. Do not duplicate slot limits in Worker code.

Production Cloudflare configuration:

- R2 bucket: `zema-media-masters`, private, with prefix `incoming/` expiring after 30 days and incomplete multipart uploads aborting after one day.
- Access application: protect the exact public hostname `zema-media-uploader.jogo.workers.dev` and the complete `zema-media-uploader` Worker with the same application, one authorized owner identity, policy, and AUD. Keep eager redirect cookies disabled; the team-domain issuer and application AUD live in `_admin/uploader/wrangler.jsonc`.
- Admin Worker secret: `GITHUB_APP_PRIVATE_KEY` in unencrypted PKCS#8 PEM form. Source Worker secret: `MEDIA_SOURCE_TOKEN`. Never commit `.dev.vars` or a PEM file.
- GitHub App: installed only on `aindaco1/zema-landing`, with repository Actions write permission and metadata read permission. Store its client ID and installation ID as non-secret Worker variables.
- GitHub repository Actions secret: `MEDIA_SOURCE_TOKEN`, identical to the source Worker secret. Repository variable: `MEDIA_SOURCE_URL`, the `zema-media-source` HTTPS origin.

The GitHub-generated private key may need conversion before `wrangler secret put`:

```sh
openssl pkcs8 -topk8 -nocrypt -in github-app-key.pem -out github-app-key-pkcs8.pem
npx wrangler secret put GITHUB_APP_PRIVATE_KEY --cwd _admin/uploader
npx wrangler deploy --cwd _admin/uploader
npx wrangler secret put MEDIA_SOURCE_TOKEN --cwd _admin/uploader --config wrangler.source.jsonc
npx wrangler deploy --cwd _admin/uploader --config wrangler.source.jsonc
npx wrangler r2 bucket lifecycle list zema-media-masters
```

Pass secret values through the interactive prompts; do not place them in shell history. Remove the downloaded/generated PEM files after the Worker secret is confirmed. The admin deployment validates Cloudflare's Access JWT in addition to the edge policy and does not expose `/pipeline/source`. The source deployment rejects admin routes and serves only the bearer-protected `/pipeline/source` plus its health check.

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

Open `/`, not `/zema-landing/`. Check that templates use `relative_url`, `_config.yml` has an empty `baseurl`, and generated markup contains root-relative `/assets/` URLs.

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

### Raw upload completes but no release starts

- Inspect the Worker log for a GitHub App configuration/authentication error; do not log the private key or bearer token.
- Confirm the App is still installed only on the repository and can write Actions.
- Confirm `media-release.yml` exists on `main` and GitHub Actions is enabled.
- A completed R2 object is safe to leave in place while diagnosing; lifecycle policy will remove it after 30 days.

### Uploader login redirects repeatedly

- Confirm the Access authentication log shows an allowed event for the owner before changing identity policy.
- Trace a single reload with `npx wrangler tail zema-media-uploader --format=json`. A request reaching the Worker with redacted `cf-access-jwt-assertion` and `cf-access-authenticated-user-email` headers proves the Access handoff succeeded.
- The authenticated `/admin/` response must be `200` with no `Location` header. The Worker must fetch the asset root `/`; Cloudflare Assets canonicalizes `/index.html` to `/`, which otherwise loops against the public `/` to `/admin/` redirect. The uploader test suite guards this contract.
- After an Access destination or cookie-setting change, remove only the uploader hostname's site data before retrying. Do not clear the team-domain session unless re-authentication is intentional.

### Media release fails

- Download the 30-day `media-release-report` artifact and inspect the first source/encode/decode/content/browser failure.
- Confirm runner FFmpeg exposes `libx264`, `libopus`, and `aac`, and that `cwebp` was installed.
- Do not manually push partially generated derivatives. Correct the source or pipeline and start a new upload.
- If the run fails after rebasing, production is unchanged; inspect current `main` for a concurrent content change before retrying.

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
