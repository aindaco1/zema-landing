const { test, expect } = require("@playwright/test");

async function disableSmoothScroll(page) {
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
}

async function scrollTo(page, y) {
  const target = Math.round(y);
  await page.evaluate((nextY) => window.scrollTo(0, nextY), target);
  await expect.poll(() => page.evaluate((nextY) => Math.abs(window.scrollY - nextY), target))
    .toBeLessThanOrEqual(4);
}

async function waitForMedia(page, selector) {
  const video = page.locator(selector);
  await expect.poll(() => video.evaluate((node) => node.duration || 0)).toBeGreaterThan(0);
  await expect.poll(() => video.evaluate((node) => node.readyState)).toBeGreaterThan(0);
}

async function expectMediaAtProgress(page, selector, progress, tolerance = 0.75) {
  await expect.poll(() => page.locator(selector).evaluate((video, nextProgress) => {
    const expected = nextProgress * Math.max(0, video.duration - 0.05);
    return Math.abs(video.currentTime - expected);
  }, progress)).toBeLessThan(tolerance);
}

test("hero preserves its poster until the matching opening frame is painted", async ({ page }) => {
  await page.route(/\/assets\/media\/zema-scroll\.mp4(?:\?.*)?$/, async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({ response });
  });

  await page.goto("./", { waitUntil: "domcontentloaded" });

  const poster = page.locator(".scrub-story__media img");
  const video = page.locator("[data-scrub-video]");
  await expect(video).not.toHaveClass(/is-ready/);
  await expect(video).toHaveCSS("opacity", "0");

  await expect(video).toHaveClass(/is-ready/, { timeout: 30_000 });
  const handoff = await page.evaluate(() => {
    const posterImage = document.querySelector(".scrub-story__media img");
    const scrubVideo = document.querySelector("[data-scrub-video]");
    const posterRect = posterImage.getBoundingClientRect();
    const videoRect = scrubVideo.getBoundingClientRect();
    const width = 160;
    const height = 90;
    const posterCanvas = document.createElement("canvas");
    const videoCanvas = document.createElement("canvas");
    posterCanvas.width = videoCanvas.width = width;
    posterCanvas.height = videoCanvas.height = height;
    posterCanvas.getContext("2d").drawImage(posterImage, 0, 0, width, height);
    videoCanvas.getContext("2d").drawImage(scrubVideo, 0, 0, width, height);
    const posterPixels = posterCanvas.getContext("2d").getImageData(0, 0, width, height).data;
    const videoPixels = videoCanvas.getContext("2d").getImageData(0, 0, width, height).data;
    let absoluteDifference = 0;
    for (let index = 0; index < posterPixels.length; index += 4) {
      absoluteDifference += Math.abs(posterPixels[index] - videoPixels[index]);
      absoluteDifference += Math.abs(posterPixels[index + 1] - videoPixels[index + 1]);
      absoluteDifference += Math.abs(posterPixels[index + 2] - videoPixels[index + 2]);
    }

    return {
      posterRect: [posterRect.x, posterRect.y, posterRect.width, posterRect.height],
      videoRect: [videoRect.x, videoRect.y, videoRect.width, videoRect.height],
      readyState: scrubVideo.readyState,
      seeking: scrubVideo.seeking,
      currentTime: scrubVideo.currentTime,
      meanPixelDifference: absoluteDifference / (width * height * 3)
    };
  });

  expect(handoff.videoRect).toEqual(handoff.posterRect);
  expect(handoff.readyState).toBeGreaterThanOrEqual(2);
  expect(handoff.seeking).toBe(false);
  expect(handoff.currentTime).toBeLessThan(0.018);
  expect(handoff.meanPixelDifference).toBeLessThan(6);
});

test("hero repeatedly resolves to the latest forward and reverse scrub position", async ({ page }) => {
  await page.goto("./");
  await disableSmoothScroll(page);
  await waitForMedia(page, "[data-scrub-video]");
  await expect.poll(() => page.locator("[data-scrub-video]").evaluate((video) => video.duration))
    .toBeGreaterThan(11.9);
  expect(await page.locator("[data-scrub-video]").evaluate((video) => video.duration))
    .toBeLessThan(12.1);

  const story = page.locator("[data-scrub-story]");
  await expect(story).toHaveClass(/is-enhanced/);
  await expect.poll(() => story.evaluate((node) => node.offsetHeight / window.innerHeight))
    .toBeGreaterThan(8);

  const layout = await story.evaluate((node) => ({
    top: window.scrollY + node.getBoundingClientRect().top,
    distance: node.offsetHeight - window.innerHeight
  }));

  for (const progress of [0.16, 0.74, 0.29, 0.88, 0.4, 0.65, 0.2]) {
    await scrollTo(page, layout.top + (layout.distance * progress));
    await expectMediaAtProgress(page, "[data-scrub-video]", progress);
  }

  await expect(story).not.toHaveClass(/is-static/);
  expect(await page.locator("[data-scrub-video]").evaluate((video) => video.error)).toBeNull();
});

test("first and third gallery clips repeatedly scrub in both directions", async ({ page }) => {
  await page.goto("./");
  await disableSmoothScroll(page);

  const gallery = page.locator("[data-gallery-scrub]");
  const videos = page.locator("[data-gallery-video]");
  await expect(videos).toHaveCount(3);
  const layout = await gallery.evaluate((node) => ({
    top: window.scrollY + node.getBoundingClientRect().top,
    distance: node.offsetHeight - window.innerHeight,
    viewport: window.innerHeight,
    height: node.offsetHeight
  }));

  await scrollTo(page, layout.top + (layout.distance * 0.02));
  await waitForMedia(page, "[data-gallery-video='0']");

  expect(await page.locator("[data-gallery-video='0']").getAttribute("src")).toBeTruthy();
  expect(await page.locator("[data-gallery-video='1']").getAttribute("src")).toBeNull();
  expect(await page.locator("[data-gallery-video='2']").getAttribute("src")).toBeNull();
  expect(await page.locator("[data-gallery-panel]").first().locator("video").evaluate((video) => (
    getComputedStyle(video).objectFit
  ))).toBe("cover");

  expect(layout.height / layout.viewport).toBeGreaterThan(9);
  expect((layout.distance / 3) / layout.viewport).toBeGreaterThan(2.5);

  for (const progress of [0.15, 0.72, 0.32, 0.88, 0.45, 0.2]) {
    await scrollTo(page, layout.top + (layout.distance * (progress / 3)));
    await expectMediaAtProgress(page, "[data-gallery-video='0']", progress);
  }
  expect(await page.locator("[data-gallery-video='0']").evaluate((video) => video.error)).toBeNull();

  await scrollTo(page, layout.top + (layout.distance * ((2 + 0.18) / 3)));
  await waitForMedia(page, "[data-gallery-video='2']");
  expect(await page.locator("[data-gallery-video='2']").evaluate((video) => video.duration))
    .toBeLessThan(15.9);

  for (const progress of [0.18, 0.78, 0.31, 0.9, 0.43]) {
    await scrollTo(page, layout.top + (layout.distance * ((2 + progress) / 3)));
    await expectMediaAtProgress(page, "[data-gallery-video='2']", progress);
  }
  expect(await page.locator("[data-gallery-video='2']").evaluate((video) => video.error)).toBeNull();

  await expect(gallery).toHaveClass(/is-enhanced/);
  await expect(gallery).not.toHaveClass(/is-static/);
});

test("the ZEMA file is a compact, full-width dossier without scrub media", async ({ page }) => {
  await page.goto("./#zema-file");
  await disableSmoothScroll(page);

  const dossier = page.locator("#zema-file");
  await expect(dossier.locator("video")).toHaveCount(0);
  await expect(dossier.locator(".dossier__visual")).toHaveCount(0);
  await expect(dossier.locator(".dossier__meta")).toHaveCount(1);
  const layout = await dossier.evaluate((node) => ({
    left: node.getBoundingClientRect().left,
    width: node.getBoundingClientRect().width,
    viewport: document.documentElement.clientWidth,
    paperHeight: node.querySelector(".dossier__paper").getBoundingClientRect().height,
    paperTransform: getComputedStyle(node.querySelector(".dossier__paper")).transform,
    columnEndBorders: [...node.querySelectorAll(".hours, .faq")]
      .map((column) => getComputedStyle(column).borderBottomWidth)
  }));

  expect(Math.abs(layout.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.width - layout.viewport)).toBeLessThanOrEqual(1);
  expect(layout.paperHeight).toBeLessThan(720);
  expect(layout.paperTransform).toBe("none");
  expect(layout.columnEndBorders).toEqual(["0px", "0px"]);
});

test("the inquiry ending montage repeatedly scrubs in both directions", async ({ page }) => {
  await page.goto("./");
  await disableSmoothScroll(page);

  const inquiry = page.locator("[data-inquiry-scrub]");
  const layout = await inquiry.evaluate((node) => ({
    top: window.scrollY + node.getBoundingClientRect().top,
    height: node.offsetHeight,
    viewport: window.innerHeight,
    backgroundIsDirectChild: node.querySelector(":scope > .inquiry__scrub") !== null,
    backgroundPosition: getComputedStyle(node.querySelector(".inquiry__scrub")).position,
    backgroundRect: node.querySelector(".inquiry__scrub").getBoundingClientRect().toJSON(),
    sectionRect: node.getBoundingClientRect().toJSON(),
    videoFit: getComputedStyle(node.querySelector("video")).objectFit
  }));
  const progressScroll = (progress) => (
    layout.top - layout.viewport + (progress * (layout.viewport + layout.height))
  );

  expect(layout.backgroundIsDirectChild).toBe(true);
  expect(layout.backgroundPosition).toBe("absolute");
  expect(layout.videoFit).toBe("cover");
  expect(Math.abs(layout.backgroundRect.width - layout.sectionRect.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(layout.backgroundRect.height - layout.sectionRect.height)).toBeLessThanOrEqual(1);

  await scrollTo(page, progressScroll(0.15));
  await waitForMedia(page, "[data-inquiry-video]");
  const duration = await page.locator("[data-inquiry-video]").evaluate((video) => video.duration);
  expect(duration).toBeGreaterThan(25);
  expect(duration).toBeLessThan(26);

  for (const progress of [0.15, 0.7, 0.33, 0.86, 0.46, 0.22]) {
    await scrollTo(page, progressScroll(progress));
    await expectMediaAtProgress(page, "[data-inquiry-video]", progress, 1);
  }
  expect(await page.locator("[data-inquiry-video]").evaluate((video) => video.error)).toBeNull();
});

test("the soundtrack stays lazy for Save-Data and makes sound only on request", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true }
    });
  });
  await page.goto("./", { waitUntil: "load" });
  await page.waitForTimeout(1600);

  const audio = page.locator("[data-site-audio-media]");
  const toggle = page.locator("[data-site-audio-toggle]");
  await expect(toggle).toHaveAccessibleName("Turn on ZEMA soundtrack");
  expect(await audio.evaluate((media) => media.dataset.hydrated || null)).toBeNull();
  expect(await audio.locator("source").evaluateAll((sources) => (
    sources.map((source) => source.getAttribute("src"))
  ))).toEqual([null, null]);
  expect(await audio.evaluate((media) => media.muted)).toBe(true);

  await toggle.click();
  await expect(audio).toHaveAttribute("data-hydrated", "true");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => audio.evaluate((media) => media.duration || 0)).toBeGreaterThan(201);
  expect(await audio.evaluate((media) => media.duration)).toBeLessThan(203);
  expect(await audio.evaluate((media) => ({ muted: media.muted, paused: media.paused })))
    .toEqual({ muted: false, paused: false });

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(await audio.evaluate((media) => media.muted)).toBe(true);
});

test("the complete film defers YouTube until play and preserves usable cursor behavior", async ({ page }) => {
  const youtubeRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).hostname.includes("youtube")) youtubeRequests.push(request.url());
  });
  await page.route("https://www.youtube-nocookie.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<!doctype html><title>Test YouTube player</title>"
  }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./", { waitUntil: "load" });

  const facade = page.locator("[data-youtube-embed]");
  const playButton = facade.getByRole("button", { name: "Play From Zema with Love — complete film" });
  await facade.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  await expect(facade.locator("iframe")).toHaveCount(0);
  await expect(facade.locator(".film__poster")).toHaveAttribute("src", /zema-film-youtube-thumbnail\.webp$/);
  expect(youtubeRequests).toEqual([]);

  const playBox = await playButton.boundingBox();
  await page.mouse.move(playBox.x + (playBox.width / 2), playBox.y + (playBox.height / 2));
  await expect(page.locator("html")).toHaveClass(/has-vinyl-cursor/);
  await expect(page.locator("[data-vinyl-cursor]")).toHaveClass(/is-visible/);
  await playButton.click();

  const iframe = facade.locator("iframe[data-external-player]");
  await expect(iframe).toHaveCount(1);
  await expect(iframe).toHaveAttribute("title", "From Zema with Love — complete film");
  const source = new URL(await iframe.getAttribute("src"));
  expect(source.hostname).toBe("www.youtube-nocookie.com");
  expect(source.searchParams.get("autoplay")).toBe("1");
  await expect.poll(() => youtubeRequests.length).toBeGreaterThan(0);

  await page.mouse.move(10, 100);
  await expect(page.locator("html")).toHaveClass(/has-vinyl-cursor/);
  const iframeBox = await iframe.boundingBox();
  await page.mouse.move(iframeBox.x + (iframeBox.width / 2), iframeBox.y + (iframeBox.height / 2));
  await expect(page.locator("html")).not.toHaveClass(/has-vinyl-cursor/);
  await expect(page.locator("[data-vinyl-cursor]")).not.toHaveClass(/is-visible/);
});

test("the compact header stays black, anchors jump, and the vinyl cursor spins", async ({ page }) => {
  await page.goto("./");

  const initial = await page.evaluate(() => {
    const header = document.querySelector(".site-header");
    const styles = getComputedStyle(header);
    return {
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      headerHeight: header.getBoundingClientRect().height,
      background: styles.backgroundColor,
      backdrop: styles.backdropFilter
    };
  });

  expect(initial.scrollBehavior).toBe("auto");
  expect(initial.headerHeight).toBeLessThanOrEqual(56);
  expect(initial.background).toBe("rgb(0, 0, 0)");
  expect(initial.backdrop).toBe("none");
  await expect(page.locator(".scrub-progress")).toHaveCount(0);

  await page.mouse.move(420, 260);
  await expect(page.locator("html")).toHaveClass(/has-vinyl-cursor/);
  await expect(page.locator("[data-vinyl-cursor]")).toHaveClass(/is-visible/);
  const cursor = await page.locator("[data-vinyl-cursor]").evaluate((node) => ({
    hidden: node.getAttribute("aria-hidden"),
    asset: node.querySelector("img").currentSrc,
    animation: getComputedStyle(node.querySelector("img")).animationName,
    width: node.getBoundingClientRect().width
  }));
  expect(cursor.hidden).toBe("true");
  expect(cursor.asset).toMatch(/zema-vinyl-cursor\.webp\?v=\d{8}[a-z]$/);
  expect(cursor.animation).toBe("vinyl-cursor-spin");
  expect(cursor.width).toBeGreaterThanOrEqual(44);
  expect(cursor.width).toBeLessThanOrEqual(48);

  await page.locator(".site-nav a[href='#visit']").click();
  await expect(page).toHaveURL(/#visit$/);
  const afterJump = await page.evaluate(() => ({
    targetTop: document.querySelector("#visit").getBoundingClientRect().top,
    background: getComputedStyle(document.querySelector(".site-header")).backgroundColor,
    backdrop: getComputedStyle(document.querySelector(".site-header")).backdropFilter
  }));
  expect(afterJump.targetTop).toBeGreaterThanOrEqual(50);
  expect(afterJump.targetTop).toBeLessThanOrEqual(60);
  expect(afterJump.background).toBe("rgb(0, 0, 0)");
  expect(afterJump.backdrop).toBe("none");
});

test("the complete layout reflows without clipping across responsive viewports", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await disableSmoothScroll(page);

  const viewports = [
    { width: 320, height: 568 },
    { width: 360, height: 640 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 568, height: 320 },
    { width: 760, height: 1024 },
    { width: 768, height: 1024 },
    { width: 900, height: 1200 },
    { width: 1024, height: 768 },
    { width: 1101, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await scrollTo(page, 0);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await expect.poll(() => page.evaluate(() => {
      const headerBottom = document.querySelector(".site-header").getBoundingClientRect().bottom;
      return Array.from(document.querySelectorAll(".scrub-beat")).every((beat) => {
        const box = beat.getBoundingClientRect();
        return box.top >= headerBottom - 1 && box.bottom <= window.innerHeight - 3;
      });
    })).toBe(true);

    const layout = await page.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const header = rect(".site-header");
      const logo = rect(".wordmark");
      const nav = rect(".site-nav");
      const audio = rect(".site-audio");
      const intro = document.querySelector(".intro");
      const introRect = intro.getBoundingClientRect();
      const introBackground = intro.querySelector(":scope > .intro__background");
      const introBackgroundRect = introBackground.getBoundingClientRect();
      const gallery = document.querySelector(".venue-gallery");
      const galleryRect = gallery.getBoundingClientRect();
      const footer = document.querySelector(".site-footer");
      const footerAddress = document.querySelector(".site-footer address a");
      const footerPhone = document.querySelector(".site-footer__phone a");
      const footerCredit = document.querySelector(".site-footer__credit");
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const heroBeats = Array.from(document.querySelectorAll(".scrub-beat")).map((beat) => {
        const box = beat.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom };
      });
      const sectionOverflow = Array.from(document.querySelectorAll("main > section, .site-footer"))
        .flatMap((section) => {
          const box = section.getBoundingClientRect();
          return box.left < -1 || box.right > viewportWidth + 1
            ? [{ className: section.className, left: box.left, right: box.right }]
            : [];
        });

      return {
        viewportWidth,
        viewportHeight,
        horizontalOverflow: document.documentElement.scrollWidth - viewportWidth,
        sectionOverflow,
        headerBottom: header.bottom,
        headerWithinViewport: header.left >= -1 && header.right <= viewportWidth + 1,
        headerGutters: {
          left: logo.left,
          right: viewportWidth - nav.right
        },
        logoNavGap: nav.left - logo.right,
        visibleNavItems: Array.from(document.querySelectorAll(".site-nav a"))
          .filter((link) => getComputedStyle(link).display !== "none").length,
        footerContactType: [
          parseFloat(getComputedStyle(footerAddress).fontSize),
          parseFloat(getComputedStyle(footerPhone).fontSize)
        ],
        footerCreditFits: footerCredit.scrollWidth <= footerCredit.clientWidth + 1
          && getComputedStyle(footerCredit).whiteSpace === "nowrap",
        footerBorderTopWidth: Number.parseFloat(getComputedStyle(footer).borderTopWidth),
        heroBeats,
        audio: {
          left: audio.left,
          right: audio.right,
          top: audio.top,
          bottom: audio.bottom,
          width: audio.width
        },
        intro: {
          backgroundSrc: introBackground.getAttribute("src"),
          backgroundAlt: introBackground.getAttribute("alt"),
          backgroundFit: getComputedStyle(introBackground).objectFit,
          backgroundOpacity: Number.parseFloat(getComputedStyle(introBackground).opacity),
          backgroundWidth: introBackgroundRect.width,
          backgroundHeight: introBackgroundRect.height,
          backgroundBottom: introBackgroundRect.bottom,
          width: introRect.width,
          height: introRect.height,
          galleryTop: galleryRect.top,
          galleryBackground: getComputedStyle(gallery).backgroundColor
        },
        galleryColumns: getComputedStyle(document.querySelector(".venue-gallery__grid"))
          .gridTemplateColumns.split(" ").length,
        filmColumns: getComputedStyle(document.querySelector(".film__header"))
          .gridTemplateColumns.split(" ").length,
        footerColumns: getComputedStyle(document.querySelector(".site-footer"))
          .gridTemplateColumns.split(" ").length
      };
    });

    expect(layout.horizontalOverflow, JSON.stringify({ viewport, layout }, null, 2)).toBe(0);
    expect(layout.sectionOverflow, JSON.stringify({ viewport, layout }, null, 2)).toEqual([]);
    expect(layout.headerWithinViewport).toBe(true);
    expect(layout.headerGutters.left).toBeGreaterThanOrEqual(19);
    expect(layout.headerGutters.right).toBeGreaterThanOrEqual(19);
    expect(layout.logoNavGap).toBeGreaterThanOrEqual(8);
    expect(layout.visibleNavItems).toBe(3);
    expect(layout.footerContactType[0]).toBe(layout.footerContactType[1]);
    expect(layout.footerCreditFits).toBe(true);
    if (viewport.width <= 760) expect(layout.footerContactType[0]).toBeLessThanOrEqual(12);
    expect(
      layout.heroBeats.every((beat) => beat.top >= layout.headerBottom - 1),
      JSON.stringify({ viewport, heroBeats: layout.heroBeats }, null, 2)
    ).toBe(true);
    expect(
      layout.heroBeats.every((beat) => beat.bottom <= layout.viewportHeight - 3),
      JSON.stringify({ viewport, heroBeats: layout.heroBeats }, null, 2)
    ).toBe(true);
    expect(layout.audio.left).toBeGreaterThanOrEqual(0);
    expect(layout.audio.right).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.audio.top).toBeGreaterThanOrEqual(0);
    expect(layout.audio.bottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.audio.width).toBeLessThanOrEqual(
      viewport.width <= 480 || viewport.height <= 500 ? 160 : 205
    );
    expect(Math.abs(((layout.audio.left + layout.audio.right) / 2) - (layout.viewportWidth / 2)))
      .toBeLessThanOrEqual(1);
    expect(layout.intro.backgroundSrc).toMatch(/zema-listening-room\.webp\?v=/);
    expect(layout.intro.backgroundAlt).toBe("");
    expect(layout.intro.backgroundFit).toBe("cover");
    expect(Math.abs(layout.intro.backgroundWidth - layout.intro.width)).toBeLessThanOrEqual(1);
    expect(layout.intro.backgroundOpacity).toBeCloseTo(0.72, 2);
    expect(Math.abs(layout.intro.backgroundHeight - layout.intro.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.intro.backgroundBottom - layout.intro.galleryTop)).toBeLessThanOrEqual(1);
    expect(layout.intro.galleryBackground).toBe("rgb(18, 11, 22)");
    expect(layout.galleryColumns).toBe(viewport.width <= 900 ? 1 : 3);
    expect(layout.filmColumns).toBe(viewport.width <= 1100 ? 1 : 2);
    expect(layout.footerColumns).toBe(3);
    expect(layout.footerBorderTopWidth).toBe(0);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);
  const dossierTop = await page.locator("#zema-file").evaluate((section) => section.offsetTop + 8);
  await scrollTo(page, dossierTop);
  await expect(page.locator(".site-header")).not.toHaveClass(/is-on-light/);
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(page.locator(".site-header")).toHaveCSS("color", "rgb(242, 234, 213)");
  const filmTop = await page.locator("#film").evaluate((section) => section.offsetTop + 8);
  await scrollTo(page, filmTop);
  await expect(page.locator(".site-header")).not.toHaveClass(/is-on-light/);
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgb(0, 0, 0)");
});

test("typography follows the documented brand family roles", async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => document.fonts.ready);

  const typography = await page.evaluate(() => {
    const font = (selector) => getComputedStyle(document.querySelector(selector)).fontFamily;
    const displaySelectors = [
      ".scrub-beat h1",
      ".intro h2",
      ".inquiry h2",
      ".venue-gallery__number"
    ];
    const bodySelectors = [
      ".eyebrow",
      ".site-nav a",
      ".intro__body",
      ".venue-gallery figcaption",
      ".inquiry__intro > p:last-child",
      ".form-grid label > span",
      ".form-grid input",
      ".film__meta li",
      ".site-audio__title",
      ".site-audio__copy strong",
      ".site-footer address",
      ".site-footer__links a"
    ];
    const dossierSelectors = [
      ".dossier h2",
      ".dossier h3",
      ".hours",
      ".faq summary"
    ];
    const scriptSelectors = [".film h2"];
    const kindredSelectors = [".scrub-beat__mark"];

    return {
      body: getComputedStyle(document.body).fontFamily,
      display: displaySelectors.map(font),
      supporting: bodySelectors.map(font),
      dossier: dossierSelectors.map(font),
      script: scriptSelectors.map(font),
      kindred: kindredSelectors.map(font),
      displayToken: getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim(),
      kindredToken: getComputedStyle(document.documentElement).getPropertyValue("--font-kindred").trim(),
      bodyToken: getComputedStyle(document.documentElement).getPropertyValue("--font-body").trim(),
      typewriterToken: getComputedStyle(document.documentElement).getPropertyValue("--font-typewriter").trim(),
      scriptToken: getComputedStyle(document.documentElement).getPropertyValue("--font-script").trim(),
      fontAssets: performance.getEntriesByType("resource")
        .map(({ name }) => name)
        .filter((name) => name.endsWith(".woff2")),
      electricBlueToken: getComputedStyle(document.documentElement).getPropertyValue("--electric-blue").trim(),
      retiredAcidToken: getComputedStyle(document.documentElement).getPropertyValue("--acid").trim()
    };
  });

  expect(typography.body).toBe("Arial, Helvetica, sans-serif");
  expect(typography.bodyToken).toBe(typography.body);
  expect(typography.displayToken).toContain("Georgia");
  expect(new Set(typography.display)).toEqual(new Set([typography.displayToken]));
  expect(new Set(typography.supporting)).toEqual(new Set([typography.bodyToken]));
  expect(new Set(typography.dossier)).toEqual(new Set([typography.typewriterToken]));
  expect(new Set(typography.script)).toEqual(new Set([typography.scriptToken]));
  expect(new Set(typography.kindred)).toEqual(new Set([typography.kindredToken]));
  expect([...typography.display, ...typography.supporting, ...typography.dossier, ...typography.script, ...typography.kindred]).not.toContain("Times");
  expect(typography.fontAssets).toHaveLength(2);
  for (const asset of typography.fontAssets) {
    expect(new URL(asset).origin).toBe(new URL(page.url()).origin);
  }
  expect(typography.fontAssets.some((asset) => asset.includes("/assets/fonts/italianno-zema.woff2"))).toBe(true);
  expect(typography.fontAssets.some((asset) => asset.includes("/assets/fonts/tan-kindred-zema.woff2"))).toBe(true);
  expect(typography.electricBlueToken).toBe("#4cc9ff");
  expect(typography.retiredAcidToken).toBe("");
});

test("static fallbacks, cache versions, footer, and media ranges stay intact", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByText("The complete film, presented with sound.", { exact: true })).toHaveCount(0);
  await expect(page.locator("[data-gallery-panel] figcaption").first()).toHaveText("Tap the banana three times");
  await expect(page.locator(".inquiry__scrub > span")).toHaveText("Make the lounge yours");
  await expect(page.getByText("Scroll through the night", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Submissions are processed securely by Formspree. No tracking pixels.")).toHaveCount(0);
  await expect(page.locator(".film__meta li")).toHaveText([
    "Consolee Mutusi as Zema",
    "Lex Lotito as Agent",
    "Director / Editor: Luca Silver",
    "Producers: Sharmin Dharas · Rylee Norman",
    "Writers: Luca Silver · Anna Buan · Alonso Indacochea",
    "Theme Music by Thomas Ropp",
    "Assistant Director: Rylee Norman",
    "2nd AD: Iz Zamora",
    "Cinematographer: Nata Aguilar",
    "1st AC: Aaron Cassini Beltran",
    "Gaffer: Samuel Shorty",
    "Makeup / Hair: Rhiannon Barela",
    "Special Thanks: Lucy Church · Brenda Ramos · Camille Griego · Grace Walker · Anthony Ortiz · Alan de Lira Richards · Jax Maloney"
  ]);
  const castLines = await page.locator(".film__meta li").evaluateAll((credits) => (
    credits.slice(0, 2).map((credit) => Math.round(credit.getBoundingClientRect().top))
  ));
  expect(castLines[1]).toBeGreaterThan(castLines[0]);
  await expect(page.locator(".inquiry__mark")).toHaveCount(0);
  await expect(page.locator(".site-footer__brand img")).toHaveCount(1);
  await expect(page.locator(".site-footer__brand img")).toHaveAttribute("alt", "");
  await expect(page.locator(".site-footer__brand strong")).toHaveCount(0);
  await expect(page.locator(".site-footer__brand .site-footer__label")).toHaveText("Tap the banana three times");
  await expect(page.locator(".site-footer__links > .site-footer__label")).toHaveText("Going on now");
  await expect(page.locator(".site-footer__links a[href='#inquire']")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "ZEMA on Instagram" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "ZEMA on Instagram" }).locator("svg")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "ZEMA events calendar" }).locator("svg")).toHaveCount(1);
  const eventsUrl = "https://www.hotelzazz.com/events-calendar#:~:text=Zazzy%20Events";
  const eventsLinks = page.locator(`a[href="${eventsUrl}"]`);
  await expect(eventsLinks).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Upcoming events" })).toHaveAttribute("href", eventsUrl);
  await expect(page.getByRole("link", { name: "Upcoming events" })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: "Upcoming events" })).toHaveAttribute("rel", /noopener/);
  await expect(page.locator(".site-nav a", { hasText: "Events" })).toHaveAttribute("href", eventsUrl);
  await expect(page.locator(".site-nav a", { hasText: "Events" })).toHaveAttribute("target", "_blank");
  await expect(page.locator(".site-nav a", { hasText: "Events" })).toHaveAttribute("rel", /noopener/);
  await expect(page.getByRole("link", { name: "ZEMA events calendar" })).toHaveAttribute("href", eventsUrl);
  await expect(page.getByRole("link", { name: "ZEMA events calendar" })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: "ZEMA events calendar" })).toHaveAttribute("rel", /noopener/);
  await expect(page.locator(".site-footer address a")).toHaveAttribute("href", /google\.com\/maps\/search/);
  await expect(page.locator(".site-footer a[href^='tel:']")).toHaveAttribute("href", "tel:+15053532455");
  await expect(page.locator(".site-footer a[href^='tel:']")).toHaveText("(505) 353-2455");
  await expect(page.locator(".dossier__contact")).toHaveCount(0);
  await expect(page.locator(".film__header .eyebrow a")).toHaveText(["Dust Wave", "Phantasmagoria"]);
  await expect(page.locator(".film__header .eyebrow a").nth(0)).toHaveAttribute("href", "https://dustwave.xyz");
  await expect(page.locator(".film__header .eyebrow a").nth(1)).toHaveAttribute("href", "https://phantasmagoria.xyz");
  await expect(page.locator("[data-scrub-story]")).toHaveClass(/is-static/);
  await expect(page.locator("[data-gallery-scrub]")).toHaveClass(/is-static/);
  await expect(page.locator("[data-inquiry-scrub]")).toHaveClass(/is-static/);
  await expect(page.locator("#zema-file video")).toHaveCount(0);
  await expect(page.locator("[data-vinyl-cursor]")).toHaveAttribute("aria-hidden", "true");
  const soundtrack = page.locator("[data-site-audio-media]");
  await expect(soundtrack).toHaveAttribute("muted", "");
  await expect(soundtrack).toHaveAttribute("loop", "");
  await expect(soundtrack.locator("source")).toHaveCount(2);
  await expect(soundtrack.locator("source").nth(0)).toHaveAttribute("data-src", /zema-soundtrack\.webm\?v=/);
  await expect(soundtrack.locator("source").nth(1)).toHaveAttribute("data-src", /zema-soundtrack\.m4a\?v=/);
  expect(await page.locator("[data-vinyl-cursor] img").evaluate((image) => (
    getComputedStyle(image).animationName
  ))).toBe("none");

  const structure = await page.evaluate(() => {
    const footer = document.querySelector(".site-footer");
    const footerTops = Array.from(footer.querySelectorAll(":scope > .site-footer__brand, :scope > .site-footer__column"))
      .map((element) => Math.round(element.getBoundingClientRect().top));
    const assetUrls = [
      Array.from(document.styleSheets).map((sheet) => sheet.href).find((href) => href && href.includes("main.css")),
      Array.from(document.scripts).map((script) => script.src).find((src) => src.includes("main.js")),
      document.querySelector(".scrub-story__media img").src,
      document.querySelector("[data-vinyl-cursor] img").src,
      document.querySelector(".intro__background").src,
      document.querySelector(".inquiry__scrub img").src,
      ...Array.from(document.querySelectorAll("[data-site-audio-media] source"))
        .map((source) => source.dataset.src),
      ...Array.from(document.querySelectorAll("[data-scrub-video], [data-gallery-video], [data-inquiry-video]"))
        .map((video) => video.dataset.src)
    ];

    return {
      assetUrls,
      bodyFont: getComputedStyle(document.body).fontFamily,
      footerAddressFont: getComputedStyle(footer.querySelector("address")).fontFamily,
      footerLinkFont: getComputedStyle(footer.querySelector(".site-footer__links a")).fontFamily,
      footerAddressSize: getComputedStyle(footer.querySelector("address a")).fontSize,
      footerPhoneSize: getComputedStyle(footer.querySelector("a[href^='tel:']")).fontSize,
      headerLabelType: [
        getComputedStyle(document.querySelector(".site-nav a")).fontFamily,
        getComputedStyle(document.querySelector(".site-nav a")).fontSize,
        getComputedStyle(document.querySelector(".site-nav a")).fontWeight,
        getComputedStyle(document.querySelector(".site-nav a")).letterSpacing,
        getComputedStyle(document.querySelector(".site-nav a")).lineHeight
      ],
      footerLabelTypes: Array.from(footer.querySelectorAll(":scope > .site-footer__brand > .site-footer__label, :scope > .site-footer__column > .site-footer__label"))
        .map((label) => {
          const style = getComputedStyle(label);
          return [style.fontFamily, style.fontSize, style.fontWeight, style.letterSpacing, style.lineHeight];
        }),
      footerColumnWidths: Array.from(footer.querySelectorAll(":scope > .site-footer__brand, :scope > .site-footer__column"))
        .map((column) => Math.round(column.getBoundingClientRect().width)),
      instagramBorder: getComputedStyle(footer.querySelector("a[aria-label='ZEMA on Instagram']")).borderStyle,
      iconTargetSizes: Array.from(footer.querySelectorAll(".site-footer__icon-link")).map((link) => {
        const rect = link.getBoundingClientRect();
        return [rect.width, rect.height];
      }),
      footerLogoWidth: footer.querySelector(".site-footer__brand img").getBoundingClientRect().width,
      footerHeight: footer.getBoundingClientRect().height,
      footerTopSpread: Math.max(...footerTops) - Math.min(...footerTops),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hydratedVideos: Array.from(document.querySelectorAll("[data-scrub-video], [data-gallery-video], [data-inquiry-video]"))
        .filter((video) => video.hasAttribute("src")).length
    };
  });

  const versions = structure.assetUrls.map((url) => new URL(url, page.url()).searchParams.get("v"));
  expect(new Set(versions).size).toBe(1);
  expect(versions[0]).toMatch(/^\d{8}[a-z]$/);
  expect(structure.footerAddressFont).toBe(structure.bodyFont);
  expect(structure.footerLinkFont).toBe(structure.bodyFont);
  expect(structure.footerAddressSize).toBe(structure.footerPhoneSize);
  expect(structure.footerLabelTypes).toEqual([
    structure.headerLabelType,
    structure.headerLabelType,
    structure.headerLabelType
  ]);
  expect(Math.max(...structure.footerColumnWidths) - Math.min(...structure.footerColumnWidths)).toBeLessThanOrEqual(1);
  expect(structure.instagramBorder).toBe("none");
  expect(structure.iconTargetSizes).toEqual([[44, 44], [44, 44]]);
  expect(structure.footerLogoWidth).toBeGreaterThanOrEqual(160);
  expect(structure.footerHeight).toBeLessThan(500);
  expect(structure.footerTopSpread).toBeLessThanOrEqual(1);
  expect(structure.horizontalOverflow).toBe(0);
  expect(structure.hydratedVideos).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBe(0);

  const mobileLayout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const footer = document.querySelector(".site-footer");
    const footerColumns = Array.from(footer.querySelectorAll(":scope > .site-footer__brand, :scope > .site-footer__column"));
    const offenders = Array.from(document.querySelectorAll("body *")).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.right <= viewportWidth + 1 && rect.left >= -1) return [];
      return [{
        element: element.tagName.toLowerCase(),
        className: element.className || "",
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      }];
    }).slice(0, 10);

    return {
      overflow: document.documentElement.scrollWidth - viewportWidth,
      offenders,
      footerTrackCount: getComputedStyle(footer).gridTemplateColumns.split(" ").length,
      footerTopSpread: Math.max(...footerColumns.map((column) => column.getBoundingClientRect().top))
        - Math.min(...footerColumns.map((column) => column.getBoundingClientRect().top))
    };
  });
  expect(mobileLayout.overflow, JSON.stringify(mobileLayout.offenders, null, 2)).toBe(0);
  expect(mobileLayout.footerTrackCount).toBe(3);
  expect(mobileLayout.footerTopSpread).toBeLessThanOrEqual(1);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const mobileFooterClearance = await page.evaluate(() => ({
    creditBottom: document.querySelector(".site-footer__credit").getBoundingClientRect().bottom,
    audioTop: document.querySelector(".site-audio").getBoundingClientRect().top
  }));
  expect(mobileFooterClearance.creditBottom).toBeLessThan(mobileFooterClearance.audioTop);

  const documentResponse = await request.get("/");
  const documentMarkup = await documentResponse.text();
  expect(documentMarkup).toContain('preload="none"');
  expect(documentMarkup).toContain("data-src=\"/assets/media/editorial/zema-soundtrack.webm");
  expect(documentMarkup).not.toContain("/zema-landing/");
  expect(documentMarkup).not.toMatch(/<source\s+src="[^"]*zema-soundtrack/);

  for (const asset of [
    "zema-scroll.mp4",
    "zema-gallery-dance.mp4",
    "zema-inquiry-scrub.mp4",
    "zema-soundtrack.webm",
    "zema-soundtrack.m4a"
  ]) {
    const response = await request.get(`/assets/media/editorial/${asset}`, {
      headers: { Range: "bytes=0-1023" }
    });
    expect(response.status()).toBe(206);
    expect(response.headers()["content-range"]).toMatch(/^bytes 0-1023\/\d+$/);
    expect((await response.body()).byteLength).toBe(1024);
  }
});
