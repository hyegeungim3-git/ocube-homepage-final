// ===== 오큐브 인터랙션 엔진 (GSAP + vanilla) =====
(() => {
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

/* ── 모바일(≤1023px)·reduced-motion: 히어로 배경 영상(홈 14MB) 제거 + 포스터를 정적 배경으로 ──
   모바일 데이터·LCP 부담 차단(rank6) + reduced-motion에서 영상이 계속 재생·다운로드되던 문제 해소 */
if (reduced || matchMedia('(max-width:1023px)').matches) {
  document.querySelectorAll('.hero-video').forEach(v => {
    const poster = v.getAttribute('poster'), hero = v.closest('.hero');
    if (poster && hero) {
      hero.style.backgroundImage = 'url("' + poster + '")';
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
    }
    v.remove();
  });
}

/* ── 배경 영상 자동재생 구조(백그라운드 탭·절전 대응) ── */
const rescueVideos = () => {
  document.querySelectorAll('video[autoplay]').forEach(v => { if (v.paused) v.play().catch(() => {}); });
};
['click', 'scroll', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, rescueVideos, { passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden) rescueVideos(); });
setTimeout(rescueVideos, 1500);

/* ── 히어로 서사 1회 재생 후 터널 구간만 무한 루프 (data-loop-in = 터널 시작 초, 트림 클립 기준) ── */
document.querySelectorAll('video[data-loop-in]').forEach(v => {
  const loopIn = parseFloat(v.getAttribute('data-loop-in')) || 0;
  v.loop = false; // native loop 제거 필수(있으면 0초로 되감겨 서사-후-터널 로직이 죽음)
  const toTunnel = () => {
    try { v.currentTime = loopIn; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  };
  v.addEventListener('ended', toTunnel);
  // 숨겨진 탭 등에서 ended 미발화 대비: 끝 근처 도달 시 폴백 seek
  v.addEventListener('timeupdate', () => {
    if (v.duration && v.currentTime >= v.duration - 0.12) toTunnel();
  });
});

/* ── 스크롤 프로그레스 바 ── */
const bar = document.createElement('div');
bar.className = 'scroll-progress';
document.body.appendChild(bar);
addEventListener('scroll', () => {
  const denom = document.body.scrollHeight - innerHeight;
  const p = denom > 0 ? Math.min(scrollY / denom, 1) : 0; // 스크롤 없는 짧은 페이지 분모 0 → NaN 방지
  bar.style.transform = `scaleX(${p})`;
}, { passive: true });

/* ── 커스텀 커서 제거됨(기본 마우스 포인터 사용) ── */

/* ── 히어로 파티클 네트워크 (마우스 반응) ── */
const cv = document.getElementById('net-canvas');
if (cv && !reduced) {
  const ctx = cv.getContext('2d');
  let W, H, pts = [], mouse = { x: -9999, y: -9999 };
  const N = fine ? 70 : 36;
  const resize = () => {
    const r = cv.parentElement.getBoundingClientRect();
    W = cv.width = r.width * devicePixelRatio; H = cv.height = r.height * devicePixelRatio;
    cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  };
  resize(); addEventListener('resize', resize);
  for (let i = 0; i < N; i++) pts.push({
    x: Math.random() * 2000 * devicePixelRatio, y: Math.random() * 900 * devicePixelRatio,
    vx: (Math.random() - .5) * .35 * devicePixelRatio, vy: (Math.random() - .5) * .35 * devicePixelRatio,
  });
  cv.parentElement.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * devicePixelRatio; mouse.y = (e.clientY - r.top) * devicePixelRatio;
  });
  cv.parentElement.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  const LINK = 170 * devicePixelRatio, MLINK = 260 * devicePixelRatio;
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      // 마우스 인력
      const dxm = mouse.x - p.x, dym = mouse.y - p.y, dm = Math.hypot(dxm, dym);
      if (dm < MLINK && dm > 1) { p.x += dxm / dm * .6; p.y += dym / dm * .6; }
    });
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(91,155,255,${(1 - d / LINK) * .35})`;
          ctx.lineWidth = devicePixelRatio;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dm = Math.hypot(mouse.x - a.x, mouse.y - a.y);
      if (dm < MLINK) {
        ctx.strokeStyle = `rgba(255,255,255,${(1 - dm / MLINK) * .5})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(139,180,255,.8)';
      ctx.beginPath(); ctx.arc(a.x, a.y, 1.6 * devicePixelRatio, 0, 7); ctx.fill();
    }
    requestAnimationFrame(draw);
  })();
}

/* ── 3D 틸트 카드 ── */
if (fine && !reduced) {
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(800px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ── 마그네틱 버튼 ── */
if (fine && !reduced) {
  document.querySelectorAll('[data-magnet]').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* ── GSAP 연출 ── */
if (window.gsap && !reduced) {
  gsap.registerPlugin(ScrollTrigger);

  // 히어로 타이포 스태거 등장 (타임라인 + 안전장치)
  const heroLines = document.querySelectorAll('.hero h1 .line');
  const introSel = '.hero-badge, .hero > .wrap > p, .hero-ctas, .hero-stats';
  if (heroLines.length) {
    const tl = gsap.timeline({ delay: .15 });
    tl.from(heroLines, { yPercent: 110, opacity: 0, duration: 1, ease: 'power4.out', stagger: .12 })
      .from(introSel, { y: 26, opacity: 0, duration: .8, ease: 'power3.out', stagger: .1 }, '-=0.65')
      .eventCallback('onComplete', () => gsap.set('.hero h1 .line, ' + introSel, { clearProps: 'all' }));
    // 어떤 이유로든 인트로가 멈추면 강제 표시 (백그라운드 탭에서 GSAP 티커 정지 대비)
    const introAll = '.hero h1 .line, ' + introSel;
    const forceShow = () => {
      document.querySelectorAll(introAll).forEach(el => {
        if (parseFloat(getComputedStyle(el).opacity) < 1) gsap.set(el, { clearProps: 'all' });
      });
    };
    setTimeout(forceShow, 2500);
    setTimeout(forceShow, 6000);
    ['click', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, forceShow, { passive: true, once: false }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(forceShow, 1200); });
  }

  // 배경 대형 워드 스크럽
  document.querySelectorAll('.big-word').forEach(w => {
    gsap.fromTo(w, { xPercent: 8 }, { xPercent: -14, ease: 'none',
      scrollTrigger: { trigger: w.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });

  // 파이프라인: 방향별 슬라이드 인
  const pipe = document.querySelector('.pipeline');
  if (pipe) {
    gsap.from('.pipe-1', { x: -80, opacity: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: pipe, start: 'top 75%' } });
    gsap.from('.pipe-2', { y: 80, opacity: 0, duration: .8, delay: .15, ease: 'power3.out',
      scrollTrigger: { trigger: pipe, start: 'top 75%' } });
    gsap.from('.pipe-3', { x: 80, opacity: 0, duration: .8, delay: .3, ease: 'power3.out',
      scrollTrigger: { trigger: pipe, start: 'top 75%' } });
  }

  // 사례 카드: 등장 시 좌→우 스태거 (핀 대신 네이티브 가로 스와이프 스트립 사용 — 풀페이지 스냅과 충돌 방지)
  const hCards = document.querySelectorAll('.h-card');
  if (hCards.length) gsap.fromTo(hCards, { x: 40, opacity: 0 },
    { x: 0, opacity: 1, duration: .6, ease: 'power3.out', stagger: .1, immediateRender: false,
      scrollTrigger: { trigger: '.h-track', start: 'top 88%' } });

  // Cubeon 모듈 칩 팝
  const mods = document.querySelectorAll('.mod-grid .mod');
  if (mods.length) gsap.fromTo(mods, { scale: .6, opacity: 0 },
    { scale: 1, opacity: 1, duration: .5, ease: 'back.out(1.7)', immediateRender: false,
      stagger: { each: .06, grid: [2, 4], from: 'start' },
      scrollTrigger: { trigger: '.mod-grid', start: 'top 82%' } });

  // 직점프(레일 클릭) 시: 해당 섹션 콘텐츠를 즉시 표시
  addEventListener('fp:reveal', e => {
    // 1) 이미 스크롤이 지나친 트리거의 트윈 완성 (스크럽/패럴랙스는 위치 기반이라 제외)
    ScrollTrigger.getAll().forEach(st => {
      if (st.vars && st.vars.scrub) return;
      if (st.animation && st.scroll() >= st.start - 2) st.animation.progress(1);
    });
    // 2) 안전망 — 점프한 섹션 안에 아직 숨은(opacity<1) 요소는 인라인 스타일 제거로 즉시 표시
    //    (스냅 섹션은 뷰포트에 꽉 차므로 그 안의 리빌 트리거는 모두 발동된 상태)
    const sec = e.detail && document.getElementById(e.detail.id);
    if (sec) sec.querySelectorAll('.reveal, .pipe-1, .pipe-2, .pipe-3, .mod, .h-card').forEach(el => {
      // 핀드 우측 항목은 스크롤 리빌에 맡김(강제 완성 제외)
      if (e.detail && e.detail.pinned && el.closest && el.closest('.pin-right')) return;
      if (parseFloat(getComputedStyle(el).opacity) < 1) gsap.set(el, { clearProps: 'opacity,transform,x,y,scale' });
    });
  }, { passive: true });

  // 섹션 헤더 공통 리빌 (GSAP 버전이 .reveal 대체 — 있으면 부드럽게)
  ScrollTrigger.refresh();
}
})();
