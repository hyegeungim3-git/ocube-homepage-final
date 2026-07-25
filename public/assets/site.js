// ===== 오큐브 시안 공통 스크립트 =====
// 기능 카드 hover 미리보기 — [data-preview] 요소에 마우스 올리면 관련 화면이 커서 옆에 뜸(마우스 기기 전용)
(() => {
  if (matchMedia('(pointer: coarse)').matches) return;
  const cards = document.querySelectorAll('[data-preview]');
  if (!cards.length) return;
  const pv = document.createElement('figure');
  pv.className = 'hover-preview';
  pv.innerHTML = '<img alt=""><figcaption></figcaption>';
  document.body.appendChild(pv);
  const img = pv.querySelector('img'), cap = pv.querySelector('figcaption');
  const W = 360, H = 250, GAP = 22;
  const place = e => {
    let x = e.clientX + GAP, y = e.clientY + GAP;
    if (x + W > innerWidth - 12) x = e.clientX - W - GAP;
    if (y + H > innerHeight - 12) y = Math.max(12, innerHeight - H - 12);
    pv.style.left = x + 'px'; pv.style.top = y + 'px';
  };
  cards.forEach(c => {
    c.addEventListener('mouseenter', e => {
      img.src = c.dataset.preview; img.alt = c.dataset.previewAlt || '';
      cap.textContent = c.dataset.previewCap || '';
      place(e); pv.classList.add('show');
    });
    c.addEventListener('mousemove', place, { passive: true });
    c.addEventListener('mouseleave', () => pv.classList.remove('show'));
  });
})();

// 넓은 스펙표(.cmp)를 가로 스크롤 래퍼로 감싸 모바일 클리핑 방지 (리빌은 래퍼로 이관해 내부 스크롤바 방지)
document.querySelectorAll('table.cmp').forEach(t => {
  if (t.parentElement && t.parentElement.classList.contains('cmp-scroll')) return;
  const w = document.createElement('div');
  w.className = 'cmp-scroll';
  if (t.classList.contains('reveal')) { w.classList.add('reveal'); if (t.dataset.d) w.dataset.d = t.dataset.d; t.classList.remove('reveal'); }
  t.parentNode.insertBefore(w, t);
  w.appendChild(t);
});

// 스크롤 리빌 (핀드 항목 제외 — 아래 전용 옵저버가 처리)
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal:not(.pin-item)').forEach(el => io.observe(el));

// 핀드 우측 항목 전용 리빌 — 하단 rootMargin으로 항목이 뷰포트 위쪽 75%까지 올라와야 리빌
// → 진입 시 ~3개만 보이고, 스크롤하면 하나씩 아래에서 올라옴 + 왼쪽 진행 도트를 같은 시점에 하나씩 채움
const pinLightDots = item => {
  const sec = item.closest('.pinsec'); if (!sec) return;
  const items = [...sec.querySelectorAll('.pin-item')];
  const dots = [...sec.querySelectorAll('.pin-progress i')];
  const i = items.indexOf(item);
  dots.forEach((d, j) => { if (j <= i) d.classList.add('on'); });
};
const pinIO = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); pinLightDots(e.target); pinIO.unobserve(e.target); } });
}, { threshold: 0, rootMargin: '0px 0px -25% 0px' });
document.querySelectorAll('.pin-item.reveal').forEach(el => pinIO.observe(el));

// KPI 카운트업
const cio = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.count, dur = 1200, t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { el.textContent = target; }, dur + 400); // rAF 스로틀 대비 종료 보장
    cio.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('[data-count]').forEach(el => el.textContent = el.dataset.count);
}

// 섹션으로 직점프(레일 클릭 등) 시 해당 섹션 콘텐츠를 즉시 리빌.
// 점프는 스크롤 애니메이션을 못 타 GSAP ScrollTrigger 리빌이 "from(숨김)" 상태로 남을 수 있음 → 강제 완성.
function revealSection(sec) {
  if (!sec) return;
  const pinned = sec.classList.contains('pinsec');
  sec.querySelectorAll('.reveal').forEach(el => {
    // 핀드 섹션의 우측 항목은 강제 리빌에서 제외 → io가 스크롤에 맞춰 하나씩 올려줌
    // (섹션 진입 시 뷰포트 안의 ~3개만 io가 즉시 리빌, 나머지는 스크롤할 때 하나씩)
    if (pinned && el.closest('.pin-right')) return;
    el.classList.add('in');
  });
  // fx.js가 받아서 이미 지나친 ScrollTrigger 트윈을 progress(1)로 완성
  window.dispatchEvent(new CustomEvent('fp:reveal', { detail: { id: sec.id, pinned } }));
}

// 페이지 내 섹션 내비 — 좌측 사이드 레일 생성 + 스크롤스파이 (상단 서브내비는 모바일 폴백)
const subLinks = [...document.querySelectorAll('.subnav a[href^="#"]')];
if (subLinks.length) {
  // 사이드 레일 생성 (.subnav 구조 복제: 그룹 라벨 + 링크)
  const rail = document.createElement('nav');
  rail.className = 'siderail';
  rail.setAttribute('aria-label', '섹션 바로가기');
  const railLinks = [];
  [...document.querySelector('.subnav .wrap').children].forEach(node => {
    if (node.classList.contains('grp')) {
      const g = document.createElement('span');
      g.className = 'rgrp'; g.textContent = node.textContent;
      rail.appendChild(g);
    } else if (node.tagName === 'A') {
      const a = document.createElement('a');
      a.href = node.getAttribute('href');
      a.innerHTML = '<span class="dot"></span><span class="lb">' + node.textContent.trim() + '</span>';
      rail.appendChild(a); railLinks.push(a);
    }
  });
  document.body.appendChild(rail);

  // 섹션 점프: mandatory 스냅 + scroll-snap-stop:always 는 스무스 앵커 이동을 막음
  // → 클릭 시 스냅을 잠깐 끄고 스무스 스크롤 후 재활성
  // 섹션 점프: instant scrollIntoView — mandatory 스냅과 충돌 없이 확실히 이동(스냅 데크는 즉시 전환이 자연스러움)
  const snapJump = id => {
    if (window.__fp && window.__fp.active()) { window.__fp.goToId(id); return; }
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'instant', block: 'start' }); revealSection(el); }
  };
  [...railLinks, ...subLinks].forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) { e.preventDefault(); history.replaceState(null, '', href); snapJump(href.slice(1)); }
    });
  });

  const pairs = subLinks
    .map((a, i) => ({ a, rail: railLinks[i], sec: document.getElementById(a.getAttribute('href').slice(1)) }))
    .filter(p => p.sec);
  // GSAP 핀 섹션은 .pin-spacer로 감싸져 offsetTop=0을 반환 → 절대 위치를 라이브 계산
  const topOf = sec => {
    const target = sec.closest('.pin-spacer') || sec;
    return target.getBoundingClientRect().top + window.scrollY;
  };
  let last = 0;
  const updateSpy = () => {
    const line = scrollY + 160; // 헤더(64)+서브내비(≈48)+여유
    let cur = pairs[0];
    pairs.forEach(p => { if (topOf(p.sec) <= line) cur = p; });
    if (scrollY + innerHeight >= document.body.scrollHeight - 40) cur = pairs[pairs.length - 1];
    if (cur.a.classList.contains('active')) return;
    pairs.forEach(p => {
      p.a.classList.toggle('active', p === cur);
      if (p.rail) p.rail.classList.toggle('active', p === cur);
    });
    const strip = document.querySelector('.subnav');
    if (strip && getComputedStyle(strip).display !== 'none')
      strip.scrollTo({ left: cur.a.offsetLeft - strip.clientWidth / 2 + cur.a.offsetWidth / 2, behavior: 'smooth' });
  };
  addEventListener('scroll', () => {
    const now = performance.now();
    if (now - last > 80) { last = now; updateSpy(); }
  }, { passive: true });
  addEventListener('scrollend', updateSpy, { passive: true });
  updateSpy();
}

// GNB 현재 페이지 표시 (body[data-page] ↔ a[data-nav])
const page = document.body.dataset.page;
if (page) {
  const cur = document.querySelector(`.nav-menu a[data-nav="${page}"]`);
  if (cur) cur.classList.add('active');
}

// ===== 모바일 GNB 햄버거 토글 (≤960px에서 nav-menu가 숨겨지므로 필수) =====
(() => {
  const btn = document.querySelector('.m-toggle');
  if (!btn) return;
  btn.setAttribute('aria-expanded', 'false');
  const set = open => {
    document.body.classList.toggle('m-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    btn.textContent = open ? '닫기' : '메뉴';
  };
  btn.addEventListener('click', () => set(!document.body.classList.contains('m-open')));
  // 메뉴 항목 클릭(페이지 이동) 시 닫기
  document.querySelectorAll('.nav-menu a').forEach(a => a.addEventListener('click', () => set(false)));
  // Esc / 데스크톱 폭 복귀 시 닫기
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  matchMedia('(min-width:961px)').addEventListener('change', e => { if (e.matches) set(false); });
})();

// ===== UX 유틸: 토스트 + 원클릭 복사 =====
window.__toast = msg => {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div'); t.className = 'toast';
    t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
    document.body.appendChild(t);
  }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2000);
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const val = b.dataset.copy;
  const done = () => window.__toast('복사되었습니다 — ' + val);
  const legacy = () => {
    try {
      const ta = document.createElement('textarea'); ta.value = val;
      ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove(); done();
    } catch (_) { window.__toast('복사 실패 — 길게 눌러 복사해 주세요'); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(done, legacy);
  else legacy();
});

// ===== 맨 위로(Top) 버튼 — 풀페이지 컨트롤러 활성 시 goTo(0) 위임 =====
(() => {
  const btn = document.createElement('button');
  btn.className = 'to-top'; btn.type = 'button'; btn.setAttribute('aria-label', '맨 위로');
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btn);
  const reducedTT = matchMedia('(prefers-reduced-motion: reduce)').matches;
  btn.addEventListener('click', () => {
    if (window.__fp && window.__fp.active()) window.__fp.goTo(0);
    else window.scrollTo({ top: 0, behavior: reducedTT ? 'auto' : 'smooth' });
  });
  let tt = 0;
  const upd = () => btn.classList.toggle('show', scrollY > innerHeight * 0.7);
  addEventListener('scroll', () => { const n = Date.now(); if (n - tt > 120) { tt = n; upd(); } }, { passive: true });
  addEventListener('scrollend', upd, { passive: true });
})();

// ===== 모바일 하단 액션바 (전화 + 문의) — contact 페이지 제외 =====
(() => {
  if (document.body.dataset.page === 'contact') return;
  const bar = document.createElement('nav');
  bar.className = 'm-actionbar'; bar.setAttribute('aria-label', '빠른 연락');
  bar.innerHTML = '<a class="ab-tel" href="tel:0533135333">전화 문의</a><a class="ab-cta" href="contact.html">프로젝트 문의 →</a>';
  document.body.appendChild(bar);
})();

// ===== 제품 스크린샷 라이트박스 (클릭 확대) =====
(() => {
  const imgs = [...document.querySelectorAll('img.shot')];
  const shotBtns = [...document.querySelectorAll('[data-shot]')];
  if (!imgs.length && !shotBtns.length) return;
  let lb = null, lastFocus = null;
  const close = () => {
    document.body.classList.remove('lb-open'); lb.classList.remove('open');
    if (lastFocus) lastFocus.focus();
  };
  const build = () => {
    lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', '이미지 확대 보기');
    lb.innerHTML = '<button class="lb-close" type="button" aria-label="닫기">×</button><img class="lb-img" alt=""><p class="lb-cap"></p>';
    document.body.appendChild(lb);
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-close')) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('lb-open')) close(); });
  };
  const openSrc = (src, alt, cap) => {
    if (!lb) build();
    lastFocus = document.activeElement;
    const im = lb.querySelector('.lb-img');
    im.src = src; im.alt = alt || '';
    lb.querySelector('.lb-cap').textContent = cap || alt || '';
    document.body.classList.add('lb-open'); lb.classList.add('open');
    lb.querySelector('.lb-close').focus();
  };
  const open = img => {
    const fig = img.closest('figure'); const cap = fig && fig.querySelector('figcaption');
    openSrc(img.currentSrc || img.src, img.alt, cap ? cap.textContent : (img.alt || ''));
  };
  imgs.forEach(img => {
    img.classList.add('zoomable'); img.setAttribute('tabindex', '0'); img.setAttribute('role', 'button');
    img.setAttribute('aria-label', (img.alt || '제품 화면') + ' — 클릭하여 확대');
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); } });
  });
  // 기능 카드 등 이미지가 아닌 요소에서 프로토타입 화면 열기 (data-shot="경로")
  shotBtns.forEach(el => {
    const fire = () => openSrc(el.dataset.shot, el.dataset.shotAlt || '', el.dataset.shotCap || '');
    el.addEventListener('click', fire);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
  });
})();

// (핀드 진행 도트는 위 pinIO에서 항목 리빌과 동시에 채워지도록 통합됨)

// ===== 구축 사례 — 비즈니스 라인 필터 (data-line) =====
(() => {
  const bar = document.querySelector('.case-filter'); if (!bar) return;
  const tabs = [...bar.querySelectorAll('.case-tab')];
  const cards = [...document.querySelectorAll('.case-card[data-line]')];
  const groups = [...document.querySelectorAll('.case-domain')];
  const live = document.createElement('div'); live.className = 'sr-live'; live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);
  const apply = line => {
    let shown = 0;
    cards.forEach(c => {
      const ok = line === 'all' || (c.dataset.line || '').split(' ').includes(line);
      c.classList.toggle('is-hidden', !ok); if (ok) shown++;
    });
    // 남은 카드가 없는 도메인 섹션은 헤딩째 숨김
    groups.forEach(g => {
      const any = [...g.querySelectorAll('.case-card')].some(c => !c.classList.contains('is-hidden'));
      g.classList.toggle('is-hidden', !any);
    });
    const label = line === 'all' ? '전체' : (bar.querySelector(`[data-line="${line}"]`) || {}).textContent || line;
    live.textContent = `${label} 사례 ${shown}건 표시`;
  };
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { const on = x === t; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    apply(t.dataset.line);
  }));
})();

// ===== 스크린리더 섹션 전환 안내(aria-live) =====
const fpLive = document.createElement('div');
fpLive.className = 'sr-live'; fpLive.setAttribute('aria-live', 'polite');
document.body.appendChild(fpLive);
function announceSection(sec) {
  if (!sec || !sec.id) return;
  const a = document.querySelector('.subnav a[href="#' + sec.id + '"]');
  const h = sec.querySelector('h1,h2');
  fpLive.textContent = (a ? a.textContent.trim() : (h ? h.textContent.trim() : sec.id)) + ' 섹션';
}

// ===== 풀페이지 컨트롤러 — 휠/키/터치를 가로채 한 제스처=한 섹션 (fullpage.js 방식) =====
// CSS mandatory 스냅은 휠 한 노치가 임계값을 못 넘으면 섹션 사이에 어중간하게 멈춤 → JS가 직접 구동
(() => {
  if (!document.body.classList.contains('snap-full')) return;
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqDesktop = matchMedia('(min-width:1024px)');

  let sections = [];
  const collect = () => { sections = [...document.querySelectorAll('body.snap-full > section')]; };
  collect();
  if (sections.length < 2) return;

  let idx = 0, locked = false, active = false;
  const topOf = i => Math.round(sections[i].getBoundingClientRect().top + window.scrollY);
  const nearestIdx = () => {
    const y = window.scrollY; let best = 0, bd = Infinity;
    sections.forEach((s, i) => { const d = Math.abs(topOf(i) - y); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  // ── 하이브리드: 뷰포트보다 긴 섹션(핀드 스크롤리텔링 등)은 내부에서 자연 스크롤, 끝에서만 스냅 ──
  const isTall = i => sections[i] && sections[i].offsetHeight > innerHeight + 8;
  const containingIdx = () => {
    const y = window.scrollY;
    for (let i = 0; i < sections.length; i++) {
      const t = topOf(i);
      if (y >= t - 4 && y < t + sections[i].offsetHeight - 4) return i;
    }
    return nearestIdx();
  };

  const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const animateTo = (target, cb) => {
    // reduced-motion 또는 숨겨진 탭(rAF 정지)에서는 즉시 이동해 상태 고착 방지
    if (reduced || document.hidden) { window.scrollTo(0, target); cb && cb(); return; }
    const start = window.scrollY, dist = target - start, dur = 600, t0 = performance.now();
    if (Math.abs(dist) < 2) { cb && cb(); return; }
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      window.scrollTo(0, Math.round(start + dist * easeInOutCubic(p)));
      if (p < 1) requestAnimationFrame(step); else cb && cb();
    };
    requestAnimationFrame(step);
  };

  const goTo = (i, dirHint) => {
    i = Math.max(0, Math.min(sections.length - 1, i));
    idx = i; locked = true;
    // 긴 섹션에 위(아래 방향 스크롤)로 진입하면 상단, 아래(위 방향 스크롤)로 진입하면 하단 정렬
    let target = topOf(i);
    if (dirHint < 0 && isTall(i)) target = topOf(i) + sections[i].offsetHeight - innerHeight;
    animateTo(target, () => {
      setTimeout(() => { locked = false; }, 70);
      window.dispatchEvent(new Event('scroll')); // 스파이·프로그레스 갱신
      revealSection(sections[i]);                // 직점프 즉시 리빌
      announceSection(sections[i]);              // 스크린리더 섹션 안내
    });
  };

  window.__fp = {
    active: () => active,
    goTo,
    goToId: id => { const i = sections.findIndex(s => s.id === id); if (i >= 0) goTo(i); },
  };

  // 긴 섹션 내부에서의 진행 판정: 스냅해야 하면 방향(±1), 자연 스크롤이면 0을 반환
  // 끝 근처(<130px)는 잔여만큼 부드럽게 붙여 어중간한 정지 방지
  const tallPass = dir => {
    idx = containingIdx();
    if (!isTall(idx)) return dir;
    const secTop = topOf(idx), secBot = secTop + sections[idx].offsetHeight;
    if (dir > 0) {
      const remain = secBot - (window.scrollY + innerHeight);
      if (remain > 4) {
        if (remain <= 130) { locked = true; animateTo(secBot - innerHeight, () => setTimeout(() => { locked = false; }, 70)); return null; }
        return 0; // 네이티브 스크롤 통과
      }
    } else {
      const remain = window.scrollY - secTop;
      if (remain > 4) {
        if (remain <= 130) { locked = true; animateTo(secTop, () => setTimeout(() => { locked = false; }, 70)); return null; }
        return 0;
      }
    }
    return dir; // 끝에 도달 → 스냅
  };

  const onWheel = e => {
    if (!active) return;
    if (document.body.classList.contains('lb-open')) return; // 라이트박스 열림 → 가로채지 않음
    if (e.ctrlKey || e.metaKey) return; // Ctrl/⌘+휠 = 브라우저 확대/축소(및 트랙패드 핀치줌) → 가로채지 않음
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // 가로 우세 제스처는 네이티브(가로 스트립)로
    if (locked) { e.preventDefault(); return; }
    const dir = e.deltaY > 0 ? 1 : -1;
    const pass = tallPass(dir);
    if (pass === 0) return;          // 긴 섹션 내부 — 네이티브 스크롤
    e.preventDefault();
    if (pass === null || Math.abs(e.deltaY) < 4) return; // 끝 붙임 진행 중
    if (dir > 0 && idx < sections.length - 1) goTo(idx + 1, 1);
    else if (dir < 0 && idx > 0) goTo(idx - 1, -1);
  };
  const onKey = e => {
    if (!active) return;
    if (document.body.classList.contains('lb-open')) return;
    const t = e.target;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
    if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
    if (e.key === 'End') { e.preventDefault(); goTo(sections.length - 1); return; }
    let d = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) d = -1;
    if (d) {
      if (locked) { e.preventDefault(); return; }
      const pass = tallPass(d);
      if (pass === 0) return;        // 긴 섹션 내부 — 브라우저 기본 키 스크롤
      e.preventDefault();
      if (pass === null) return;
      goTo(idx + d, d);
    }
  };
  let touchY = null;
  const onTS = e => { touchY = e.touches[0].clientY; };
  const onTE = e => {
    if (!active || touchY == null || locked) return;
    if (document.body.classList.contains('lb-open')) { touchY = null; return; }
    const dy = touchY - e.changedTouches[0].clientY; touchY = null;
    if (Math.abs(dy) < 45) return;
    const d = dy > 0 ? 1 : -1;
    const pass = tallPass(d);
    if (pass === 0 || pass === null) return; // 긴 섹션 내부 — 네이티브 터치 스크롤
    if (d > 0 && idx < sections.length - 1) goTo(idx + 1, 1);
    else if (d < 0 && idx > 0) goTo(idx - 1, -1);
  };

  addEventListener('wheel', onWheel, { passive: false });
  addEventListener('keydown', onKey);
  addEventListener('touchstart', onTS, { passive: true });
  addEventListener('touchend', onTE, { passive: true });

  const enable = () => { if (active) return; active = true; html.classList.add('fp-active'); idx = nearestIdx(); };
  const disable = () => { if (!active) return; active = false; html.classList.remove('fp-active'); };
  const applyMode = () => { collect(); if (mqDesktop.matches && !reduced) enable(); else disable(); };
  applyMode();
  mqDesktop.addEventListener('change', applyMode);
  addEventListener('resize', () => { collect(); if (active && !locked) window.scrollTo(0, topOf(idx)); });
})();
