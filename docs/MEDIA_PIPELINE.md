# Media pipeline

**Audience:** editors, motion designers, developers, technical producers, and software agents

**Purpose:** preserve the source ranges, delivery formats, performance rules, and validation procedure for production media

**Last verified:** August 16, 2026

## Media policy

The film master is owner-supplied and intentionally kept out of the repository. The site contains only web delivery derivatives, posters, official marks, the small soundtrack cut, and the decorative pointer. The complete film is hosted once on YouTube.

Scroll reliability comes from all-intra H.264 derivatives, controlled hydration, and coalesced seeks. The files are high-quality lossy web encodes—not lossless masters. Replacing them with lossless video would increase transfer and decode cost without improving the source experience.

## Production inventory

| Asset | Master range | Delivery | Approx. size | Purpose |
| --- | --- | --- | ---: | --- |
| `zema-scroll.mp4` | `15.223542–16.766750`; `51.289250→46.989250` | 1440×810 H.264, all-intra | 8.0 MB | Hero: centered vinyl, eye pullback, reverse to glass set-down |
| `zema-gallery-arrival.mp4` | `58.75–79.5` | 1280×720 H.264, all-intra | 9.7 MB | Agent dossier, Hotel Zazz reveal, banana tap, lounge entry |
| `zema-gallery-cocktails.mp4` | `84.2–94.8` | 1280×720 H.264, all-intra | 4.5 MB | Cocktail movement |
| `zema-gallery-dance.mp4` | `160.0–175.75` | 1280×720 H.264, all-intra | 8.8 MB | Dance movement ending before the dancer leaves center frame |
| `zema-inquiry-scrub.mp4` | `186.52–212.02` | 1280×720 H.264, all-intra | 13.5 MB | Agent awakening through the final clean record tilt |
| `zema-soundtrack.webm` | `13.90–215.78` | 64 kbps VBR Opus | 1.5 MB | Primary soundtrack source |
| `zema-soundtrack.m4a` | `13.90–215.78` | 80 kbps AAC | 2.0 MB | Compatibility soundtrack source |
| `zema-hero-poster.webp` | Film still | 1920×1080 WebP | 88 KB | Reframed hero LCP and static fallback |
| `zema-inquiry-poster.webp` | Film still | 1920×1080 WebP | 51 KB | Inquiry fallback |
| `zema-film-poster.webp` | Film still | 1920×1080 WebP | 100 KB | YouTube facade |
| `zema-listening-room.webp` | Venue-supplied photo | 1500×1215 WebP | 219 KB | Venue introduction background |
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

The 288-frame hero holds the record for the first three 72-frame copy beats. The clean vinyl range is used twice, with each copy retimed to 122 frames and joined by a four-frame dissolve around frame 118. This provides nearly twice the source rotation of the previous slow treatment while retaining the full record scale, the 80 px rightward shift, and a mirrored edge extension beneath the dark text shade. A twenty-four-frame dissolve begins at frame 216 and introduces the final beat's 30-frame 8× crop on the screen-left eye, aligned with the record spindle using the focal offset `(660, 386)` in the 1440×810 source canvas. It then uses 42 reversed frames to travel from the portrait to the moment her hand releases the finished glass on the bar. All intervening drink-preparation footage is omitted.

```sh
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]scale=1440:810:flags=lanczos,split=4[a0][a1][b][c];[a0]trim=start=15.223542:end=16.766750,setpts=(PTS-STARTPTS)*3.2973,pad=1520:810:80:0:black,crop=1440:810:0:0,fillborders=left=80:mode=mirror,fps=24000/1001,trim=end_frame=122,setpts=N/(24000/1001*TB),settb=AVTB[v0];[a1]trim=start=15.223542:end=16.766750,setpts=(PTS-STARTPTS)*3.2973,pad=1520:810:80:0:black,crop=1440:810:0:0,fillborders=left=80:mode=mirror,fps=24000/1001,trim=end_frame=122,setpts=N/(24000/1001*TB),settb=AVTB[v1];[v0][v1]xfade=transition=fade:duration=0.166833:offset=4.921583,trim=end_frame=240,setpts=N/(24000/1001*TB),settb=AVTB[vinyl];[b]trim=start=51.289250:end=51.339250,select='eq(n,0)',zoompan=z='8-7*on/29':x='max(0,min(iw-iw/zoom,660-iw/(2*zoom)))':y='max(0,min(ih-ih/zoom,386-ih/(2*zoom)))':d=30:s=1440x810:fps=24000/1001,setpts=N/(24000/1001*TB),settb=AVTB[eye];[c]trim=start=46.989250:end=51.289250,reverse,setpts=(PTS-STARTPTS)/2.455,fps=24000/1001,trim=end_frame=42,setpts=N/(24000/1001*TB),settb=AVTB[reverse];[eye][reverse]concat=n=2:v=1:a=0,setpts=N/(24000/1001*TB),settb=AVTB[ending];[vinyl][ending]xfade=transition=fade:duration=1.001:offset=9.009,fps=24000/1001,trim=end_frame=288,setpts=N/(24000/1001*TB)[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset medium -crf 24 -profile:v high -level 4.1 \
  -pix_fmt yuv420p -g 1 -keyint_min 1 -bf 0 -refs 1 \
  -sc_threshold 0 -an -avoid_negative_ts make_zero \
  -movflags +faststart zema-scroll.mp4
```

The expected output is 288 frames and approximately 12.012 seconds at `24000/1001` fps. Review the vinyl-loop dissolve around frames 118–122, the spindle-to-eye dissolve at frames 216–240, the portrait-to-reverse handoff at frame 246, and the final glass-set-down frame. No film credit, stirrer, or preparation action should appear in the output.

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
- Preserve the listening-room photo at its native 1500×1215 dimensions; the venue introduction contains it as a static responsive `cover` layer at reduced opacity beneath the text shade.
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

- Hero: repeated overhead record → eye pullback → reverse to glass set-down; no film credit or drink-preparation passage.
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
