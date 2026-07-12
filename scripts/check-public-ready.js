const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const forbiddenPatterns = [
  /\/home\/dennis/i,
  /private\/tools\//i,
  /workpacks\/source-data-pass-2026-07-12\/review-output/i
];
const forbiddenExtensions = new Set([".xlsx", ".zip"]);
const ignoredDirs = new Set([".git", "node_modules"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function isProbablyText(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.includes(0)) return false;
  const ext = path.extname(filePath).toLowerCase();
  return ![".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf"].includes(ext);
}

const files = walk(root);

for (const filePath of files) {
  const relativePath = path.relative(root, filePath);
  assert(
    !forbiddenExtensions.has(path.extname(filePath).toLowerCase()),
    `public-ready check forbids committed raw artifact ${relativePath}`
  );

  if (!isProbablyText(filePath)) continue;
  const text = fs.readFileSync(filePath, "utf8");
  for (const forbidden of forbiddenPatterns) {
    assert(!forbidden.test(text), `public-ready check found ${forbidden} in ${relativePath}`);
  }
}

console.log("AI Labour Power Budget public-ready scan passed");
