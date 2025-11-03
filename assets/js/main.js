// Zema Vinyl Lounge - Scroll-scrub video controller

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection?.saveData;
  
  if (prefersReducedMotion || saveData) {
    return;
  }
  
  const videoFrames = [...document.querySelectorAll('[data-kind="video"]')];
  const loadingScreen = document.getElementById('loading');
  let firstVideoLoaded = false;
  let scrollLocked = true;
  let virtualScroll = 0;
  let interactionBlocked = true;
  
  const fps = 24;
  const maxFrame = 360;
  const maxTime = maxFrame / fps; // 15 seconds
  const scrollRange = 3000; // pixels to scrub to frame 360
  
  // Preload first video immediately
  const firstFrame = videoFrames[0];
  if (firstFrame) {
    const firstVideo = firstFrame.querySelector('video');
    if (firstVideo) {
      const mp4 = firstVideo.getAttribute('data-mp4');
      const webm = firstVideo.getAttribute('data-webm');
      
      // Try MP4 first (better compatibility)
      if (mp4) {
        const srcMp4 = document.createElement('source');
        srcMp4.src = mp4;
        srcMp4.type = 'video/mp4; codecs="avc1.42E01E"';
        firstVideo.appendChild(srcMp4);
      }
      if (webm) {
        const srcWebm = document.createElement('source');
        srcWebm.src = webm;
        srcWebm.type = 'video/webm; codecs="vp9"';
        firstVideo.appendChild(srcWebm);
      }
      
      console.log('Loading video sources:', { mp4, webm });
      firstVideo.load();
      
      // Wait for enough data to scrub smoothly
      firstVideo.addEventListener('canplaythrough', () => {
        console.log('Video ready. Duration:', firstVideo.duration, 'readyState:', firstVideo.readyState);
        firstVideoLoaded = true;
        interactionBlocked = false;
        
        // Hide loading screen
        if (loadingScreen) {
          loadingScreen.classList.add('loaded');
          setTimeout(() => loadingScreen.style.display = 'none', 500);
        }
        
        // Start scrubbing
        setupScrubbing(firstVideo);
      }, { once: true });
      
      firstVideo.addEventListener('error', (e) => {
        console.error('Video load error:', e, firstVideo.error);
      });
    }
  }
  
  function setupScrubbing(video) {
    let ticking = false;
    let currentTime = 0;
    const frameTime = 1 / fps; // Time per frame
    
    function updateScrub() {
      if (scrollLocked) {
        // Scrub video based on virtual scroll
        const progress = Math.max(0, Math.min(1, virtualScroll / scrollRange));
        const targetTime = progress * maxTime;
        
        // Smooth interpolation to target time
        const diff = targetTime - currentTime;
        currentTime += diff * 0.3; // Ease towards target
        
        // Snap to frame boundaries for smoother playback
        const frameNumber = Math.round(currentTime * fps);
        const snappedTime = frameNumber / fps;
        
        if (Math.abs(video.currentTime - snappedTime) > frameTime / 2) {
          video.currentTime = snappedTime;
        }
        
        // Unlock when we reach frame 360
        if (virtualScroll >= scrollRange) {
          scrollLocked = false;
          console.log('Scroll unlocked - page can now scroll normally');
        } else if (virtualScroll > 0) {
          // Keep page locked at top while scrubbing
          window.scrollTo(0, 0);
        }
      }
      
      ticking = false;
    }
    
    function onWheel(e) {
      if (interactionBlocked) return;
      
      if (scrollLocked) {
        e.preventDefault();
        // Smooth out scroll delta and allow reverse
        virtualScroll = Math.max(0, virtualScroll + (e.deltaY * 0.6));
        console.log('Virtual scroll:', virtualScroll.toFixed(0), 'currentTime:', video.currentTime.toFixed(2));
        
        if (!ticking) {
          window.requestAnimationFrame(updateScrub);
          ticking = true;
        }
      }
    }
    
    window.addEventListener('wheel', onWheel, { passive: false });
    
    // Handle touch scrolling
    let touchStartY = 0;
    let lastTouchY = 0;
    
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      lastTouchY = touchStartY;
    }, { passive: true });
    
    window.addEventListener('touchmove', (e) => {
      if (interactionBlocked) return;
      
      if (scrollLocked) {
        const touchY = e.touches[0].clientY;
        const delta = lastTouchY - touchY;
        lastTouchY = touchY;
        virtualScroll = Math.max(0, virtualScroll + delta);
        
        if (!ticking) {
          window.requestAnimationFrame(updateScrub);
          ticking = true;
        }
      }
    }, { passive: true });
  }
  
  // Ensure first frame fills viewport initially
  if (firstFrame) {
    firstFrame.style.minHeight = '100vh';
  }
  
  // Pager navigation
  const prevBtn = document.querySelector('[data-prev]');
  const nextBtn = document.querySelector('[data-next]');
  const allFrames = [...document.querySelectorAll('[data-frame]')];
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const scrollY = window.scrollY;
      allFrames.forEach((frame, idx) => {
        const rect = frame.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom > 0 && idx > 0) {
          allFrames[idx - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (scrollLocked) {
        virtualScroll = scrollRange;
        scrollLocked = false;
        return;
      }
      
      const scrollY = window.scrollY;
      allFrames.forEach((frame, idx) => {
        const rect = frame.getBoundingClientRect();
        if (rect.top <= 0 && rect.bottom > 0 && idx < allFrames.length - 1) {
          allFrames[idx + 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
})();
