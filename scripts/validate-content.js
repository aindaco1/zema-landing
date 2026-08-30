const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const root = path.resolve(__dirname, "..");
const framesPath = path.join(root, "_data/frames.yml");
const pagesPath = path.join(root, ".pages.yml");
const slotsPath = path.join(root, "_admin/media-slots.json");

const frames = YAML.parse(fs.readFileSync(framesPath, "utf8"));
const pages = YAML.parse(fs.readFileSync(pagesPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(slotsPath, "utf8"));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function getAtPath(value, dottedPath) {
  return dottedPath.split(".").reduce((current, segment) => {
    if (current === undefined || current === null) return undefined;
    const key = /^\d+$/.test(segment) ? Number(segment) : segment;
    return current[key];
  }, value);
}

function checkText(value, label) {
  check(typeof value === "string" && value.trim().length > 0, `${label} must be non-empty text`);
}

function checkHttps(value, label) {
  try {
    const url = new URL(value);
    check(url.protocol === "https:", `${label} must use HTTPS`);
  } catch {
    failures.push(`${label} must be a valid URL`);
  }
}

function checkFocal(value, label) {
  check(Number.isFinite(value) && value >= 0 && value <= 100, `${label} must be between 0 and 100`);
}

checkText(frames.site_title, "site_title");
checkText(frames.tagline, "tagline");
checkText(frames.seo?.title, "seo.title");
checkText(frames.seo?.description, "seo.description");
checkText(frames.seo?.social_image_alt, "seo.social_image_alt");
checkFocal(frames.seo?.social_focal_x, "seo.social_focal_x");
checkFocal(frames.seo?.social_focal_y, "seo.social_focal_y");
checkHttps(frames.instagram, "instagram");
checkHttps(frames.events_url, "events_url");
check(/^\+[1-9]\d{7,14}$/.test(frames.phone_href || ""), "phone_href must use international phone format");

check(Array.isArray(frames.hero?.beats) && frames.hero.beats.length === 4, "hero.beats must contain exactly four items");
for (const [index, beat] of (frames.hero?.beats || []).entries()) {
  checkText(beat.eyebrow, `hero.beats.${index}.eyebrow`);
  checkText(beat.title, `hero.beats.${index}.title`);
  checkText(beat.copy, `hero.beats.${index}.copy`);
}
check(frames.hero?.beats?.[0]?.title_mark === "ZEMA", "the first hero beat must retain the licensed ZEMA title mark");

check(Array.isArray(frames.gallery) && frames.gallery.length === 3, "gallery must contain exactly three movements");
for (const [index, item] of (frames.gallery || []).entries()) {
  checkText(item.alt, `gallery.${index}.alt`);
  checkText(item.caption, `gallery.${index}.caption`);
  checkFocal(item.focal_x, `gallery.${index}.focal_x`);
  checkFocal(item.focal_y, `gallery.${index}.focal_y`);
}

checkFocal(frames.hero?.focal_x, "hero.focal_x");
checkFocal(frames.hero?.focal_y, "hero.focal_y");
checkFocal(frames.intro?.focal_x, "intro.focal_x");
checkFocal(frames.intro?.focal_y, "intro.focal_y");
checkFocal(frames.inquiry?.focal_x, "inquiry.focal_x");
checkFocal(frames.inquiry?.focal_y, "inquiry.focal_y");
checkFocal(frames.film?.focal_x, "film.focal_x");
checkFocal(frames.film?.focal_y, "film.focal_y");

const allowedDays = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
check(Array.isArray(frames.dossier?.hours) && frames.dossier.hours.length > 0, "dossier.hours must not be empty");
for (const [index, row] of (frames.dossier?.hours || []).entries()) {
  checkText(row.days, `dossier.hours.${index}.days`);
  checkText(row.time, `dossier.hours.${index}.time`);
  check(Array.isArray(row.schema_days) && row.schema_days.length > 0, `dossier.hours.${index}.schema_days must not be empty`);
  for (const day of row.schema_days || []) check(allowedDays.has(day), `dossier.hours.${index} contains an invalid schema day`);
  check(/^([01]\d|2[0-3]):[0-5]\d$/.test(row.opens || ""), `dossier.hours.${index}.opens must use HH:MM`);
  check(/^([01]\d|2[0-3]):[0-5]\d$/.test(row.closes || ""), `dossier.hours.${index}.closes must use HH:MM`);
}

check(Array.isArray(frames.dossier?.notes), "dossier.notes must be a list");
for (const [index, note] of (frames.dossier?.notes || []).entries()) checkText(note, `dossier.notes.${index}`);
check(Array.isArray(frames.dossier?.faqs), "dossier.faqs must be a list");
for (const [index, faq] of (frames.dossier?.faqs || []).entries()) {
  checkText(faq.q, `dossier.faqs.${index}.q`);
  checkText(faq.a, `dossier.faqs.${index}.a`);
}

check(/^[-_A-Za-z0-9]{11}$/.test(frames.film?.youtube_id || ""), "film.youtube_id must be an 11-character YouTube ID");
for (const [index, studio] of (frames.film?.production || []).entries()) {
  checkText(studio.name, `film.production.${index}.name`);
  checkHttps(studio.url, `film.production.${index}.url`);
}
check(frames.inquiry?.form_action === "https://formspree.io/f/xdaqrwyo", "the service-owned Formspree endpoint must remain unchanged");

check(manifest.version === 1, "media slot manifest version must be 1");
check(manifest.upload?.retentionDays === 30, "raw media retention must remain 30 days");
check(Array.isArray(manifest.slots) && manifest.slots.length > 0, "media slot manifest must define slots");
const slotIds = new Set();
const outputPaths = new Set();
for (const slot of manifest.slots || []) {
  check(!slotIds.has(slot.id), `duplicate media slot id: ${slot.id}`);
  slotIds.add(slot.id);
  check(["video", "audio", "image"].includes(slot.kind), `invalid kind for media slot ${slot.id}`);
  check(Number.isSafeInteger(slot.maxBytes) && slot.maxBytes > 0, `invalid maxBytes for media slot ${slot.id}`);
  check(Array.isArray(slot.acceptedExtensions) && slot.acceptedExtensions.length > 0, `media slot ${slot.id} needs acceptedExtensions`);
  for (const output of slot.outputs || []) {
    check(!outputPaths.has(output.path), `duplicate media output path: ${output.path}`);
    outputPaths.add(output.path);
    check(output.path.startsWith("assets/media/editorial/"), `${output.path} must remain in editable editorial media`);
    check(getAtPath(frames, output.contentPath) === output.path, `${output.contentPath} must point to ${output.path}`);
    check(fs.existsSync(path.join(root, output.path)), `missing published media file: ${output.path}`);
  }
  if (slot.focalPaths) {
    checkFocal(getAtPath(frames, slot.focalPaths.x), slot.focalPaths.x);
    checkFocal(getAtPath(frames, slot.focalPaths.y), slot.focalPaths.y);
  }
}

check(pages.settings?.content?.merge === true, "Pages CMS must merge unmanaged service fields");
const contentFile = (pages.content || []).find((item) => item.path === "_data/frames.yml");
check(Boolean(contentFile), "Pages CMS must edit _data/frames.yml directly");
check(contentFile?.operations?.delete === false, "Pages CMS must not allow deleting the content source");
for (const mediaSource of pages.media || []) {
  check(mediaSource.input === "assets/media/editorial", `Pages CMS media source ${mediaSource.name} must stay inside editorial media`);
}
const pagesSource = fs.readFileSync(pagesPath, "utf8");
for (const protectedName of ["form_action", "zema-logo", "zema-icon", "zema-vinyl-cursor"]) {
  check(!pagesSource.includes(protectedName), `Pages CMS must not expose protected field or asset: ${protectedName}`);
}

if (failures.length) {
  console.error("Content contract validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content contract validated (${manifest.slots.length} media slots).`);
