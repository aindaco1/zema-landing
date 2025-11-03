A living plan for building a lightweight, scroll‑story Jekyll site (GitHub Pages) that mimics Bloomscroll’s (https://bloomscroll.com) frame‑by‑frame narrative with minimal JS, primarily HTML/SCSS. Includes an interstitial “dossier/FAQ” page that pauses video playback, displays a static dossier image with subtle 1970s effects, then resumes the video narrative below. Final frame includes a content/contact form (Formspree) and a clear CTA.

⸻

1) High‑Level Goals

Primary
	•	Tell a short, crisp brand story via scroll‑snapped “frames,” each filling the viewport.
	•	Keep the implementation extremely small, fast, and maintainable (works on desktop, tablet, mobile).
	•	Require minimal JavaScript: only for lazy media hydration and play/pause control.
	•	Include an in‑flow FAQ dossier section (static image + CSS text overlays/animations) where videos pause.
	•	End with a contact/content form using a free service (Formspree) and a strong CTA.

Success Criteria / Acceptance
	•	LCP < 2.5s on cable/4G for home page; CLS < 0.02; TBT ~0; Lighthouse perf ≥ 90 on mid‑range mobile.
	•	One playing video at a time; offscreen videos are paused/unloaded.
	•	Full keyboard and screen‑reader navigation; honors prefers-reduced-motion.
	•	Works on modern evergreen browsers; graceful/functional on iOS Safari 15+ and Android Chrome 110+.

⸻

2) Narrative Strategy
	•	Structure: ~6–10 frames. Each frame = one chapter beat (headline + 1–2 short lines).
	•	Motion: scroll-driven video scrubbing — scrolling down controls `video.currentTime` frame-by-frame within defined scroll zones. Each video occupies a vertical scroll distance (e.g., 100vh per video), then content/dossier sections resume normal scrolling.
	•	Aesthetic (1970s): subtle grain overlay, scanlines, chromatic aberration on headings, warm palette, slightly under‑saturated video encodes.
	•	Dossier/FAQ Interstitial: mid‑story breakpoint that freezes video scrubbing to share practical info (FAQ, offering, pricing cues), then return to video scrubbing narrative.

⸻

3) Content Model

Use Jekyll _data/frames.yml to drive the entire page. All asset paths are relative (e.g., assets/media/intro.webp); Jekyll prepends site.baseurl in templates.

# _data/frames.yml
site_title: "Zema Vinyl Lounge"
cta_target: "#contact"
frames:
  - id: intro
    kind: video
    title: "We make stories move."
    copy: "A lightweight, film‑inspired scroller for the 70s short."
    poster: "assets/media/intro-poster.webp"
    video_webm: "assets/media/intro.webm"
    video_mp4: "assets/media/intro.mp4"
    bg: "#0d0d0d"

  - id: value
    kind: video
    title: "Built for speed."
    copy: "Minimal JS. Heavy on feel."
    poster: "assets/media/value-poster.webp"
    video_webm: "assets/media/value.webm"
    video_mp4: "assets/media/value.mp4"

  - id: dossier
    kind: dossier
    title: "Inside the dossier"
    copy: "Answers to the usual questions."
    image: "assets/media/dossier.webp"
    faqs:
      - q: "What is the Zema Vinyl Lounge?"
        a: "A scroll‑story landing page for a 70s‑set short/business teaser."
      - q: "How heavy is it?"
        a: "Under ~60KB CSS+JS gzipped; media lazy‑loaded."
      - q: "Accessibility?"
        a: "Keyboard, SR, reduced‑motion, high‑contrast text over scrims."

  - id: proof
    kind: video
    title: "Production‑ready."
    copy: "Frames from the short, encoded for the web."
    poster: "assets/media/proof-poster.webp"
    video_webm: "assets/media/proof.webm"
    video_mp4: "assets/media/proof.mp4"

  - id: contact
    kind: form
    title: "Let’s talk"
    copy: "Tell us about your project."
    form_action: "https://formspree.io/f/XXXXXXXX" # replace with real endpoint

Notes
	•	kind controls rendering policy (video | dossier | form).
	•	For video frames, poster + video element in HTML; first video sources injected immediately, others lazy.
	•	Videos use preload="auto" for first frame; object-fit:contain preserves aspect ratio.
	•	For dossier, static background image with CSS overlays (details/summary FAQ).
	•	For form, Formspree form with honeypot + privacy note.

⸻

4) IA / Templates

Files

_config.yml
_data/frames.yml
assets/
  css/
    main.scss
    _reset.scss
    _layout.scss
    _frame.scss
    _theme70s.scss
  js/
    main.js
  media/
    posters + videos + dossier image + grain tile
_includes/
  head.html
  analytics.html (optional)
layouts/
  default.html
index.html

layouts/default.html: root HTML, metadata, CSS/JS links, base landmarks.

index.html: loops site.data.frames.frames and renders a <section class="frame" data-frame data-kind="..."> per item.

⸻

5) Rendering Rules (pseudo‑Liquid)

<main class="story" role="main">
  {% for f in site.data.frames.frames %}
    {% case f.kind %}
      {% when 'video' %}
        {% include frame-video.html f=f %}
      {% when 'dossier' %}
        {% include frame-dossier.html f=f %}
      {% when 'form' %}
        {% include frame-form.html f=f %}
    {% endcase %}
  {% endfor %}
</main>
<nav class="pager" aria-label="Frame navigation">
  <button data-prev>Prev</button>
  <button data-next>Next</button>
</nav>

Partial includes (_includes/):
	•	frame-video.html: <section> with poster <video data-lazy poster=...>; real sources only via JS.
	•	frame-dossier.html: <section> with background image, overlay content (<details><summary> for FAQ with no JS), decorative scanlines/grain.
	•	frame-form.html: <form> posting to Formspree, success/failure message area.

⸻

6) Minimal JS Responsibilities (assets/js/main.js)
	1.	Virtual scroll for video scrubbing:
	•	Intercept wheel/touch events when scrollLocked = true.
	•	Accumulate scroll delta into virtualScroll counter (allows bidirectional scrubbing).
	•	Map virtualScroll to video.currentTime with smooth easing (30% interpolation) + frame snapping.
	•	Block all interaction until first video fires canplaythrough event (ensures smooth scrubbing).
	•	Unlock normal page scroll when virtualScroll reaches scrollRange (3000px = frame 360 @ 24fps).
	2.	First video preload strategy:
	•	Immediately inject <source> elements for first video on page load (preload="auto").
	•	Prioritize MP4 with H.264 codec for compatibility; WebM VP9 as fallback.
	•	Show poster until canplaythrough; keep loading spinner visible until ready.
	3.	Pager ([data-prev]/[data-next]): scroll to previous/next section; Next button skips to end of scrub if locked.
	4.	Reduced Motion: if matchMedia('(prefers-reduced-motion: reduce)'), bail early and show posters only.
	5.	Save‑Data: if navigator.connection?.saveData, bail early.

No frameworks; ~4 KB minified. Key params: 24fps, frame 360 max, 3000px scroll range, 0.6x wheel dampening.

⸻

7) SCSS Architecture
	•	_reset.scss: modern CSS reset (box‑sizing, typography defaults).
	•	_layout.scss: .frame--video uses position:sticky on .media container to keep video visible; .content positioned absolutely over video with pointer-events:none (children re-enable). No scroll-snap.
	•	_frame.scss: frame variants (video/dossier/form), scrims, object‑fit, FAQ styling (details/summary). Video and poster use object-fit:contain for proper aspect ratio.
	•	_theme70s.scss: grain overlay (SVG noise filter), scanlines (repeating-linear-gradient on dossier), chromatic aberration headline shadows, gentle vignette. Palette uses CSS variables.
	•	_loading.scss: fixed loading spinner (50px, white border-top); fades out with .loaded class.
	•	main.scss: imports all partials + media queries; @media (prefers-reduced-motion: reduce) fallbacks.

Accessibility
	•	Logical heading order, aria-label on pager, sufficient contrast.
	•	Avoid text over busy areas; use radial scrims.
	•	Ensure summary elements are keyboard togglable; provide focus outlines.

⸻

8) Form (Formspree)
	•	Use a simple, accessible HTML form with required fields; no JS required for submission.
	•	Add honeypot field to deter bots.
	•	Provide an inline success message fragment that Formspree can redirect back to (?ok=1) or use their AJAX snippet if desired (optional).

<form action="https://formspree.io/f/XXXXXXXX" method="POST" class="contact" id="contact">
  <label>
    <span>Name</span>
    <input name="name" type="text" required>
  </label>
  <label>
    <span>Email</span>
    <input name="email" type="email" required>
  </label>
  <label>
    <span>Project</span>
    <textarea name="message" rows="5" required></textarea>
  </label>
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
  <button type="submit">Send</button>
</form>

Privacy: link a minimal privacy note stating submissions are processed by Formspree; no tracking pixels; anonymized analytics only (if any).

⸻

9) Dossier/FAQ Interstitial (No‑JS content + tiny JS pause hook)

Markup (include)

<section class="frame frame--dossier" data-frame data-kind="dossier" style="--bg:#0b0b0b" aria-labelledby="faq-title">
  <div class="media" aria-hidden="true">
    <img src="{{ f.image }}" alt="" loading="lazy">
  </div>
  <div class="content">
    <h2 id="faq-title" class="title">{{ f.title }}</h2>
    <p class="copy">{{ f.copy }}</p>
    <div class="faq">
      {% for item in f.faqs %}
      <details>
        <summary>{{ item.q }}</summary>
        <p>{{ item.a }}</p>
      </details>
      {% endfor %}
    </div>
  </div>
</section>

Behavior
	•	When this frame becomes active, JS sets a pausedByDossier = true, pauses any playing video, and prevents autoplay until the user scrolls beyond this frame (when it becomes non‑active, clear the flag and resume next video frame).
	•	Add subtle CSS animations (type‑in, underline blink) using keyframes; disable under prefers-reduced-motion.

⸻

10) Performance Budget & Media Pipeline

Budgets
	•	CSS ≤ 20KB gz.
	•	JS ≤ 8KB gz (target 2–3KB).
	•	Grain tile ≤ 12KB; posters ≤ 120KB each; videos ≤ 1.5–2.5 Mbps desktop, ≤ 1.0–1.5 Mbps mobile.

FFmpeg one‑liners

# Poster (WebP) from t=0.25s
ffmpeg -ss 0.25 -i input.mov -frames:v 1 -vf "scale=1280:-1:flags=lanczos" -q:v 60 poster.webp

# WebM VP9 (good for Chrome/Android)
ffmpeg -i input.mov -c:v libvpx-vp9 -b:v 1800k -crf 32 -pix_fmt yuv420p -row-mt 1 -an -vf "scale=1280:-2" output.webm

# MP4 H.264 (Safari/iOS fallback)
ffmpeg -i input.mov -c:v libx264 -profile:v high -pix_fmt yuv420p -b:v 2000k -crf 21 -movflags +faststart -an -vf "scale=1280:-2" output.mp4

Optional future: AV1 for Chrome if bandwidth allows.

⸻

11) SEO / Social / Analytics
	•	Server a minimal <title>/<meta name="description"> and og:/twitter: image (use dossier image or a composed still).
	•	JSON‑LD WebSite/Organization basics.
	•	No render‑blocking fonts; system UI stack.
	•	Optional privacy‑friendly analytics (e.g., Plausible) via analytics.html include; load defer.

⸻

12) Deployment (GitHub Pages)
	•	Use Jekyll‑native GitHub Pages setup; SCSS compiled by Jekyll.
	•	Keep assets/ fingerprint‑free to keep it simple (or add a cache‑bust query on deploy if needed).
	•	Protect main branch; PR preview via a separate Action if we need it.

⸻

13) Risks & Mitigations
	•	Mobile data usage: rely on posters, Save‑Data detection, one‑video‑at‑a‑time policy.
	•	iOS autoplay quirks: ensure muted, playsinline, and user gesture from pager is available if autoplay fails.
	•	Scroll‑snap jitter on older Safari: set scroll-snap-type: y mandatory, give frames scroll-snap-align: start, and avoid nested scrolling.
	•	Content legibility: enforce scrims; test with simulated sunlight contrast profiles.

⸻

14) Roadmap / To‑Dos

Sprint 0 — Scaffold
	•	Initialize Jekyll skeleton, add _config.yml, layouts/default.html, index.html.
	•	Add _data/frames.yml with stub frames.
	•	Wire _includes/head.html with meta + CSS.
	•	Commit to GitHub; enable Pages.

Sprint 1 — Styles & Frame Components
	•	Add SCSS partials (_reset, _layout, _frame, _theme70s).
	•	Build frame-video.html, frame-dossier.html, frame-form.html includes.
	•	Implement grain/scanlines/aberration + scrim system.

Sprint 2 — Minimal JS
	•	Implement IntersectionObserver frame tracker.
	•	Lazy‑hydrate videos; ensure single active playback.
	•	Dossier gate: pause/resume logic.
	•	Pager prev/next.
	•	Respect prefers-reduced-motion & Save‑Data.

Sprint 3 — Assets & Performance
	•	Transcode sample clips (WebM/MP4) + posters with FFmpeg.
	•	Add loading="lazy" on images; test posters only mode.
	•	Lighthouse/QoE tuning to meet budget.

Sprint 4 — Content & Form
	•	Populate real copy for each frame.
	•	Plug in Formspree action; test success/failure.
	•	Add privacy note and minimal SEO.

Sprint 5 — QA & Accessibility
	•	Keyboard tab order, visible focus.
	•	Screen reader labels/landmarks.
	•	Reduced motion and high contrast checks.
	•	Cross‑browser test matrix (Chrome, Firefox, Safari iOS/macOS, Edge).

Future Enhancements (optional)
	•	Scroll‑linked CSS animations where supported.
	•	Sprite‑sheet type card for title.
	•	Inline image optimizer on build.

⸻

15) Definition of Done (DoD)
	•	✅ Meets performance budgets on mid‑range mobile (field test).
	•	✅ Videos autoplay silently when active and pause offscreen; one at a time.
	•	✅ Dossier interstitial fully accessible with details/summary and doesn’t cause layout shift.
	•	✅ Form posts successfully to Formspree, includes privacy note, and degrades without JS.
	•	✅ Honors reduced‑motion and Save‑Data; copy remains legible in all frames.

⸻

16) Open Questions
	•	Which 6–10 beats (headlines) make the cut for v1? (Provide script/copy.)
	•	Specific 70s texture reference (stock vs. custom grain)?
	•	Do we want a success/thank‑you route after the form or inline message only?
	•	Do we need basic i18n hooks for captions/copy?

⸻

17) Dev Notes (snippets)

Video include (essential structure)

<section class="frame" data-frame data-kind="video" style="--bg:{{ f.bg | default: '#000' }}">
  <div class="media">
    <video class="v" preload="metadata" muted loop playsinline poster="{{ f.poster }}" data-lazy>
      <!-- sources injected by JS when near viewport -->
    </video>
  </div>
  <div class="content">
    <h1 class="title">{{ f.title }}</h1>
    <p class="copy">{{ f.copy }}</p>
    <a class="cta" href="{{ site.data.frames.cta_target }}">Get in touch</a>
  </div>
</section>

JS: virtual scroll scrubbing (working implementation)

let virtualScroll = 0;
let scrollLocked = true;
let interactionBlocked = true;
const scrollRange = 3000; // pixels
const maxTime = 360 / 24; // frame 360 @ 24fps = 15s

// Block interaction until canplaythrough
video.addEventListener('canplaythrough', () => {
  interactionBlocked = false;
  setupScrubbing(video);
});

function onWheel(e) {
  if (interactionBlocked || !scrollLocked) return;
  e.preventDefault();
  virtualScroll = Math.max(0, virtualScroll + (e.deltaY * 0.6));
  requestAnimationFrame(() => {
    const progress = Math.min(1, virtualScroll / scrollRange);
    const targetTime = progress * maxTime;
    // Smooth easing + frame snapping for 24fps
    video.currentTime = Math.round(targetTime * 24) / 24;
    
    if (virtualScroll >= scrollRange) scrollLocked = false;
    else window.scrollTo(0, 0);
  });
}


⸻

Owner: @aindaco1
Repo: zema-landing
License: MIT (default)
Status: v1.0 — scroll-scrub implemented & tested