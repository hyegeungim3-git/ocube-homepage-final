import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("public");
const socialImage = process.argv[2] ?? "https://ocube-codex-review.issoyeon16.chatgpt.site/og-codex.png";
if (!/^(?:https:\/\/|\/)/.test(socialImage)) {
  throw new Error("Social preview image must be an HTTPS URL or a root-relative path.");
}
const htmlFiles = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
  .map((entry) => path.join(root, entry.name));

const metadataCache = new Map();

async function imageSize(src, htmlFile) {
  const clean = src.split(/[?#]/, 1)[0];
  if (!clean || /^(?:https?:|data:)/i.test(clean)) return null;
  const absolute = clean.startsWith("/")
    ? path.join(root, clean.slice(1))
    : path.resolve(path.dirname(htmlFile), clean);
  if (!fs.existsSync(absolute)) return null;
  if (!metadataCache.has(absolute)) {
    metadataCache.set(
      absolute,
      sharp(absolute)
        .metadata()
        .then(({ width, height }) => (width && height ? { width, height } : null))
        .catch(() => null),
    );
  }
  return metadataCache.get(absolute);
}

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, "utf8");

  html = html
    .replace(/(?:<wbr\s*\/?>\s*){2,}/gi, "<wbr>")
    .replace(/>About Ocube<\/a>/g, ">회사소개</a>")
    .replace(/>Location<\/a>/g, ">오시는 길</a>")
    .replace(/>Build Cases<\/a>/g, ">구축 사례</a>")
    .replace(/<div class="nav-item"><a href="company\.html">회사/g, '<div class="nav-item"><a href="about.html">회사')
    .replace(/<button class="m-toggle"/g, '<button type="button" class="m-toggle"')
    .replace(/<a href="business-si\.html">SI<small>시스템 통합·(?:<wbr>)?구축·(?:<wbr>)?운영<\/small><\/a>/g, '<a href="business-si.html">Enterprise<small>B2B·<wbr>B2G 시스템·<wbr>구축·<wbr>운영</small></a>')
    .replace(/<a href="business-si\.html">SI<\/a>/g, '<a href="business-si.html">Enterprise</a>')
    .replace(/Copyright © OCUBE Co\. LTD ALL RIGHTS RESERVED/g, "Copyright © OCUBE Co., Ltd. All rights reserved.")
    .replace(/서울 강서구 강서로56가길 141 KM빌딩 3층/g, "서울 강서구 강서로56가길 141 KM빌딩 2·3층")
    .replace(/안양 동안구 LS로 142 금정역SKV1센터 722호/g, "안양 동안구 LS로 142 금정역SKV1센터 722·723·710호")
    .replace(/(<a href="business-si\.html">)Enterprise/g, "$1SI")
    .replace(/(<a href="references\.html">)Build Cases/g, "$1Use Cases")
    .replace(/site2\.css\?v=[^"']+/g, "site2.css?v=codex-18")
    .replace(/site2\.js\?v=[^"']+/g, "site2.js?v=codex-8")
    .replace(
      /(<meta\s+property="og:image"\s+content=")[^"]*(">)/g,
      `$1${socialImage}$2`,
    )
    .replace(
      /(<meta\s+name="twitter:image"\s+content=")[^"]*(">)/g,
      `$1${socialImage}$2`,
    )
    .replace(/Agentq 화면/g, "QAgent 화면")
    .replace(/Dataq 화면/g, "QData 화면")
    .replace(/Factoryq 화면/g, "QFactory 화면")
    .replace(/Visionq 화면/g, "QVision 화면")
    .replace(/Evcp 화면/g, "EVCP 화면")
    .replaceAll("SOLUTION / VISIONQ", "SOLUTION / QVISION");

  const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  for (const tag of tags) {
    if (/\bwidth=["']?\d+/i.test(tag) && /\bheight=["']?\d+/i.test(tag)) continue;
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const size = await imageSize(src, file);
    if (!size) continue;
    const normalized = tag.replace(
      /\s*\/?>$/,
      ` width="${size.width}" height="${size.height}">`,
    );
    html = html.replace(tag, normalized);
  }

  fs.writeFileSync(file, html, "utf8");
}

console.log(`Normalized ${htmlFiles.length} HTML files and ${metadataCache.size} image assets.`);
