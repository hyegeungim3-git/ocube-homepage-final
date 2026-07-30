import fs from "node:fs";
import path from "node:path";

const root = path.resolve("public");
const htmlFiles = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => entry.name)
  .sort();

const issues = [];
const stats = {
  pages: htmlFiles.length,
  links: 0,
  images: 0,
  localAssets: 0,
};

const stripQuery = (value) => value.split(/[?#]/, 1)[0];
const add = (file, type, detail) => issues.push({ file, type, detail });

for (const file of htmlFiles) {
  const absolute = path.join(root, file);
  const html = fs.readFileSync(absolute, "utf8");

  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1) add(file, "heading", `h1 count is ${h1Count}`);

  if (!/<html\b[^>]*\blang=["']ko["']/i.test(html)) {
    add(file, "document", "html lang must be ko");
  }
  if (!/<title>[^<]{8,}<\/title>/i.test(html)) {
    add(file, "seo", "missing or too-short title");
  }
  if (!/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["'][^"']{30,}/i.test(html)) {
    add(file, "seo", "missing or too-short description");
  }
  if (!/<link\b[^>]*\brel=["']canonical["']/i.test(html)) {
    add(file, "seo", "missing canonical link");
  }

  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) add(file, "structure", `duplicate ids: ${duplicates.join(", ")}`);

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  stats.images += images.length;
  for (const image of images) {
    if (!/\balt=["'][^"']*["']/i.test(image)) {
      add(file, "accessibility", `image missing alt: ${image.slice(0, 100)}`);
    }
    if (!/\bwidth=["']?\d+/i.test(image) || !/\bheight=["']?\d+/i.test(image)) {
      add(file, "performance", `image missing intrinsic size: ${image.slice(0, 100)}`);
    }
  }

  const localReferences = [
    ...html.matchAll(/\b(?:href|src|poster)=["']([^"']+)["']/gi),
    ...html.matchAll(/<source\b[^>]*\bsrcset=["']([^"']+)["']/gi),
  ].map((match) => match[1]);

  for (const reference of localReferences) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(reference)) continue;
    const clean = decodeURIComponent(stripQuery(reference));
    if (!clean) continue;
    stats.localAssets += 1;
    const target = clean.startsWith("/")
      ? path.join(root, clean.slice(1))
      : path.resolve(path.dirname(absolute), clean);
    if (!fs.existsSync(target)) add(file, "link", `missing local target: ${reference}`);
  }

  const links = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)];
  stats.links += links.length;
  for (const link of links) {
    const [tag, href] = [link[0], link[1]];
    if (/\btarget=["']_blank["']/i.test(tag) && !/\brel=["'][^"']*noopener/i.test(tag)) {
      add(file, "security", `target=_blank missing noopener: ${href}`);
    }
  }

  if (/<wbr\s*\/?>\s*<wbr\s*\/?>/i.test(html)) add(file, "content", "consecutive wbr elements");
  if (/탐지에서 행동까지[^<]{0,20}닫|행동까지 닫습니다/i.test(html)) {
    add(file, "content", "opaque closed-loop copy");
  }
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] ?? "";
  if (
    !/<p class="f-h">Business<\/p>/.test(footer) ||
    !/<p class="f-h">Solution<\/p>/.test(footer) ||
    !/<p class="f-h">Company<\/p>/.test(footer) ||
    !/>About Ocube<\/a>/.test(footer) ||
    !/>Locations<\/a>/.test(footer) ||
    !/>Use Cases<\/a>/.test(footer) ||
    !/>Contact<\/a>/.test(footer)
  ) {
    add(file, "content", "footer category labels should be English");
  }
  if (/Copyright © OCUBE Co\. LTD ALL RIGHTS RESERVED/.test(html)) {
    add(file, "content", "footer copyright style is not normalized");
  }
  if (/KM빌딩 3층|금정역SKV1센터 722호/.test(html)) {
    add(file, "content", "footer office address is incomplete");
  }
  if (/Cintelion|Cinterionion|CubeOn|AgentQ|DataQ|FactoryQ|VisionQ|V-모델|스마트 뱃지/.test(html)) {
    add(file, "content", "legacy or inconsistent product terminology");
  }
}

console.log(JSON.stringify({ stats, issues }, null, 2));
if (issues.some((issue) => !["performance"].includes(issue.type))) {
  process.exitCode = 1;
}
