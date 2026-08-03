# Media pipeline

**Audience:** editors, motion designers, developers, technical producers, and software agents

**Purpose:** preserve the source ranges, delivery formats, performance rules, and validation procedure for production media

**Last verified:** August 2, 2026

## Media policy

The film master is owner-supplied and intentionally kept out of the repository. The site contains only web delivery derivatives, posters, official marks, the small soundtrack cut, and the decorative pointer. The complete film is hosted once on YouTube.

Scroll reliability comes from all-intra H.264 derivatives, controlled hydration, and coalesced seeks. The files are high-quality lossy web encodes—not lossless masters. Replacing them with lossless video would increase transfer and decode cost without improving the source experience.

## Production inventory

| Asset | Master range | Delivery | Approx. size | Purpose |
| --- | --- | --- | ---: | --- |
| `zema-scroll.mp4` | `15.223542–16.766750` joined to `40.832458–53.845458` | 1440×810 H.264, all-intra | 7.8 MB | Hero vinyl-to-drink-prep scrub |
| `zema-gallery-arrival.mp4` | `58.75–79.5` | 1280×720 H.264, all-intra | 9.7 MB | Agent dossier, Hotel Zazz reveal, banana tap, lounge entry |
| `zema-gallery-cocktails.mp4` | `84.2–94.8` | 1280×720 H.264, all-intra | 4.5 MB | Cocktail movement |
| `zema-gallery-dance.mp4` | `160.0–175.75` | 1280×720 H.264, all-intra | 8.8 MB | Dance movement ending before the dancer leaves center frame |
| `zema-inquiry-scrub.mp4` | `186.52–212.02` | 1280×720 H.264, all-intra | 13.5 MB | Agent awakening through the final clean record tilt |
| `zema-soundtrack.webm` | `13.90–215.78` | 64 kbps VBR Opus | 1.5 MB | Primary soundtrack source |
| `zema-soundtrack.m4a` | `13.90–215.78` | 80 kbps AAC | 2.0 MB | Compatibility soundtrack source |
| `zema-hero-poster.webp` | Film still | 1920×1080 WebP | 143 KB | Hero LCP and static fallback |
| `zema-inquiry-poster.webp` | Film still | 1920×1080 WebP | 51 KB | Inquiry fallback |
| `zema-film-poster.webp` | Film still | 1920×1080 WebP | 100 KB | YouTube facade |
| `zema-social.jpg` | Composed still | 1200×630 JPEG | 74 KB | Broadly compatible social preview |
| `zema-exterior/evening/dance.webp` | Film stills | 1920×1080 WebP | 74–157 KB | Gallery fallbacks |
| `zema-logo-black/white.webp` | Official marks | 1200×1200 WebP | 224–225 KB | Header/footer and metadata |
| `zema-vinyl-cursor.webp` | Derived pointer | 256×256 transparent WebP | 6 KB | Runtime pointer and audio control |

Exact file paths and runtime assignments are canonical in `_data/frames.yml` and the templates. File sizes above are review aids, not configuration.

## Video encoding contract

Every scrub derivative must preserve these properties:

- H.264 High profile in MP4 for broad browser hardware/software support.
- `yuv420p` pixel format.
- All frames are I-frames: `-g 1 -keyint_min 1 -bf 0 -refs 1 -sc_threshold 0`.
- `+faststart` moves MP4 metadata ahead of media data.
- No audio track; scroll media is decorative and muted.
- Original aspect ratio remains 16:9.
- 1440×810 only for the tested hero; 1280×720 for gallery and inquiry scrubs.
- No file above GitHub's 100 MB hard limit; retain the current practical target below approximately 15 MB per derivative.

Do not substitute WebM or a long-GOP encode without full browser testing. File extension and codec must agree.

## Hero encode

The hero removes the material between the overhead record and drink preparation by joining two native scene ranges:

```sh
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]trim=start=15.223542:end=16.766750,setpts=PTS-STARTPTS[v0];[0:v]trim=start=40.832458:end=53.845458,setpts=PTS-STARTPTS[v1];[v0][v1]concat=n=2:v=1:a=0,scale=1440:810:flags=lanczos,fps=24000/1001,setpts=PTS-STARTPTS[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset medium -crf 26 -profile:v high -level 4.1 \
  -pix_fmt yuv420p -g 1 -keyint_min 1 -bf 0 -refs 1 \
  -sc_threshold 0 -an -avoid_negative_ts make_zero \
  -movflags +faststart zema-scroll.mp4
```

The expected duration is approximately 14.6 seconds. The join must land on clean scene boundaries and the output must end before the photograph flash.

## Single-range scrub template

Replace `START`, `END`, and `OUTPUT` with a range from the inventory:

```sh
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]trim=start=START:end=END,setpts=PTS-STARTPTS,scale=1280:720:flags=lanczos,fps=24000/1001[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset medium -crf 26 -profile:v high -level 4.1 \
  -pix_fmt yuv420p -g 1 -keyint_min 1 -bf 0 -refs 1 \
  -sc_threshold 0 -an -avoid_negative_ts make_zero \
  -movflags +faststart OUTPUT.mp4
```

Always review the first and last decoded frames. A technically exact timestamp can still be editorially wrong.

## Soundtrack derivatives

The soundtrack begins on the first needle drop and includes the final musical tail. Create one Opus source and one AAC compatibility source from the same master range:

```sh
ffmpeg -ss 13.90 -to 215.78 -i input.mp4 \
  -vn -c:a libopus -b:a 64k -vbr on zema-soundtrack.webm

ffmpeg -ss 13.90 -to 215.78 -i input.mp4 \
  -vn -c:a aac -b:a 80k -movflags +faststart zema-soundtrack.m4a
```

The HTML renders `data-src`, not `src`; JavaScript hydrates the browser-selectable sources later. Do not add two audio elements or force both files to download.

## Poster and still guidance

- Use a visually intentional frame rather than an arbitrary midpoint.
- Export photos/stills as WebP at the native display crop; use 1920×1080 for section media.
- Preserve the 1200×630 JPEG social image because social crawlers remain more consistent with JPEG than WebP.
- Use transparency only where necessary, such as the pointer.
- Do not stretch or reconstruct the official ZEMA marks.
- Keep essential words out of imagery; all operational content belongs in HTML.

Example still export:

```sh
ffmpeg -ss FRAME_TIME -i input.mp4 -frames:v 1 \
  -vf "scale=1920:1080:flags=lanczos" \
  -c:v libwebp -quality 82 -compression_level 6 output.webp
```

## Validation after every encode

### 1. Inspect stream metadata

```sh
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,profile,pix_fmt,width,height,r_frame_rate,duration \
  -of default=noprint_wrappers=1 output.mp4
```

### 2. Prove every video frame is a keyframe

```sh
ffprobe -v error -select_streams v:0 -show_entries frame=key_frame \
  -of csv=p=0 output.mp4 | sort -u
```

The only output should be `1`.

### 3. Decode the complete file

```sh
ffmpeg -v error -i output.mp4 -f null -
```

No output means no decode error.

### 4. Review editorial boundaries

- Hero: overhead record → drink preparation; no intervening lounge material; stop before flash.
- Arrival: agent reading dossier → Hotel Zazz reveal → three banana taps → lounge entry.
- Dance: stop while the dancer remains centered.
- Inquiry: begin when the agent awakens; stop on the clean record tilt before credits.

### 5. Verify browser behavior

1. Replace the file without changing its declared role.
2. Bump `asset_version` in `_config.yml`.
3. Run `npm test`.
4. Confirm forward and reverse scrubbing in a real browser.
5. After deployment, request `Range: bytes=0-1023` and verify `206 Partial Content`.

## Runtime loading contract

- Hero video hydrates immediately only when motion and data preferences permit; its poster remains the LCP candidate.
- Gallery hydration begins within a `150%` root margin and stages one movement at a time.
- Inquiry hydration begins within a `100%` root margin.
- Scrub files are fetched as Blobs before seeking; native URL loading is the fallback.
- Soundtrack hydrates during an idle task after load, except under Save-Data, and hydrates immediately after explicit sound intent.
- YouTube does not load before explicit play intent.
- Blob URLs are revoked on `pagehide`.

Changing this policy requires updates to [Technical architecture](ARCHITECTURE.md), [Experience design](EXPERIENCE_DESIGN.md), and the lazy-loading/range tests.
