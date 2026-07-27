/* ===== OCUBE v2 공통 스크립트 (자연 스크롤 테마) ===== */
(function () {
  'use strict';

  /* --- 1) 스크롤 리빌 : IO 우선 + 스크롤 폴백 (IO 미발동 환경에서도 콘텐츠가 숨겨지지 않도록) --- */
  (function reveal() {
    var els = [].slice.call(document.querySelectorAll('.rv, .reveal'));
    if (!els.length) return;
    function show(el) { el.classList.add('in'); }
    function drop(el) { var k = els.indexOf(el); if (k > -1) els.splice(k, 1); }
    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = els.length - 1; i >= 0; i--) {
        var r = els[i].getBoundingClientRect();
        if (r.top < vh * 0.92) { show(els[i]); els.splice(i, 1); }   // 지나간 요소도 반드시 표시
      }
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); drop(e.target); } });
      }, { threshold: .1, rootMargin: '0px 0px -6% 0px' });
      els.slice().forEach(function (el) { io.observe(el); });
    }
    var last = 0;
    function onScroll() { var n = Date.now(); if (n - last < 120) return; last = n; check(); }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    check(); setTimeout(check, 600); setTimeout(check, 1800);
  })();

  /* --- 1-b) 광폭 비교표: 가로 스크롤 래퍼 자동 적용(모바일 오버플로 방지) --- */
  (function wrapTables() {
    document.querySelectorAll('table.cmp').forEach(function (tb) {
      if (tb.parentElement && tb.parentElement.classList.contains('cmp-scroll')) return;
      var wrap = document.createElement('div');
      wrap.className = 'cmp-scroll';
      wrap.tabIndex = 0;
      var caption = tb.querySelector('caption');
      wrap.setAttribute('aria-label', (caption ? caption.textContent.trim() : '비교표') + ' — 가로로 스크롤할 수 있습니다');
      tb.parentNode.insertBefore(wrap, tb);
      wrap.appendChild(tb);
    });
  })();

  /* --- 1-c) GNB 상태 : 히어로 위 투명 → 스크롤 시 솔리드 (i-bricks 패턴) --- */
  (function gnbState() {
    var g = document.querySelector('.gnb');
    if (!g) return;
    if (!document.querySelector('.hero')) {              // 히어로 없는 페이지(privacy 등)
      g.classList.add('scrolled');
      document.body.classList.add('no-hero');
      return;
    }
    function upd() { g.classList.toggle('scrolled', (window.scrollY || document.documentElement.scrollTop || 0) > 30); }
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd, { passive: true });
    upd(); setTimeout(upd, 300);
  })();

  /* --- 2) 모바일 메뉴 --- */
  (function mobileNav() {
    var t = document.querySelector('.m-toggle'), p = document.querySelector('.m-panel');
    if (!t || !p) return;
    var desktop = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    var sourceItems = document.querySelectorAll('.nav-menu .nav-item');
    var directContact = p.querySelector('a[href*="contact"]');
    var inerted = [];
    p.id = p.id || 'mobile-menu';
    t.setAttribute('aria-controls', p.id);
    t.setAttribute('aria-expanded', 'false');

    if (sourceItems.length) {
      var accordion = document.createElement('div');
      accordion.className = 'm-accordion';
      sourceItems.forEach(function (item, index) {
        var top = item.querySelector(':scope > a');
        var dropdown = item.querySelector(':scope > .dropdown');
        if (!top || !dropdown) return;
        var labelCopy = top.cloneNode(true);
        var caret = labelCopy.querySelector('.badge-caret');
        if (caret) caret.remove();
        var label = labelCopy.textContent.trim();
        var section = document.createElement('section');
        section.className = 'm-acc-item';
        var trigger = document.createElement('button');
        var triggerId = 'm-acc-trigger-' + (index + 1);
        var panelId = 'm-acc-panel-' + (index + 1);
        trigger.type = 'button';
        trigger.id = triggerId;
        trigger.className = 'm-acc-trigger';
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', panelId);
        var triggerLabel = document.createElement('span');
        triggerLabel.textContent = label;
        var icon = document.createElement('span');
        icon.className = 'm-acc-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '';
        trigger.appendChild(triggerLabel);
        trigger.appendChild(icon);

        var panel = document.createElement('div');
        panel.id = panelId;
        panel.className = 'm-acc-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', triggerId);
        panel.hidden = true;
        var overviewHref = top.getAttribute('href');
        if (overviewHref) {                       // 대메뉴가 링크가 아니면 전체 보기 항목을 만들지 않는다
          var overview = document.createElement('a');
          overview.className = 'm-acc-overview';
          overview.href = overviewHref;
          overview.textContent = label + ' 전체 보기';
          panel.appendChild(overview);
        }
        dropdown.querySelectorAll('.dd-group').forEach(function (group) {
          var mobileGroup = document.createElement('div');
          mobileGroup.className = 'm-acc-group';
          var heading = group.querySelector('.dd-h');
          if (heading) {
            var mobileHeading = document.createElement('p');
            mobileHeading.className = 'm-acc-heading';
            mobileHeading.textContent = heading.textContent;
            mobileGroup.appendChild(mobileHeading);
          }
          group.querySelectorAll(':scope > a').forEach(function (link) {
            mobileGroup.appendChild(link.cloneNode(true));
          });
          panel.appendChild(mobileGroup);
        });
        section.appendChild(trigger);
        section.appendChild(panel);
        accordion.appendChild(section);
      });
      p.textContent = '';
      p.appendChild(accordion);
      if (directContact) {
        var contact = directContact.cloneNode(true);
        contact.classList.add('m-direct');
        p.appendChild(contact);
      }
    }

    var accordionTriggers = p.querySelectorAll('.m-acc-trigger');
    function collapse(trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.setAttribute('aria-expanded', 'false');
      trigger.closest('.m-acc-item').classList.remove('open');
      if (panel) panel.hidden = true;
    }
    function collapseAll(except) {
      accordionTriggers.forEach(function (trigger) {
        if (trigger !== except) collapse(trigger);
      });
    }
    accordionTriggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var opening = trigger.getAttribute('aria-expanded') !== 'true';
        collapseAll(trigger);
        var panel = document.getElementById(trigger.getAttribute('aria-controls'));
        trigger.setAttribute('aria-expanded', String(opening));
        trigger.closest('.m-acc-item').classList.toggle('open', opening);
        if (panel) panel.hidden = !opening;
      });
    });
    function setBackgroundInert(active) {
      if (!('inert' in HTMLElement.prototype)) return;
      if (active) {
        inerted = [];
        Array.prototype.forEach.call(document.body.children, function (el) {
          if (el === p || el.classList.contains('gnb') || el.tagName === 'SCRIPT') return;
          inerted.push({ el: el, value: el.inert });
          el.inert = true;
        });
        document.querySelectorAll('.gnb .logo,.gnb .nav-menu,.gnb .cta-btn').forEach(function (el) {
          inerted.push({ el: el, value: el.inert });
          el.inert = true;
        });
      } else {
        inerted.forEach(function (record) { record.el.inert = record.value; });
        inerted = [];
      }
    }
    function getFocusable() {
      var panelItems = [].slice.call(p.querySelectorAll('button:not([disabled]),a[href]:not([tabindex="-1"])'))
        .filter(function (el) { return el.getClientRects().length > 0; });
      return [t].concat(panelItems);
    }
    function close(returnFocus) {
      p.classList.remove('open');
      document.body.classList.remove('m-lock');
      setBackgroundInert(false);
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-label', '메뉴 열기');
      t.textContent = '메뉴';
      collapseAll();
      if (returnFocus) t.focus();
    }
    t.addEventListener('click', function () {
      if (p.classList.contains('open')) {
        close(false);
        return;
      }
      p.classList.add('open');
      document.body.classList.add('m-lock');
      setBackgroundInert(true);
      t.setAttribute('aria-expanded', 'true');
      t.setAttribute('aria-label', '메뉴 닫기');
      t.textContent = '닫기';
    });
    p.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { close(false); });
    });
    addEventListener('keydown', function (e) {
      if (!p.classList.contains('open')) return;
      if (e.key === 'Escape') {
        close(true);
        return;
      }
      if (e.key !== 'Tab') return;
      var focusable = getFocusable();
      var first = focusable[0], last = focusable[focusable.length - 1];
      var currentIndex = focusable.indexOf(document.activeElement);
      if (currentIndex === -1 || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    desktop.addEventListener('change', function (e) { if (e.matches) close(false); });
  })();

  /* --- 2-b) 현재 페이지 내비게이션 표시 --- */
  (function currentNavigation() {
    var current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    function targetName(link) {
      try {
        var url = new URL(link.getAttribute('href'), location.href);
        return (url.pathname.split('/').pop() || 'index.html').toLowerCase();
      } catch (e) { return ''; }
    }
    document.querySelectorAll('.nav-menu a, .m-panel a, .fb-links a, .subnav a').forEach(function (link) {
      if (targetName(link) === current) link.setAttribute('aria-current', 'page');
    });
    document.querySelectorAll('.nav-menu .nav-item').forEach(function (item) {
      if (item.querySelector('[aria-current="page"]')) item.classList.add('is-current');
    });
    document.querySelectorAll('.m-acc-item').forEach(function (item) {
      if (item.querySelector('[aria-current="page"]')) item.classList.add('is-current');
    });
  })();

  /* --- 3) 히어로 3개 비즈니스 배너 슬라이더 --- */
  (function heroSlider() {
    var hero = document.querySelector('.hero-slider, .hero');
    if (!hero) return;
    var slides = [].slice.call(hero.querySelectorAll('.hslide'));
    if (slides.length < 2) return;                       // 단일 히어로 페이지에서는 비활성
    var bars = [].slice.call(hero.querySelectorAll('.hbar'));
    var vids = [].slice.call(hero.querySelectorAll('.hslide video'));
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mob = reduced || matchMedia('(max-width:900px), (hover:none) and (pointer:coarse)').matches;
    if (mob) vids.forEach(function (v) { if (v) v.remove(); });
    var idx = 0, timer = null, DUR = 5200;
    slides.forEach(function (s, i) {
      var slideId = s.id || 'hero-panel-' + (i + 1);
      var tabId = bars[i] && (bars[i].id || 'hero-tab-' + (i + 1));
      s.id = slideId;
      s.setAttribute('role', 'tabpanel');
      if (tabId) s.setAttribute('aria-labelledby', tabId);
      if (bars[i]) {
        bars[i].id = tabId;
        bars[i].setAttribute('role', 'tab');
        bars[i].setAttribute('aria-controls', slideId);
      }
    });
    function setSlideFocusable(slide, active) {
      slide.querySelectorAll('a[href],button,input,select,textarea,[tabindex]').forEach(function (el) {
        if (typeof el.__heroTabIndex === 'undefined') el.__heroTabIndex = el.getAttribute('tabindex');
        if (active) {
          if (el.__heroTabIndex === null) el.removeAttribute('tabindex');
          else el.setAttribute('tabindex', el.__heroTabIndex);
        } else el.setAttribute('tabindex', '-1');
      });
    }
    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var active = i === idx;
        s.classList.toggle('on', active);
        s.setAttribute('aria-hidden', active ? 'false' : 'true');
        s.toggleAttribute('inert', !active);
        setSlideFocusable(s, active);
      });
      bars.forEach(function (b, i) {
        var active = i === idx;
        b.classList.toggle('on', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
        b.tabIndex = active ? 0 : -1;
      });
      if (!mob) vids.forEach(function (v, i) {
        if (!v) return;
        if (i === idx) { var pr = v.play && v.play(); if (pr && pr.catch) pr.catch(function () { }); }
        else { try { v.pause(); } catch (e) { } }
      });
    }
    var manualPause = false;                              // 사용자가 명시적으로 일시정지한 상태
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { if (mob || manualPause) return; stop(); timer = setInterval(function () { show(idx + 1); }, DUR); }
    bars.forEach(function (b, i) {
      b.addEventListener('click', function () { show(i); start(); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        var next = e.key === 'Home' ? 0 : e.key === 'End' ? bars.length - 1 : i + (e.key === 'ArrowLeft' ? -1 : 1);
        next = (next + bars.length) % bars.length;
        show(next); bars[next].focus(); start();
      });
    });

    /* 이전 · 일시정지/재생 · 다음 */
    var ctrl = hero.querySelector('.hctrl');
    if (ctrl) ctrl.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.hnav') : null;
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'prev') { show(idx - 1); start(); }
      else if (act === 'next') { show(idx + 1); start(); }
      else if (act === 'toggle') {
        manualPause = !manualPause;
        hero.classList.toggle('paused', manualPause);
        b.setAttribute('aria-pressed', manualPause ? 'true' : 'false');
        b.setAttribute('aria-label', manualPause ? '자동 전환 재생' : '자동 전환 일시정지');
        if (manualPause) stop(); else start();
      }
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    show(0); start();
  })();

  /* --- 3-b) 모바일/reduced-motion : 단일 히어로 영상 제거 + 포스터 배경 대체(데이터·LCP) --- */
  (function heroVideoMobile() {
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!(reduced || matchMedia('(max-width:900px)').matches)) return;
    document.querySelectorAll('.hero video').forEach(function (v) {
      if (v.closest('.hslide')) return;                  // 4배너 슬라이더는 자체 처리
      var hero = v.closest('.hero'), poster = v.getAttribute('poster');
      if (hero && poster) {
        hero.style.backgroundImage = 'url("' + poster + '")';
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';
      }
      v.remove();
    });
  })();

  /* --- 3-c) KPI 카운트업 : [data-count] — 미발동 환경에서도 최종값 보장 --- */
  (function counters() {
    var els = [].slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    function run(el) {
      if (el.__done) return; el.__done = true;
      var to = parseFloat(el.getAttribute('data-count')) || 0;
      var t0 = null, DUR = 900;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / DUR, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      setTimeout(function () { el.textContent = to.toLocaleString(); }, DUR + 250); // rAF 정지 대비 최종값 보장
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
      }, { threshold: .4 });
      els.forEach(function (el) { io.observe(el); });
    }
    setTimeout(function () { els.forEach(run); }, 2500);   // IO 미발동 폴백
  })();

  /* --- 3-d) 구축 사례 필터 (references) --- */
  (function caseFilter() {
    var bar = document.querySelector('.case-filter');
    if (!bar) return;
    var tabs = [].slice.call(bar.querySelectorAll('.case-tab'));
    var cards = [].slice.call(document.querySelectorAll('.case-card[data-line]'));
    var domains = [].slice.call(document.querySelectorAll('.case-domain'));
    bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.case-tab') : null;
      if (!b) return;
      var line = b.getAttribute('data-line');
      tabs.forEach(function (t) { t.classList.toggle('active', t === b); t.setAttribute('aria-pressed', t === b ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var show = line === 'all' || (c.getAttribute('data-line') || '').split(/\s+/).indexOf(line) > -1;
        c.classList.toggle('is-hidden', !show);
      });
      domains.forEach(function (d) {
        var any = d.querySelector('.case-card:not(.is-hidden)');
        d.style.display = any ? '' : 'none';
      });
    });
  })();

  /* --- 3-d2) 인증·특허·저작권 갤러리 필터 (company) --- */
  (function certFilter() {
    var bar = document.querySelector('.cert-filter');
    if (!bar) return;
    var tabs = [].slice.call(bar.querySelectorAll('.case-tab'));
    // 증서(.cert-card)·구축실적(.ref-card) 공용
    var cards = [].slice.call(document.querySelectorAll('.cert-card[data-cat],.ref-card[data-cat]'));
    if (!cards.length) return;
    var count = document.querySelector('[data-cert-count]');
    function apply(cat) {
      var n = 0;
      cards.forEach(function (c) {
        var show = cat === 'all' || c.getAttribute('data-cat') === cat;
        c.classList.toggle('is-hidden', !show);
        if (show) n++;
      });
      if (count) count.textContent = n;
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.case-tab') : null;
      if (!b) return;
      tabs.forEach(function (t) { t.classList.toggle('active', t === b); t.setAttribute('aria-pressed', t === b ? 'true' : 'false'); });
      apply(b.getAttribute('data-cat'));
    });
    apply('all');
  })();

  /* --- 3-e) 원클릭 복사 [data-copy] + 토스트 --- */
  (function copyBtns() {
    if (!document.querySelector('[data-copy]')) return;
    var toast = document.createElement('div');
    toast.className = 'toast'; toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
    var tid = null;
    function show(msg) {
      toast.textContent = msg; toast.classList.add('show');
      clearTimeout(tid); tid = setTimeout(function () { toast.classList.remove('show'); }, 1800);
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-copy]') : null;
      if (!b) return;
      var v = b.getAttribute('data-copy');
      function ok() { show('복사되었습니다 — ' + v); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(ok, ok);
      else {
        var ta = document.createElement('textarea'); ta.value = v; document.body.appendChild(ta);
        ta.select(); try { document.execCommand('copy'); } catch (err) { } ta.remove(); ok();
      }
    });
  })();

  /* --- 3-f) 제품 화면 확대 + 기능 카드 포인터 미리보기 --- */
  (function productLightbox() {
    var imgs = [].slice.call(document.querySelectorAll('img.shot'));
    var shotButtons = [].slice.call(document.querySelectorAll('[data-shot]'));
    if (!imgs.length && !shotButtons.length) return;
    var dialog = null, lastFocus = null;
    function close() {
      if (!dialog || !dialog.classList.contains('open')) return;
      document.body.classList.remove('lb-open');
      dialog.classList.remove('open');
      dialog.setAttribute('aria-hidden', 'true');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function build() {
      dialog = document.createElement('div');
      dialog.className = 'lightbox';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', '제품 화면 확대 보기');
      dialog.setAttribute('aria-hidden', 'true');
      dialog.innerHTML = '<button class="lb-close" type="button" aria-label="확대 화면 닫기">×</button><img class="lb-img" alt=""><p class="lb-cap" id="lb-caption"></p>';
      dialog.setAttribute('aria-describedby', 'lb-caption');
      document.body.appendChild(dialog);
      dialog.addEventListener('click', function (e) { if (e.target === dialog || e.target.classList.contains('lb-close')) close(); });
      dialog.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'Tab') { e.preventDefault(); dialog.querySelector('.lb-close').focus(); }
      });
    }
    function openSource(src, alt, caption) {
      if (!dialog) build();
      lastFocus = document.activeElement;
      var image = dialog.querySelector('.lb-img');
      image.src = src; image.alt = alt || '';
      dialog.querySelector('.lb-cap').textContent = caption || alt || '';
      document.body.classList.add('lb-open');
      dialog.classList.add('open');
      dialog.setAttribute('aria-hidden', 'false');
      dialog.querySelector('.lb-close').focus();
    }
    imgs.forEach(function (img) {
      if (img.closest('a,button')) return;
      img.classList.add('zoomable'); img.tabIndex = 0; img.setAttribute('role', 'button');
      img.setAttribute('aria-label', (img.alt || '제품 화면') + ' 확대 보기');
      function openImage() {
        var figure = img.closest('figure');
        var caption = figure && figure.querySelector('figcaption');
        openSource(img.currentSrc || img.src, img.alt, caption ? caption.textContent : img.alt);
      }
      img.addEventListener('click', openImage);
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openImage(); } });
    });
    shotButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        openSource(button.getAttribute('data-shot'), button.getAttribute('data-shot-alt') || '', button.getAttribute('data-shot-cap') || '');
      });
    });
  })();

  (function pointerPreview() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var cards = [].slice.call(document.querySelectorAll('[data-preview]'));
    if (!cards.length) return;
    var preview = document.createElement('figure');
    preview.className = 'hover-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = '<img alt=""><figcaption></figcaption>';
    document.body.appendChild(preview);
    var image = preview.querySelector('img'), caption = preview.querySelector('figcaption');
    function place(e) {
      var width = 360, height = 250, gap = 22;
      var x = e.clientX + gap, y = e.clientY + gap;
      if (x + width > innerWidth - 12) x = e.clientX - width - gap;
      if (y + height > innerHeight - 12) y = Math.max(12, innerHeight - height - 12);
      preview.style.left = x + 'px'; preview.style.top = y + 'px';
    }
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function (e) {
        image.src = card.getAttribute('data-preview');
        image.alt = card.getAttribute('data-preview-alt') || '';
        caption.textContent = card.getAttribute('data-preview-cap') || '';
        place(e); preview.classList.add('show');
      });
      card.addEventListener('mousemove', place, { passive: true });
      card.addEventListener('mouseleave', function () { preview.classList.remove('show'); });
    });
  })();

  /* --- 3-f) FAB 스택 : 맨 위로 · 전화 문의 (전 페이지 공통, i-bricks 참고) --- */
  (function fabStack() {
    var fab = document.createElement('div');
    fab.className = 'fab-stack';
    fab.innerHTML =
      '<a class="fab-btn" href="tel:0533135333" aria-label="전화 문의 053-313-5333">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
      '</a>' +
      '<button class="fab-btn fab-top" type="button" aria-label="맨 위로">' +
        '<svg viewBox="0 0 17 19" width="16" height="18" aria-hidden="true"><path d="M1 8l7.3-7 7.3 7M8.3 1v17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</button>';
    document.body.appendChild(fab);
    var topBtn = fab.querySelector('.fab-top');
    function toggle() { fab.classList.toggle('show', (window.scrollY || document.documentElement.scrollTop || 0) > 500); }
    addEventListener('scroll', toggle, { passive: true });
    toggle(); setTimeout(toggle, 400);
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  })();

  /* --- 4) What We Do 핀드 : 진행 도트를 항목 리빌과 동기화 --- */
  (function pinDots() {
    var secs = [].slice.call(document.querySelectorAll('.pinsec'));
    if (!secs.length) return;
    secs.forEach(function (sec) {
      var items = [].slice.call(sec.querySelectorAll('.pin-item'));
      var dots = [].slice.call(sec.querySelectorAll('.pin-progress i'));
      if (!items.length || !dots.length) return;
      function sync() {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var cur = -1;
        items.forEach(function (it, i) { if (it.getBoundingClientRect().top < vh * 0.75) cur = i; });
        dots.forEach(function (d, i) { d.classList.toggle('on', i <= cur); });
      }
      var last = 0;
      addEventListener('scroll', function () { var n = Date.now(); if (n - last < 110) return; last = n; sync(); }, { passive: true });
      addEventListener('resize', sync, { passive: true });
      sync(); setTimeout(sync, 600);
    });
  })();

})();

/* --- 시연 영상 IO 재생: video.demovid — 화면에 보일 때만 재생, 벗어나면 정지 --- */
(function demoVids() {
  var vids = [].slice.call(document.querySelectorAll('video.demovid'));
  if (!vids.length) return;
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm) return; /* 모션 최소화: 포스터만 표시 */
  if (!('IntersectionObserver' in window)) { vids.forEach(function (v) { v.play && v.play().catch(function(){}); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && e.intersectionRatio >= .35) { v.play && v.play().catch(function(){}); }
      else { v.pause && v.pause(); }
    });
  }, { threshold: [0, .35] });
  vids.forEach(function (v) { io.observe(v); });
})();

/* --- 스크롤 프로그레스 바 (마크업 주입, rAF 스로틀) --- */
(function scrollProgress() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var bar = document.createElement('div');
  bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var ticking = false;
  function paint() {
    ticking = false;
    var max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();
})();

/* --- GNB 스마트 숨김: 320px 이상에서 하강 시 숨김, 상승 즉시 복귀 (i-bricks 패턴) --- */
(function gnbHide() {
  var gnb = document.querySelector('.gnb');
  if (!gnb) return;
  var lastY = scrollY, ticking = false;
  function paint() {
    ticking = false;
    var y = scrollY;
    if (document.body.classList.contains('m-lock')) { gnb.classList.remove('gnb-hide'); lastY = y; return; }
    if (y > 320 && y > lastY + 6) gnb.classList.add('gnb-hide');
    else if (y < lastY - 4 || y <= 320) gnb.classList.remove('gnb-hide');
    lastY = y;
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  /* 키보드 포커스가 헤더로 가면 항상 표시 */
  gnb.addEventListener('focusin', function () { gnb.classList.remove('gnb-hide'); });
})();

/* --- CI 로고 포인터 틸트: 커서를 따라 3D 기울기 (fine pointer 전용, lerp) --- */
(function ciTilt() {
  var stage = document.querySelector('.ci-stage'), el = document.querySelector('.ci-tilt');
  if (!stage || !el) return;
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, over = false;
  function loop() {
    cx += (tx - cx) * .12; cy += (ty - cy) * .12;
    el.style.transform = 'perspective(900px) rotateX(' + (-cy).toFixed(2) + 'deg) rotateY(' + cx.toFixed(2) + 'deg)';
    if (over || Math.abs(cx) > .05 || Math.abs(cy) > .05) raf = requestAnimationFrame(loop);
    else { el.style.transform = ''; raf = null; }
  }
  stage.addEventListener('pointerenter', function () { over = true; });
  stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - .5) * 18;   /* ±9deg */
    ty = ((e.clientY - r.top) / r.height - .5) * 14;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  stage.addEventListener('pointerleave', function () { over = false; tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
})();

/* --- GNB 메가 메뉴: 내비 호버/포커스 시 간격 확장 + 전 메뉴 동시 펼침 (Seegene 패턴) --- */
(function gnbMega() {
  var gnb = document.querySelector('.gnb');
  var menu = gnb && gnb.querySelector('.nav-menu');
  if (!gnb || !menu) return;
  var desktop = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  var hoverDesktop = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
  var timer = null;
  var resizeTimer = null;
  var hoverBound = false;
  var megaHeight = 0;
  var triggers = gnb.querySelectorAll('.nav-item > a');
  triggers.forEach(function (trigger, index) {
    var panel = trigger.nextElementSibling;
    if (panel && panel.classList.contains('dropdown')) {
      if (!panel.id) panel.id = 'gnb-panel-' + (index + 1);
      trigger.setAttribute('aria-controls', panel.id);
    }
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
  });
  function setExpanded(value) {
    triggers.forEach(function (trigger) { trigger.setAttribute('aria-expanded', String(value)); });
  }
  function measureMegaHeight() {
    var h = 0;
    gnb.querySelectorAll('.dropdown').forEach(function (d) { h = Math.max(h, d.scrollHeight); });
    megaHeight = Math.ceil(h) + 24;
    gnb.style.setProperty('--mega-h', megaHeight + 'px');
  }
  function open() {
    if (!desktop.matches) return;
    clearTimeout(timer);
    /* 메가 레이아웃의 최장 컬럼 높이를 한 번만 저장해 컬럼 이동 중 패널이 흔들리지 않게 한다. */
    gnb.classList.add('gnb-mega');
    gnb.classList.remove('gnb-hide');
    if (!megaHeight) measureMegaHeight();
    else gnb.style.setProperty('--mega-h', megaHeight + 'px');
    setExpanded(true);
  }
  function closeNow() {
    clearTimeout(timer);
    gnb.classList.remove('gnb-mega');
    setExpanded(false);
  }
  function close() { timer = setTimeout(closeNow, 140); }
  function hold() { if (gnb.classList.contains('gnb-mega')) clearTimeout(timer); }
  function bindHover(enable) {
    if (enable === hoverBound) return;
    hoverBound = enable;
    if (enable) {
      menu.addEventListener('mouseenter', open);
      gnb.addEventListener('mouseleave', close);
      gnb.addEventListener('mouseenter', hold);
    } else {
      menu.removeEventListener('mouseenter', open);
      gnb.removeEventListener('mouseleave', close);
      gnb.removeEventListener('mouseenter', hold);
      closeNow();
    }
  }
  bindHover(hoverDesktop.matches);
  hoverDesktop.addEventListener('change', function (e) { bindHover(e.matches); });
  /* 패널의 빈 영역까지 실제 GNB 박스에 포함되므로, 바깥으로 나갈 때만 닫는다. */
  menu.addEventListener('click', function (e) {
    var trigger = e.target.closest('.nav-item > a');
    if (!trigger || !desktop.matches || hoverDesktop.matches || gnb.classList.contains('gnb-mega')) return;
    e.preventDefault();
    open();
    trigger.focus();
  });
  /* 키보드 접근성 */
  menu.addEventListener('focusin', open);
  gnb.addEventListener('focusout', function (e) { if (!gnb.contains(e.relatedTarget)) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !gnb.classList.contains('gnb-mega')) return;
    var active = document.activeElement;
    var item = active && active.closest ? active.closest('.nav-item') : null;
    var trigger = item && item.querySelector(':scope > a');
    if (trigger) trigger.focus();
    closeNow();
  });
  function invalidateMegaHeight() {
    megaHeight = 0;
    if (gnb.classList.contains('gnb-mega')) measureMegaHeight();
  }
  addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(invalidateMegaHeight, 120);
  }, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(invalidateMegaHeight);
  }
  desktop.addEventListener('change', function (e) {
    if (!e.matches) {
      closeNow();
      gnb.style.removeProperty('--mega-h');
      megaHeight = 0;
    }
  });
})();

/* 문의 폼: 서버 저장 없이 사용자의 이메일 앱에 작성 내용을 전달한다. */
(function contactMail() {
  var form = document.querySelector('[data-contact-form]');
  if (!form) return;
  var status = document.getElementById('form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var type = document.getElementById('f-type').value;
    var name = document.getElementById('f-name').value.trim();
    var email = document.getElementById('f-mail').value.trim();
    var message = document.getElementById('f-msg').value.trim();
    var subject = '[오큐브 홈페이지 문의] ' + type + ' - ' + name;
    var body = [
      '문의 유형: ' + type,
      '성함 / 회사: ' + name,
      '회신 이메일: ' + email,
      '',
      '문의 내용',
      message
    ].join('\n');
    if (status) status.textContent = '이메일 앱에서 내용을 확인한 뒤 전송해 주세요. 앱이 열리지 않으면 sales@ocube.co.kr로 보내 주세요.';
    window.location.href = 'mailto:sales@ocube.co.kr?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
  /* --- 솔루션 상단: 이동한 문구가 밝은 영역에 올라오면 색 전환 --- */
  (function solCopyTravel() {
    var copy = document.querySelector(".sol-copy"), body = document.querySelector(".sol-body");
    if (!copy || !body) return;
    var ticking = false;
    function upd() {
      ticking = false;
      var c = copy.getBoundingClientRect(), b = body.getBoundingClientRect();
      copy.classList.toggle("on-light", b.top < c.top + c.height / 2);
    }
    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(upd); }
    }, { passive: true });
    addEventListener("resize", upd);
    upd();
  })();

/* 모션 초기화가 끝난 경우에만 리빌 요소를 숨긴다. 스크립트 실패 시 본문은 기본적으로 보인다. */
document.documentElement.classList.add('motion-ready');
