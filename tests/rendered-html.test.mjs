import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const publicRoot = new URL("../public/", import.meta.url);

async function pageNames() {
  return (await readdir(publicRoot))
    .filter((name) => name.endsWith(".html"))
    .sort();
}

test("ships the complete reviewed static site", async () => {
  const pages = await pageNames();
  assert.equal(pages.length, 26);

  for (const page of pages) {
    const html = await readFile(new URL(page, publicRoot), "utf8");
    assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${page}: one h1`);
    assert.match(html, /<html\b[^>]*lang="ko"/i, `${page}: Korean document`);
    assert.match(html, /site2\.css\?v=codex-3/, `${page}: reviewed CSS`);
    assert.match(html, /site2\.js\?v=codex-1/, `${page}: reviewed JS`);
    assert.doesNotMatch(html, /<wbr>\s*<wbr>/i, `${page}: no duplicate wbr`);
    assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  }
});

test("keeps the QAgent architecture ordered and unambiguous", async () => {
  const html = await readFile(new URL("solution-agentq.html", publicRoot), "utf8");
  const architecture = html.slice(
    html.indexOf('<section id="arch"'),
    html.indexOf('<section id="pipeline"'),
  );
  const understanding = architecture.indexOf("Understanding");
  const reasoning = architecture.indexOf("Reasoning");
  const execution = architecture.indexOf("Execution");

  assert.ok(understanding >= 0 && understanding < reasoning);
  assert.ok(reasoning < execution);
  assert.equal((architecture.match(/class="stack-arrow"/g) ?? []).length, 2);
  assert.equal((architecture.match(/>↓</g) ?? []).length, 2);
  assert.match(architecture, /03 · 실행 · 행동/);
});

test("uses a truthful, non-storing inquiry handoff", async () => {
  const [html, script] = await Promise.all([
    readFile(new URL("contact.html", publicRoot), "utf8"),
    readFile(new URL("assets/site2.js", publicRoot), "utf8"),
  ]);

  assert.match(html, /data-contact-form/);
  assert.match(html, /이 웹사이트에 저장되지 않습니다/);
  assert.doesNotMatch(html, /onsubmit=|문의 감사합니다/);
  assert.match(script, /mailto:sales@ocube\.co\.kr/);
  assert.match(script, /encodeURIComponent\(body\)/);
});

test("includes the dedicated social preview and deployable build", async () => {
  await Promise.all([
    access(new URL("og-codex.png", publicRoot)),
    access(new URL("dist/server/index.js", root)),
    access(new URL("dist/client/index.html", root)),
    access(new URL("dist/client/assets/site2.css", root)),
    access(new URL("dist/client/assets/site2.js", root)),
  ]);
});
