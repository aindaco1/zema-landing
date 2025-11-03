# Zema Vinyl Lounge

A lightweight, scroll‑story Jekyll site with 1970s aesthetic and frame‑by‑frame video scrubbing. Inspired by Bloomscroll's narrative interaction model.

## Features

- **Scroll-driven video scrubbing**: Mouse wheel/touch controls video playback frame-by-frame (24fps, stops at frame 360)
- **Minimal footprint**: ~60KB CSS+JS gzipped; lazy-loaded media
- **1970s aesthetic**: Film grain, scanlines, chromatic aberration, warm desaturated palette
- **Fully accessible**: Keyboard nav, screen reader support, `prefers-reduced-motion` and Save-Data detection
- **GitHub Pages ready**: Native Jekyll compilation, no build step

---

## Setup Instructions

### Prerequisites

**macOS:**
- Ruby 2.7+ (check: `ruby -v`)
- Bundler (install: `gem install bundler`)

**Windows 10/11:**
- [RubyInstaller for Windows](https://rubyinstaller.org/) (with DevKit)
- Run `ridk install` after installation to set up MSYS2
- Bundler (install: `gem install bundler`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aindaco1/zema-landing.git
   cd zema-landing
   ```

2. **Install dependencies**
   ```bash
   bundle install
   ```

3. **Start local development server**
   ```bash
   bundle exec jekyll serve
   ```

4. **Open in browser**
   - macOS/Windows: `http://localhost:4000/zema-landing/`

### File Structure

```
zema-landing/
├── _config.yml              # Jekyll config (baseurl, build settings)
├── _data/
│   └── frames.yml          # Content model (all frames, copy, media paths)
├── _includes/
│   ├── head.html           # Meta tags, CSS links, JSON-LD
│   ├── frame-video.html    # Video frame template
│   ├── frame-dossier.html  # FAQ interstitial template
│   └── frame-form.html     # Contact form template
├── _layouts/
│   └── default.html        # Root HTML wrapper
├── assets/
│   ├── css/
│   │   ├── main.scss       # Main stylesheet (imports partials)
│   │   ├── _reset.scss     # CSS reset
│   │   ├── _layout.scss    # Viewport, sticky positioning
│   │   ├── _frame.scss     # Frame variants (video/dossier/form)
│   │   ├── _theme70s.scss  # Grain, scanlines, aberration
│   │   └── _loading.scss   # Loading spinner
│   ├── js/
│   │   └── main.js         # Virtual scroll + video scrubbing
│   └── media/
│       ├── intro-poster.webp
│       ├── intro.webm / intro.mp4
│       ├── value-poster.webp
│       ├── value.webm / value.mp4
│       ├── proof-poster.webp
│       ├── proof.webm / proof.mp4
│       └── dossier.webp
├── index.html              # Main page (loops frames.yml)
└── agents.md               # Technical spec & roadmap
```

---

## Content Management

Edit `_data/frames.yml` to update copy, add/remove frames, or change media paths. Jekyll rebuilds automatically in dev mode.

### Adding a New Video Frame

```yaml
- id: new-frame
  kind: video
  title: "Your headline"
  copy: "Supporting copy (1-2 lines)"
  poster: "assets/media/new-frame-poster.webp"
  video_webm: "assets/media/new-frame.webm"
  video_mp4: "assets/media/new-frame.mp4"
  bg: "#0d0d0d"
```

Place media files in `assets/media/` and run the FFmpeg pipeline (see below).

---

## Media Pipeline (FFmpeg)

Use these commands to prepare video assets:

### Generate WebP Poster (from frame at 0.25s)
```bash
ffmpeg -ss 0.25 -i input.mov -frames:v 1 -vf "scale=1280:-1:flags=lanczos" -q:v 60 poster.webp
```

### Encode WebM (VP9, Chrome/Android)
```bash
ffmpeg -i input.mov -c:v libvpx-vp9 -b:v 1800k -crf 32 -pix_fmt yuv420p -row-mt 1 -an -vf "scale=1280:-2" output.webm
```

### Encode MP4 (H.264, Safari/iOS)
```bash
ffmpeg -i input.mov -c:v libx264 -profile:v high -pix_fmt yuv420p -b:v 2000k -crf 21 -movflags +faststart -an -vf "scale=1280:-2" output.mp4
```

**Performance Budgets:**
- Posters: ≤120KB each
- Videos: 1.5–2.5 Mbps desktop, 1.0–1.5 Mbps mobile
- Grain tile: ≤12KB
- CSS: ≤20KB gz
- JS: ≤8KB gz

---

## Key Technical Details

### Scroll-Scrub Interaction
- **First video only** scrubs on landing (other videos are placeholder for future)
- Scroll wheel/touch input accumulates into `virtualScroll` counter
- Maps 0–3000px virtual scroll → 0–15s video time (frame 0–360 @ 24fps)
- Uses easing interpolation (30%) + frame snapping for smooth playback
- Allows scrolling **up** to reverse video back to poster
- Unlocks normal page scroll after frame 360

### Video Loading Strategy
- First video: immediate source injection with `preload="auto"`
- Wait for `canplaythrough` before enabling interaction (prevents jitter)
- MP4 prioritized (H.264 baseline) with WebM VP9 fallback
- Poster shows during load; loading spinner until video ready

### Browser Support
- Modern evergreen browsers (Chrome, Firefox, Edge, Safari)
- iOS Safari 15+, Android Chrome 110+
- Graceful degradation: reduced-motion shows posters only

---

## Deployment (GitHub Pages)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update content"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Repo Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/ (root)`

3. **Access site**
   - `https://aindaco1.github.io/zema-landing/`

Jekyll compiles SCSS automatically; no separate build step required.

---

## Development Commands

| Command | Purpose |
|---------|---------|
| `bundle exec jekyll serve` | Start local dev server (with live reload) |
| `bundle exec jekyll serve --livereload` | Enable auto-refresh on file changes |
| `bundle exec jekyll build` | Build static site to `_site/` |
| `bundle exec jekyll clean` | Clear `_site/` and `.jekyll-cache/` |

---

## Troubleshooting

**Video won't load:**
- Check paths in `_data/frames.yml` (should be `assets/media/filename.ext`)
- Verify files exist in `assets/media/`
- Check browser console for MIME type errors

**Scrubbing is jittery:**
- Ensure video is fully buffered (`canplaythrough` event)
- Videos should be ≤2 Mbps, H.264 High profile
- Test with `--livereload` disabled (reduces CPU contention)

**Poster stretched:**
- Verify poster and video use same aspect ratio
- CSS uses `object-fit: contain` to preserve proportions

**Spinner doesn't hide:**
- Check that `_layouts/default.html` includes `<div id="loading">`
- Verify `_loading.scss` is imported in `main.scss`

---

## Contributing

See [agents.md](agents.md) for full technical spec, roadmap, and sprint breakdown.

**Owner:** @aindaco1  
**License:** MIT  
**Repo:** https://github.com/aindaco1/zema-landing
