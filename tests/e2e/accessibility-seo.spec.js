const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

function formatViolations(violations) {
  return violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(" ")).join(", ");
    return `${violation.id} (${violation.impact}): ${violation.help}\n  ${targets}`;
  }).join("\n");
}

async function expectNoAxeViolations(page) {
  const results = await new AxeBuilder({ page })
    .exclude("[data-external-player]")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}

test("page meets the automated WCAG 2.2 AA baseline", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(page.locator("main")).toBeVisible();
  await expectNoAxeViolations(page);

  const undersizedTargets = await page.evaluate(() => Array.from(document.querySelectorAll(
    "a[href], button, summary, input, select, textarea, iframe"
  )).flatMap((element) => {
    if (element.closest("[aria-hidden='true'], [inert], .honeypot") || element.type === "hidden") return [];
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden" || rect.width === 0 || rect.height === 0) return [];
    if (rect.width >= 24 && rect.height >= 24) return [];
    return [{
      element: element.outerHTML.slice(0, 180),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }];
  }));
  expect(undersizedTargets).toEqual([]);

  await page.setViewportSize({ width: 320, height: 720 });
  await expect.poll(() => page.evaluate(() => (
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  ))).toBe(0);
  await expectNoAxeViolations(page);
});

test("enhanced scroll states expose only the visible narrative beat", async ({ page }) => {
  await page.goto("./");
  const story = page.locator("[data-scrub-story]");
  await expect(story).toHaveClass(/is-enhanced/);
  await expectNoAxeViolations(page);

  const distance = await story.evaluate((node) => node.offsetHeight - window.innerHeight);
  await page.evaluate((target) => window.scrollTo(0, target), distance * 0.8);
  await expect.poll(() => page.locator("[data-scrub-beat]:not([inert])").count()).toBe(1);
  const activeBeat = page.locator("[data-scrub-beat]:not([inert])");
  await expect(activeBeat).toHaveAttribute("aria-hidden", "false");
  await expect(activeBeat.getByRole("link", { name: "Plan an evening" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("landmarks, headings, skip link, FAQ, and form work from the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(page.getByRole("banner")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  const filmFacade = page.locator("[data-youtube-embed]");
  await expect(filmFacade.locator("iframe")).toHaveCount(0);
  await expect(filmFacade.locator(".film__poster")).toHaveAttribute("loading", "lazy");
  await expect(filmFacade.locator(".film__poster")).toHaveAttribute("alt", "");
  await expect(filmFacade.getByRole("button")).toHaveAccessibleName("Play From Zema with Love — complete film");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const eventsLink = page.getByRole("link", { name: "Events", exact: true });
  await eventsLink.focus();
  const linkFocus = await eventsLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(linkFocus.style).not.toBe("none");
  expect(linkFocus.width).toBeGreaterThanOrEqual(3);

  const soundtrackToggle = page.locator("[data-site-audio-toggle]");
  await expect(soundtrackToggle).toHaveAccessibleName("Turn on ZEMA soundtrack");
  await expect(soundtrackToggle).toHaveAttribute("aria-pressed", "false");
  await soundtrackToggle.focus();
  await page.keyboard.press("Enter");
  await expect(soundtrackToggle).toHaveAttribute("aria-pressed", "true");
  await expect(soundtrackToggle).toHaveAccessibleName("Turn off ZEMA soundtrack");
  await expect.poll(() => page.locator("[data-site-audio-media]").evaluate((audio) => ({
    muted: audio.muted,
    paused: audio.paused
  }))).toEqual({ muted: false, paused: false });
  await page.keyboard.press("Enter");
  await expect(soundtrackToggle).toHaveAttribute("aria-pressed", "false");
  await expect(soundtrackToggle).toHaveAccessibleName("Turn on ZEMA soundtrack");
  expect(await page.locator("[data-site-audio-media]").evaluate((audio) => audio.muted)).toBe(true);

  const firstDetails = page.locator(".faq details").first();
  const firstQuestion = firstDetails.locator("summary");
  await firstQuestion.focus();
  await page.keyboard.press("Enter");
  await expect(firstDetails).toHaveAttribute("open", "");

  for (const [selector, label] of [
    ["input[name='name']", "Name"],
    ["input[name='email']", "Email"],
    ["select[name='event_type']", "Event type"],
    ["textarea[name='message']", "Tell us about the evening"]
  ]) {
    const snapshot = await page.locator(selector).ariaSnapshot();
    expect(snapshot).toContain(label);
    expect(snapshot).toContain("required");
  }

  const hiddenFocusable = await page.locator("[aria-hidden='true']").evaluateAll((containers) => (
    containers.flatMap((container) => Array.from(container.querySelectorAll(
      "a[href]:not([tabindex='-1']), button:not([tabindex='-1']):not([disabled]), input:not([tabindex='-1']):not([disabled]), select:not([tabindex='-1']):not([disabled]), textarea:not([tabindex='-1']):not([disabled]), [tabindex]:not([tabindex='-1'])"
    )).filter((element) => !element.closest("[inert]")).map((element) => element.outerHTML))
  ));
  expect(hiddenFocusable).toEqual([]);
});

test("form validation and server failures are announced without losing the submit action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#inquire");

  const submit = page.getByRole("button", { name: "Send inquiry" });
  await submit.click();
  await expect(page.locator("input[name='name']")).toBeFocused();

  await page.locator("input[name='name']").fill("Accessibility Test");
  await page.locator("input[name='email']").fill("test@example.com");
  await page.locator("select[name='event_type']").selectOption({ label: "Private party" });
  await page.locator("textarea[name='message']").fill("Testing the accessible form error state.");
  await page.route("https://formspree.io/**", (route) => route.fulfill({ status: 500, body: "{}" }));
  await submit.click();

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("We could not send that inquiry");
  await expect(submit).toBeEnabled();
  await expect(submit).toHaveAccessibleName("Send inquiry");
});

test("public metadata, structured data, and crawl files stay coherent", async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");

  const metadata = await page.evaluate(() => {
    const content = (selector) => document.querySelector(selector)?.getAttribute("content") || "";
    const jsonLd = Array.from(document.querySelectorAll("script[type='application/ld+json']"))
      .flatMap((script) => {
        const parsed = JSON.parse(script.textContent);
        return parsed["@graph"] || [parsed];
      });

    return {
      title: document.title,
      description: content("meta[name='description']"),
      robots: content("meta[name='robots']"),
      canonical: document.querySelector("link[rel='canonical']")?.href || "",
      ogTitle: content("meta[property='og:title']"),
      ogDescription: content("meta[property='og:description']"),
      ogSiteName: content("meta[property='og:site_name']"),
      ogLocale: content("meta[property='og:locale']"),
      ogImage: content("meta[property='og:image']"),
      ogImageAlt: content("meta[property='og:image:alt']"),
      ogImageWidth: content("meta[property='og:image:width']"),
      ogImageHeight: content("meta[property='og:image:height']"),
      twitterCard: content("meta[name='twitter:card']"),
      twitterTitle: content("meta[name='twitter:title']"),
      twitterDescription: content("meta[name='twitter:description']"),
      twitterImage: content("meta[name='twitter:image']"),
      twitterImageAlt: content("meta[name='twitter:image:alt']"),
      jsonLd
    };
  });

  expect(metadata.title.length).toBeGreaterThanOrEqual(30);
  expect(metadata.title.length).toBeLessThanOrEqual(60);
  expect(metadata.description.length).toBeGreaterThanOrEqual(70);
  expect(metadata.description.length).toBeLessThanOrEqual(160);
  expect(metadata.robots).toContain("index");
  expect(metadata.robots).toContain("max-image-preview:large");
  expect(metadata.canonical).toBe("https://aindaco1.github.io/zema-landing/");
  expect(metadata.ogTitle).toBe(metadata.title);
  expect(metadata.ogDescription).toBe(metadata.description);
  expect(metadata.ogSiteName).toBe("ZEMA Vinyl Lounge");
  expect(metadata.ogLocale).toBe("en_US");
  expect(metadata.ogImage).toMatch(/\/zema-social\.jpg$/);
  expect(metadata.ogImageAlt).not.toBe("");
  expect(metadata.ogImageWidth).toBe("1200");
  expect(metadata.ogImageHeight).toBe("630");
  expect(metadata.twitterCard).toBe("summary_large_image");
  expect(metadata.twitterTitle).toBe(metadata.title);
  expect(metadata.twitterDescription).toBe(metadata.description);
  expect(metadata.twitterImage).toBe(metadata.ogImage);
  expect(metadata.twitterImageAlt).toBe(metadata.ogImageAlt);

  const graphTypes = metadata.jsonLd.flatMap((node) => node["@type"] || []);
  expect(graphTypes).toEqual(expect.arrayContaining(["WebSite", "WebPage", "BarOrPub"]));
  const business = metadata.jsonLd.find((node) => node["@type"] === "BarOrPub");
  expect(business.name).toBe("ZEMA Vinyl Lounge");
  expect(business.telephone).toBe("+15053532455");
  expect(business.address.addressLocality).toBe("Albuquerque");
  expect(business.openingHoursSpecification).toHaveLength(3);
  expect(business.sameAs).toContain("https://www.instagram.com/baratzazz/");

  const [robotsResponse, sitemapResponse, socialImageResponse] = await Promise.all([
    request.get("/zema-landing/robots.txt"),
    request.get("/zema-landing/sitemap.xml"),
    request.get("/zema-landing/assets/media/zema-social.jpg")
  ]);
  expect(robotsResponse.status()).toBe(200);
  expect(await robotsResponse.text()).toContain("Sitemap: https://aindaco1.github.io/zema-landing/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain("<loc>https://aindaco1.github.io/zema-landing/</loc>");
  expect(socialImageResponse.status()).toBe(200);
  expect(socialImageResponse.headers()["content-type"]).toContain("image/jpeg");
});
