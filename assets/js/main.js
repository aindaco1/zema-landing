(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const story = document.querySelector("[data-scrub-story]");
  const scrubVideo = document.querySelector("[data-scrub-video]");
  const beats = Array.from(document.querySelectorAll("[data-scrub-beat]"));
  const progressBar = document.querySelector("[data-scrub-progress]");
  const gallery = document.querySelector("[data-gallery-scrub]");
  const galleryPanels = Array.from(document.querySelectorAll("[data-gallery-panel]"));
  const galleryVideos = Array.from(document.querySelectorAll("[data-gallery-video]"));
  const galleryProgress = document.querySelector("[data-gallery-progress]");
  const inquiry = document.querySelector("[data-inquiry-scrub]");
  const inquiryVideo = document.querySelector("[data-inquiry-video]");
  const inquiryProgress = document.querySelector("[data-inquiry-progress]");
  const siteAudio = document.querySelector("[data-site-audio]");
  const siteAudioMedia = document.querySelector("[data-site-audio-media]");
  const siteAudioToggle = document.querySelector("[data-site-audio-toggle]");
  const siteAudioState = document.querySelector("[data-site-audio-state]");
  const siteHeader = document.querySelector(".site-header");
  const dossier = document.querySelector(".dossier");
  const allowMotionMedia = !reducedMotion && !saveData;
  const scrubVideos = [scrubVideo].concat(galleryVideos, [inquiryVideo]).filter(Boolean);
  let ticking = false;
  let activeBeat = 0;
  let galleryHydrationReady = false;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setActiveBeat(index) {
    if (index === activeBeat) return;
    activeBeat = index;
    beats.forEach(function (beat, beatIndex) {
      const active = beatIndex === index;
      beat.classList.toggle("is-active", active);
      beat.setAttribute("aria-hidden", String(!active));
      beat.inert = !active;
    });
  }

  function createScrubController(video) {
    let targetProgress = 0;
    let seekFrame = 0;
    let lastAssignedTime = -1;

    function requestSeek() {
      if (seekFrame) return;
      seekFrame = window.requestAnimationFrame(function () {
        seekFrame = 0;
        if (!Number.isFinite(video.duration) || video.readyState < 1) return;
        const targetTime = targetProgress * Math.max(0, video.duration - 0.05);
        if (Math.abs(video.currentTime - targetTime) < 0.018) {
          lastAssignedTime = targetTime;
          return;
        }
        if (video.seeking && Math.abs(lastAssignedTime - targetTime) < 0.008) return;
        try {
          lastAssignedTime = targetTime;
          video.currentTime = targetTime;
        } catch (error) {
          lastAssignedTime = -1;
          // The poster remains visible if a browser rejects an early media seek.
        }
      });
    }

    video.addEventListener("loadedmetadata", requestSeek);
    video.addEventListener("seeked", function () {
      lastAssignedTime = video.currentTime;
      requestSeek();
    });
    video.addEventListener("progress", requestSeek);

    return {
      setProgress: function (progress) {
        targetProgress = clamp(progress, 0, 1);
        requestSeek();
      },
      request: requestSeek
    };
  }

  function hydrateScrubVideo(video, controller, onReady) {
    if (!video || video.dataset.hydrated === "true") return;
    video.dataset.hydrated = "true";
    video.preload = "auto";
    video.addEventListener("loadedmetadata", function () {
      video.pause();
      controller.request();
      if (onReady) onReady();
    }, { once: true });
    video.addEventListener("canplay", function () {
      video.classList.add("is-ready");
      controller.request();
      if (onReady) onReady();
    }, { once: true });

    function attachSource(source) {
      if (!video.isConnected) return;
      video.src = source;
      video.load();
    }

    if (window.fetch && window.URL && window.URL.createObjectURL) {
      window.fetch(video.dataset.src).then(function (response) {
        if (!response.ok) throw new Error("Scrub media request failed");
        return response.blob();
      }).then(function (blob) {
        const objectUrl = window.URL.createObjectURL(blob);
        video.dataset.objectUrl = objectUrl;
        attachSource(objectUrl);
      }).catch(function () {
        // Native media loading remains a functional fallback if Blob hydration fails.
        attachSource(video.dataset.src);
      });
    } else {
      attachSource(video.dataset.src);
    }
  }

  function hydrateWhenNear(element, rootMargin, hydrate) {
    if (!("IntersectionObserver" in window)) {
      hydrate();
      return;
    }

    const loader = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      hydrate();
      loader.disconnect();
    }, { rootMargin: rootMargin });
    loader.observe(element);
  }

  const storyController = scrubVideo ? createScrubController(scrubVideo) : null;
  const galleryControllers = galleryVideos.map(createScrubController);
  const inquiryController = inquiryVideo ? createScrubController(inquiryVideo) : null;

  function hydrateGalleryVideo(index) {
    const video = galleryVideos[index];
    const controller = galleryControllers[index];
    if (!video || !controller) return;
    hydrateScrubVideo(video, controller, requestUpdate);
  }

  function updateStory() {
    if (!story) return;
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / distance, 0, 1);
    const index = Math.min(beats.length - 1, Math.floor(progress * beats.length));

    setActiveBeat(index);
    story.classList.toggle("has-progress", progress > 0.015);
    if (progressBar) progressBar.style.transform = "scaleX(" + progress + ")";

    if (storyController) storyController.setProgress(progress);
  }

  function updateGallery() {
    if (!gallery || !gallery.classList.contains("is-enhanced")) return;
    const rect = gallery.getBoundingClientRect();
    const distance = Math.max(1, gallery.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / distance, 0, 1);
    const scaledProgress = progress * galleryPanels.length;
    const activeIndex = Math.min(
      galleryPanels.length - 1,
      Math.floor(Math.min(progress, 0.999999) * galleryPanels.length)
    );
    const activeProgress = clamp(scaledProgress - activeIndex, 0, 1);

    if (galleryHydrationReady) {
      hydrateGalleryVideo(activeIndex);
      if (activeProgress > 0.72 && activeIndex < galleryVideos.length - 1) {
        hydrateGalleryVideo(activeIndex + 1);
      }
    }

    galleryPanels.forEach(function (panel, index) {
      panel.classList.toggle("is-active", index === activeIndex);
      galleryControllers[index].setProgress(clamp(scaledProgress - index, 0, 1));
    });

    if (galleryProgress) {
      galleryProgress.style.transform = "scaleX(" + progress + ")";
    }
  }

  function updateInquiry() {
    if (!inquiry || !inquiry.classList.contains("is-enhanced") || !inquiryController) return;
    const rect = inquiry.getBoundingClientRect();
    const distance = Math.max(1, window.innerHeight + rect.height);
    const progress = clamp((window.innerHeight - rect.top) / distance, 0, 1);
    inquiryController.setProgress(progress);
    if (inquiryProgress) inquiryProgress.style.transform = "scaleX(" + progress + ")";
  }

  function updateHeaderTheme() {
    if (!siteHeader || !dossier) return;
    const dossierRect = dossier.getBoundingClientRect();
    const headerHeight = siteHeader.getBoundingClientRect().height;
    siteHeader.classList.toggle(
      "is-on-light",
      dossierRect.top < headerHeight && dossierRect.bottom > 0
    );
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateStory();
      updateGallery();
      updateInquiry();
      updateHeaderTheme();
      ticking = false;
    });
  }

  if (story && scrubVideo && allowMotionMedia) {
    story.classList.add("is-enhanced");
    story.dataset.scrubCodec = "h264-all-intra";
    hydrateScrubVideo(scrubVideo, storyController, updateStory);
  } else if (story) {
    story.classList.add("is-static");
  }

  if (gallery && galleryPanels.length && allowMotionMedia) {
    gallery.classList.add("is-enhanced");
    gallery.dataset.scrubCodec = "h264-all-intra";

    const hydrateGallery = function () {
      galleryHydrationReady = true;
      hydrateGalleryVideo(0);
      updateGallery();
    };

    hydrateWhenNear(gallery, "150% 0px", hydrateGallery);
  } else if (gallery) {
    gallery.classList.add("is-static");
  }

  if (inquiry && inquiryVideo && allowMotionMedia) {
    inquiry.classList.add("is-enhanced");
    inquiry.dataset.scrubCodec = "h264-all-intra";

    const hydrateInquiry = function () {
      hydrateScrubVideo(inquiryVideo, inquiryController, updateInquiry);
    };

    hydrateWhenNear(inquiry, "100% 0px", hydrateInquiry);
  } else if (inquiry) {
    inquiry.classList.add("is-static");
  }

  if (story || gallery || inquiry || dossier) {
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    requestUpdate();
  }

  if (siteAudio && siteAudioMedia && siteAudioToggle && siteAudioState) {
    let audioHydrated = false;

    function updateAudioControl(soundEnabled) {
      siteAudio.classList.toggle("is-sounding", soundEnabled);
      siteAudioToggle.setAttribute("aria-pressed", String(soundEnabled));
      siteAudioToggle.setAttribute(
        "aria-label",
        soundEnabled ? "Turn off ZEMA soundtrack" : "Turn on ZEMA soundtrack"
      );
      siteAudioState.textContent = soundEnabled ? "Sound on" : "Sound off";
    }

    function hydrateAudio() {
      if (audioHydrated) return;
      audioHydrated = true;
      siteAudioMedia.querySelectorAll("source[data-src]").forEach(function (source) {
        source.src = source.dataset.src;
      });
      siteAudioMedia.preload = "auto";
      siteAudioMedia.dataset.hydrated = "true";
      siteAudioMedia.load();
    }

    function startAudio(soundEnabled) {
      hydrateAudio();
      siteAudioMedia.muted = !soundEnabled;
      const playback = siteAudioMedia.play();
      updateAudioControl(soundEnabled);

      if (playback && typeof playback.catch === "function") {
        playback.catch(function () {
          siteAudioMedia.muted = true;
          updateAudioControl(false);
        });
      }
    }

    siteAudio.hidden = false;
    updateAudioControl(false);

    siteAudioToggle.addEventListener("click", function () {
      const enableSound = siteAudioToggle.getAttribute("aria-pressed") !== "true";
      if (enableSound) {
        startAudio(true);
      } else {
        siteAudioMedia.muted = true;
        updateAudioControl(false);
      }
    });

    if (!saveData) {
      const queueMutedPlayback = function () {
        window.setTimeout(function () {
          const begin = function () {
            if (!audioHydrated) startAudio(false);
          };
          if ("requestIdleCallback" in window) {
            window.requestIdleCallback(begin, { timeout: 2000 });
          } else {
            begin();
          }
        }, 1200);
      };

      if (document.readyState === "complete") {
        queueMutedPlayback();
      } else {
        window.addEventListener("load", queueMutedPlayback, { once: true });
      }
    }
  }

  const vinylCursor = document.querySelector("[data-vinyl-cursor]");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (vinylCursor && finePointer.matches) {
    let cursorX = -80;
    let cursorY = -80;
    let cursorFrame = 0;

    function paintCursor() {
      cursorFrame = 0;
      vinylCursor.style.setProperty("--cursor-x", cursorX + "px");
      vinylCursor.style.setProperty("--cursor-y", cursorY + "px");
    }

    document.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch") return;
      const target = event.target instanceof Element ? event.target : null;
      const usesNativeCursor = Boolean(target && target.closest("input, textarea, select, [contenteditable='true']"));

      cursorX = event.clientX;
      cursorY = event.clientY;
      document.documentElement.classList.add("has-vinyl-cursor");
      vinylCursor.classList.toggle("is-visible", !usesNativeCursor);
      if (!cursorFrame) cursorFrame = window.requestAnimationFrame(paintCursor);
    }, { passive: true });

    window.addEventListener("mouseout", function (event) {
      if (!event.relatedTarget) vinylCursor.classList.remove("is-visible");
    });
    window.addEventListener("blur", function () {
      vinylCursor.classList.remove("is-visible");
    });
  }

  document.querySelectorAll("[data-youtube-embed]").forEach(function (facade) {
    const playButton = facade.querySelector("[data-youtube-play]");
    const source = facade.dataset.youtubeSrc;
    const title = facade.dataset.youtubeTitle || "ZEMA complete film";
    if (!playButton || !source) return;

    playButton.addEventListener("click", function () {
      const iframe = document.createElement("iframe");
      iframe.src = source;
      iframe.title = title;
      iframe.frameBorder = "0";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      iframe.dataset.externalPlayer = "";

      const useNativePlayerCursor = function () {
        document.documentElement.classList.remove("has-vinyl-cursor");
        if (vinylCursor) vinylCursor.classList.remove("is-visible");
      };
      iframe.addEventListener("mouseenter", useNativePlayerCursor);
      iframe.addEventListener("focus", useNativePlayerCursor);

      facade.replaceChildren(iframe);
      facade.classList.add("is-loaded");
      iframe.focus();
    }, { once: true });
  });

  const form = document.querySelector("[data-inquiry-form]");
  const formStatus = document.querySelector("[data-form-status]");

  if (form && formStatus && window.fetch) {
    const supportPhone = form.dataset.phoneDisplay || "(505) 353-2455";

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const button = form.querySelector("button[type='submit']");
      const originalMarkup = button.innerHTML;

      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.textContent = "Sending…";
      formStatus.textContent = "";
      formStatus.setAttribute("role", "status");

      window.fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (response) {
        if (!response.ok) throw new Error("Form submission failed");
        form.reset();
        formStatus.setAttribute("role", "status");
        formStatus.textContent = "Your inquiry is on the record. The ZEMA team will be in touch.";
      }).catch(function () {
        formStatus.setAttribute("role", "alert");
        formStatus.textContent = "We could not send that inquiry. Please try again or call " + supportPhone + ".";
      }).finally(function () {
        button.disabled = false;
        button.removeAttribute("aria-disabled");
        button.innerHTML = originalMarkup;
      });
    });
  }

  window.addEventListener("pagehide", function () {
    if (siteAudioMedia) siteAudioMedia.pause();
    scrubVideos.forEach(function (video) {
      video.pause();
      if (video.dataset.objectUrl) {
        window.URL.revokeObjectURL(video.dataset.objectUrl);
      }
    });
  });
}());
