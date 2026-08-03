const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const ignoredDirectories = new Set([
  ".git",
  ".jekyll-cache",
  ".jekyll-test-site",
  "_site",
  "node_modules",
  "playwright-report",
  "test-results",
  "vendor"
]);
const requiredDocs = [
  "README.md",
  "agents.md",
  "docs/README.md",
  "docs/PROJECT_OVERVIEW.md",
  "docs/ARCHITECTURE.md",
  "docs/EXPERIENCE_DESIGN.md",
  "docs/BRAND_GUIDE.md",
  "docs/MEDIA_PIPELINE.md",
  "docs/ACCESSIBILITY_SEO.md",
  "docs/QUALITY_ASSURANCE.md",
  "docs/OPERATIONS.md",
  "docs/DECISIONS.md",
  "docs/AGENT_PLAYBOOK.md"
];
const failures = [];

function collectMarkdown(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(function (entry) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectMarkdown(absolutePath);
    return entry.isFile() && entry.name.endsWith(".md") ? [absolutePath] : [];
  });
}

function toProjectPath(absolutePath) {
  return path.relative(projectRoot, absolutePath).split(path.sep).join("/");
}

function headingSlug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function markdownHeadings(source) {
  const seen = new Map();
  return source.split("\n").flatMap(function (line) {
    if (!/^#{1,6}\s+/.test(line)) return [];
    const base = headingSlug(line.replace(/^#{1,6}\s+/, ""));
    const occurrence = seen.get(base) || 0;
    seen.set(base, occurrence + 1);
    return [occurrence ? base + "-" + occurrence : base];
  });
}

function duplicateHeadingSlugs(source) {
  const seen = new Set();
  const duplicates = new Set();
  source.split("\n").forEach(function (line) {
    if (!/^#{1,6}\s+/.test(line)) return;
    const slug = headingSlug(line.replace(/^#{1,6}\s+/, ""));
    if (seen.has(slug)) duplicates.add(slug);
    seen.add(slug);
  });
  return Array.from(duplicates);
}

function resolveMarkdownLink(sourceFile, rawTarget) {
  const target = rawTarget.replace(/^<|>$/g, "");
  if (/^(?:https?:|mailto:|tel:)/.test(target) || target.startsWith("#")) return;

  const hashIndex = target.indexOf("#");
  const relativeTarget = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const anchor = hashIndex === -1 ? "" : target.slice(hashIndex + 1);
  const absoluteTarget = path.resolve(path.dirname(sourceFile), decodeURIComponent(relativeTarget));

  if (!fs.existsSync(absoluteTarget)) {
    failures.push(toProjectPath(sourceFile) + ": missing link target " + target);
    return;
  }

  if (!anchor || !absoluteTarget.endsWith(".md") || !fs.statSync(absoluteTarget).isFile()) return;
  const headings = markdownHeadings(fs.readFileSync(absoluteTarget, "utf8"));
  if (!headings.includes(anchor)) {
    failures.push(toProjectPath(sourceFile) + ": missing heading anchor " + target);
  }
}

requiredDocs.forEach(function (file) {
  if (!fs.existsSync(path.join(projectRoot, file))) failures.push("Missing required document: " + file);
});

const markdownFiles = collectMarkdown(projectRoot);
markdownFiles.forEach(function (file) {
  const source = fs.readFileSync(file, "utf8");
  const projectPath = toProjectPath(file);

  source.split("\n").forEach(function (line, index) {
    if (/[ \t]+$/.test(line)) failures.push(projectPath + ":" + (index + 1) + " has trailing whitespace");
  });

  const duplicates = duplicateHeadingSlugs(source);
  if (duplicates.length) {
    failures.push(projectPath + ": duplicate heading slugs: " + duplicates.join(", "));
  }

  Array.from(source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)).forEach(function (match) {
    resolveMarkdownLink(file, match[1]);
  });
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Documentation check passed: " + markdownFiles.length + " Markdown files and all relative links.");
