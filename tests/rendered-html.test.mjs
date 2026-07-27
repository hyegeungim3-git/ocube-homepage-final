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
    assert.match(html, /site2\.css\?v=codex-22/, `${page}: reviewed CSS`);
    assert.match(html, /site2\.js\?v=codex-8/, `${page}: reviewed JS`);
    assert.doesNotMatch(html, /기술\s*지원|TECH SUPPORT|License Support/i, `${page}: no retired support label`);
    assert.doesNotMatch(html, /<wbr\s*\/?>\s*<wbr\s*\/?>/i, `${page}: no duplicate wbr`);
    assert.doesNotMatch(html, /탐지에서 행동까지[^<]{0,20}닫|행동까지 닫습니다/i, `${page}: no opaque closed-loop copy`);
    assert.doesNotMatch(html, />(?:About Ocube|Location|Build Cases)<\/a>/i, `${page}: Korean footer labels`);
    assert.equal((html.match(/href="business-si\.html">SI/g) ?? []).length, 2, `${page}: SI navigation labels`);
    assert.match(html, /href="references\.html">Use Cases<small>/, `${page}: Use Cases mega-menu label`);
    assert.doesNotMatch(html, /href="business-si\.html">Enterprise|href="references\.html">Build Cases/, `${page}: no superseded navigation labels`);
    assert.match(html, /href="business-license\.html">글로벌 파트너/, `${page}: Korean global partner menu`);
    assert.match(html, />Global Tech</, `${page}: concise global tech group label`);
    assert.doesNotMatch(html, />Global Technology Partners</, `${page}: no long global tech group label`);
    assert.doesNotMatch(html, /Copyright © OCUBE Co\. LTD ALL RIGHTS RESERVED/, `${page}: normalized legal footer`);
    assert.doesNotMatch(html, /KM빌딩 3층|금정역SKV1센터 722호/, `${page}: full office address in footer`);
    assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
    assert.doesNotMatch(html, /font-size:14px/, `${page}: no undersized inline copy`);
    assert.equal((html.match(/<main\b/gi) ?? []).length, 1, `${page}: one main landmark`);
    assert.equal((html.match(/<footer\b/gi) ?? []).length, 1, `${page}: one footer landmark`);
    assert.doesNotMatch(html, /Web(?:·|\s·\s)App(?:·|\s·\s)Cloud[^<]{0,40}환경으로/i, `${page}: no rejected generic delivery copy`);
    assert.doesNotMatch(html, /홈페이지 시안의 초안|시안 초안|배포 시 확정|보호책임자 지정은/i, `${page}: no public draft copy`);
    assert.doesNotMatch(html, /www\.ocube\.co\.kr/i, `${page}: no mixed production domain`);
    assert.match(html, /<link rel="canonical" href="https:\/\/ocube-codex-review\.issoyeon16\.chatgpt\.site\//, `${page}: Codex canonical URL`);
    assert.match(html, /<meta property="og:image" content="https:\/\/ocube-codex-review\.issoyeon16\.chatgpt\.site\/og-codex\.png">/, `${page}: absolute OG image`);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/ocube-codex-review\.issoyeon16\.chatgpt\.site\/og-codex\.png">/, `${page}: absolute social image`);
    assert.match(html, /<button type="button" class="m-toggle"/, `${page}: explicit mobile menu button type`);
    assert.match(html, /<div class="nav-item"><a href="about\.html">회사/, `${page}: company overview parent route`);
    const crumb = html.match(/<nav class="hero-crumb"[\s\S]*?<\/nav>/i)?.[0];
    if (crumb) assert.equal((crumb.match(/aria-current="page"/g) ?? []).length, 1, `${page}: one current breadcrumb`);
  }
});

test("keeps legacy links truthful and correctly routed", async () => {
  const routes = [
    ["about-1/index.html", "../about.html"],
    ["btnanotech/index.html", "../business-license.html"],
    ["tenable/index.html", "../business-license.html"],
    ["qt/index.html", "../license-qt.html"],
    ["telit-cintelion/index.html", "../license-telit.html"],
    ["toradex/index.html", "../license-toradex.html"],
    ["visualon/index.html", "../license-visualon.html"],
    ["복제-pot-hole-검출-및-관제시스템/index.html", "../solution-traffic.html"],
  ];
  for (const [route, target] of routes) {
    const html = await readFile(new URL(route, publicRoot), "utf8");
    assert.ok(html.includes(target), `${route}: correct target`);
    assert.doesNotMatch(html, /#license/);
  }
});

test("explains specialist terminology in plain Korean", async () => {
  const pages = await pageNames();
  const combined = (
    await Promise.all(pages.map((page) => readFile(new URL(page, publicRoot), "utf8")))
  ).join("\n");
  const visible = combined
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  assert.doesNotMatch(visible, /재학습\s*\(CT\)|CI\/CD\/CT/);
  assert.doesNotMatch(visible, /현장 검증 PoC\s*·\s*HITL|HITL 승인|HITL 검수/);
  assert.doesNotMatch(visible, /B2B\s*·\s*B2G 시스템\s*·\s*구축/);
  assert.doesNotMatch(combined, /Toradex<small>산업용 SoM/);
  assert.match(visible, /지속적 재학습/);
  assert.match(visible, /PoC[^.]{0,60}도입 전 효과를 확인하는 사전 검증/);
  assert.match(visible, /HITL[^.]{0,60}사람이 검토·승인하는 절차/);
  assert.match(visible, /설비제어\(PLC\).*설비감시\(SCADA\).*생산관리\(MES\).*전사자원관리\(ERP\)/);
  assert.match(visible, /대규모 언어모델\(LLM\).*소형 언어모델\(sLLM\)|소형 언어모델\(sLLM\).*대규모 언어모델\(LLM\)/);
  assert.match(visible, /국제 충전 통신 표준\(OCPP\)/);
  assert.match(visible, /보드 지원 패키지\(BSP\)/);
  assert.match(visible, /멀티미디어 재생 개발도구\(SDK\)/);
  assert.match(visible, /MLOps[^.]{0,80}모델 학습·배포·성능/);
  assert.match(visible, /ModelOps[^.]{0,100}배포(?:된)? (?:AI )?모델의? 버전·성능/);
  assert.match(visible, /PoC[^.]{0,60}도입 전 효과를 확인하는 사전 검증/);
  assert.match(visible, /HITL[^.]{0,60}사람이 검토·승인하는 절차/);
});

test("reflects the reviewed SI message and four-field home flow", async () => {
  const [home, business, enterprise, location] = await Promise.all([
    readFile(new URL("index.html", publicRoot), "utf8"),
    readFile(new URL("business.html", publicRoot), "utf8"),
    readFile(new URL("business-si.html", publicRoot), "utf8"),
    readFile(new URL("location.html", publicRoot), "utf8"),
  ]);

  assert.equal((home.match(/class="hslide(?: on)?"/g) ?? []).length, 4);
  assert.match(home, /SI, Engineered for Reliability/);
  assert.match(home, /복잡한 B2B·B2G 업무/);
  assert.match(home, /class="home-partners"/);
  assert.match(home, /로봇 조립 라인 이상 조기감지/);
  assert.match(home, /SK에너지 전기차 충전 플랫폼/);
  assert.doesNotMatch(home, /Technology Integration/);
  assert.match(home, /aria-label="GLOBAL TECH 슬라이드"/);
  assert.match(business, /SI · <em>System Integration<\/em>/);
  assert.match(enterprise, /BUSINESS · SI/);
  assert.match(enterprise, /B2B · B2G · 업무 시스템 · 데이터 연계/);
  assert.match(home, /GLOBAL TECH, Integrated for Production/);
  assert.match(home, /href="business-license\.html" class="btn btn-primary">글로벌 기술 역량 보기/);
  assert.equal((home.match(/class="hbar hpag-item/g) ?? []).length, 4);
  assert.match(home, /<b>GLOBAL TECH<\/b>/);
  assert.doesNotMatch(home, /Enterprise/i);
  const daegu = location.indexOf("오큐브 대구사옥");
  const seoul = location.indexOf("오큐브 서울");
  const anyang = location.indexOf("오큐브 안양사옥");
  assert.ok(daegu >= 0 && daegu < seoul && seoul < anyang);
});

test("keeps comparison tables and interactive media accessible", async () => {
  const pages = await pageNames();
  let tables = 0;
  for (const page of pages) {
    const html = await readFile(new URL(page, publicRoot), "utf8");
    for (const match of html.matchAll(/<table\b[^>]*class="[^"]*\bcmp\b[^"]*"[^>]*>([\s\S]*?)<\/table>/gi)) {
      tables += 1;
      assert.match(match[1], /<caption\b[^>]*class="sr-only"/i, `${page}: table caption`);
      assert.match(match[1], /<th\b[^>]*scope="col"/i, `${page}: column headers`);
      assert.match(match[1], /<th\b[^>]*scope="row"/i, `${page}: row headers`);
    }
  }
  assert.equal(tables, 10);
  const script = await readFile(new URL("assets/site2.js", publicRoot), "utf8");
  assert.match(script, /s\.toggleAttribute\('inert', !active\)/);
  assert.match(script, /s\.setAttribute\('aria-hidden'/);
  assert.match(script, /b\.setAttribute\('aria-selected'/);
  assert.match(script, /function productLightbox\(\)/);
  assert.match(script, /function currentNavigation\(\)/);
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

test("keeps the desktop mega menu at one stable height", async () => {
  const [style, script] = await Promise.all([
    readFile(new URL("assets/site2.css", publicRoot), "utf8"),
    readFile(new URL("assets/site2.js", publicRoot), "utf8"),
  ]);
  const megaStart = script.indexOf("function open()");
  const megaEnd = script.indexOf("function closeNow()", megaStart);
  const openBlock = script.slice(megaStart, megaEnd);
  const classFirst = openBlock.indexOf("gnb.classList.add('gnb-mega')");
  const measureAfter = openBlock.indexOf("measureMegaHeight()");

  assert.ok(megaStart >= 0 && megaEnd > megaStart && classFirst >= 0 && classFirst < measureAfter);
  assert.match(style, /\.gnb\{[^}]*height:72px/);
  assert.match(style, /\.gnb\.gnb-mega\{[^}]*height:calc\(72px \+ var\(--mega-h,0px\)\)/);
  assert.match(style, /html:not\(\.js\) \.nav-item:hover \.dropdown/);
  const noJsFallbackRemoved = style.replace(/html:not\(\.js\) \.nav-item:hover \.dropdown/g, "");
  assert.doesNotMatch(noJsFallbackRemoved, /\.nav-item:hover\s+\.dropdown/);
  assert.match(script, /gnb\.addEventListener\('mouseleave', close\)/);
  assert.doesNotMatch(script, /menu\.addEventListener\('mouseleave', close\)/);
  assert.match(script, /megaHeight = Math\.ceil\(h\) \+ 24/);
  assert.match(script, /if \(!megaHeight\) measureMegaHeight\(\)/);
  assert.match(script, /hoverDesktop\.addEventListener\('change'/);
  assert.match(script, /desktop\.addEventListener\('change', function \(e\) \{ if \(e\.matches\) close\(false\); \}\)/);
  assert.ok(script.indexOf("if (trigger) trigger.focus();", script.indexOf("e.key !== 'Escape'")) < script.indexOf("closeNow();", script.indexOf("e.key !== 'Escape'")));
  assert.match(style, /\.gnb\.gnb-mega \.nav-item:hover>a[^}]*color:var\(--accent-text\)/);
  assert.match(style, /\.nav-menu\{[^}]*justify-content:center[^}]*width:min\(440px,calc\(100vw - 420px\)\)[^}]*transition:width \.34s/);
  assert.match(style, /\.gnb\.gnb-mega \.nav-menu\{[^}]*justify-content:space-between[^}]*gap:2px[^}]*width:min\(720px,calc\(100vw - 420px\)\)/);
  assert.match(style, /\.nav-item\.is-current>a/);
  assert.match(style, /\.gnb\.gnb-mega \.nav-item>a::after/);
  assert.match(style, /html:not\(\.js\) \.m-panel\{display:grid/);
});

test("keeps content cards readable at production sizes", async () => {
  const style = await readFile(new URL("assets/site2.css", publicRoot), "utf8");
  assert.match(style, /\.stat b>span\{[^}]*font:inherit/);
  assert.match(style, /\.stat b \.u\{[^}]*font-size:16px[^}]*font-style:normal/);
  assert.match(style, /\.stat>span\{[^}]*font-size:15\.5px/);
  assert.match(style, /\.sec-note,[^{]+\{font-size:15\.5px/);
  assert.match(style, /\.shot-cap,[^{]+\{font-size:14\.5px/);
  assert.match(style, /\.h-title\{font-size:clamp\(28px,3\.35vw,50px\)/);
  assert.match(style, /@media\(max-height:660px\)\{[\s\S]*?\.h-title\{font-size:clamp\(26px,3vw,42px\)\}/);
});

test("builds accessible mobile submenu accordions", async () => {
  const [style, script] = await Promise.all([
    readFile(new URL("assets/site2.css", publicRoot), "utf8"),
    readFile(new URL("assets/site2.js", publicRoot), "utf8"),
  ]);

  assert.match(script, /accordion\.className = 'm-accordion'/);
  assert.match(script, /icon\.textContent = ''/);
  assert.match(script, /trigger\.setAttribute\('aria-controls', panelId\)/);
  assert.match(script, /panel\.setAttribute\('role', 'region'\)/);
  assert.match(script, /collapseAll\(trigger\)/);
  assert.match(script, /panel\.hidden = !opening/);
  assert.match(script, /setBackgroundInert\(true\)/);
  assert.match(script, /a\.addEventListener\('click', function \(\) \{ close\(false\); \}\)/);
  assert.match(script, /if \(p\.classList\.contains\('open'\)\) \{\s*close\(false\)/);
  assert.match(script, /if \(returnFocus\) t\.focus\(\)/);
  assert.match(script, /e\.key !== 'Tab'/);
  assert.doesNotMatch(script, /p\.setAttribute\('aria-hidden'/);
  assert.match(style, /\.m-toggle\{display:block;min-width:48px;min-height:48px\}/);
  assert.match(style, /\.m-acc-trigger\{[^}]*min-height:64px/);
  assert.match(style, /\.m-acc-icon::before\{[^}]*border-right:1\.75px solid currentColor/);
  assert.doesNotMatch(style, /\.m-acc-icon\{[^}]*border-radius:999px/);
  assert.match(style, /\.m-acc-panel\[hidden\]\{display:none\}/);
  assert.match(style, /\.m-acc-panel a:focus-visible\{[^}]*outline:2px solid var\(--accent\)/);
  assert.match(style, /height:calc\(100dvh - 72px\)/);
  assert.match(style, /@media\(hover:hover\)/);
  assert.match(style, /\.m-panel \.m-direct\{/);
});

test("presents QFactory as a source-verified, full-cycle AI smart factory", async () => {
  const [html, style, solutions] = await Promise.all([
    readFile(new URL("solution-factoryq.html", publicRoot), "utf8"),
    readFile(new URL("assets/site2.css", publicRoot), "utf8"),
    readFile(new URL("solutions.html", publicRoot), "utf8"),
  ]);
  const applications = html.slice(html.indexOf('<section id="applications"'), html.indexOf('<section id="features"'));
  assert.match(html, /공장 전주기<\/em>를 데이터로 연결합니다/);
  assert.match(html, /공장 전주기를 여섯 가지 AI로 연결합니다/);
  assert.equal((applications.match(/class="factory-app /g) ?? []).length, 6);
  assert.match(applications, /AI–현장 운영기술\(AI-OT\) 통합·표준화/);
  assert.match(applications, /열에너지 생산·사용 최적화/);
  assert.match(applications, /설비 건전성·잔존수명 예측/);
  assert.match(applications, /품질 예측·공급망 추적/);
  assert.match(applications, /Vision AI 안전 관제/);
  assert.match(applications, /MLOps·자율운영 지원/);
  assert.match(html, /2026~2029 연구개발·<wbr>현장 실증 추진/);
  assert.ok(!html.includes("<b>성과</b> 다운타임·<wbr>에너지 과투입에 사전 대응"));
  assert.match(solutions, /제지 AI Factory 연구개발을 바탕으로 확장합니다/);
  assert.doesNotMatch(solutions, /제지 현장에서 실증했습니다/);
  assert.ok(style.includes(".factory-app-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))"));
  assert.ok(style.includes("#overview.sec-anchor,\n#applications.sec-anchor{padding-top:clamp(84px,8vw,116px)}"));
  assert.ok(style.includes("#applications.sec-anchor{padding-top:72px}"));
  assert.ok(style.includes(".factory-app-grid{grid-template-columns:1fr;gap:14px;margin-top:26px}"));
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
