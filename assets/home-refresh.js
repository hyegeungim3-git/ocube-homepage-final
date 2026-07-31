(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hero = document.querySelector(".home-page .hero");
  var heroShell = hero ? hero.querySelector(".home-hero-shell") : null;
  var heroSlides = hero ? Array.from(hero.querySelectorAll(".hslide")) : [];
  var typoSection = document.querySelector(".typo-section");
  var typoOpen = typoSection ? typoSection.querySelector(".typo-open") : null;
  var typoCube = typoSection ? typoSection.querySelector(".typo-cube") : null;
  var typoCopy = typoSection ? typoSection.querySelector(".typo-copy") : null;
  var globalTechSection = document.querySelector(".global-tech-section");
  var globalTechCopy = globalTechSection
    ? globalTechSection.querySelector(".global-tech-copy")
    : null;
  var globalTechLogos = globalTechSection
    ? Array.from(globalTechSection.querySelectorAll(".global-tech-logos a"))
    : [];
  var capabilityCards = Array.from(document.querySelectorAll(".capability-card"));
  var casesSection = document.querySelector(".home-cases-section");
  var casesPanel = document.querySelector(".home-cases-panel");
  var ticking = false;

  document.documentElement.classList.add("home-scroll-motion");

  if (heroShell) {
    if (reduceMotion.matches) {
      heroShell.classList.add("is-entered");
    } else {
      window.requestAnimationFrame(function () {
        heroShell.classList.add("is-entered");
      });
    }
  }

  function clearTypewriter(title) {
    if (!title || !title.__typewriterTimers) return;
    title.__typewriterTimers.forEach(window.clearTimeout);
    title.__typewriterTimers = [];
  }

  function runTypewriter(slide) {
    var title = slide && slide.querySelector("[data-typewriter]");
    if (!title) return;
    clearTypewriter(title);
    title.replaceChildren();
    if (!slide.classList.contains("on")) return;

    var characters = Array.from(title.getAttribute("data-typewriter") || "");
    var fragments = characters.map(function (character) {
      var span = document.createElement(character === "\n" ? "br" : "span");
      span.className = "typewriter-character";
      if (character !== "\n") span.textContent = character;
      title.appendChild(span);
      return span;
    });

    if (reduceMotion.matches) {
      fragments.forEach(function (span) {
        span.classList.add("is-visible");
      });
      return;
    }

    title.__typewriterTimers = [];
    fragments.forEach(function (span, index) {
      var delay = 600 + index * 68;
      var timer = window.setTimeout(function () {
        var previous = title.querySelector(".is-current");
        if (previous) {
          previous.classList.remove("is-current");
          var previousCaret = previous.querySelector(".typewriter-caret");
          if (previousCaret) previousCaret.remove();
        }
        span.classList.add("is-visible");
        if (index < fragments.length - 1) {
          span.classList.add("is-current");
          var caret = document.createElement("i");
          caret.className = "typewriter-caret";
          caret.setAttribute("aria-hidden", "true");
          span.appendChild(caret);
        }
      }, delay);
      title.__typewriterTimers.push(timer);
    });
  }

  function syncHeroTypewriters() {
    heroSlides.forEach(runTypewriter);
  }

  if (heroSlides.length) {
    var heroClassObserver = new MutationObserver(syncHeroTypewriters);
    heroSlides.forEach(function (slide) {
      heroClassObserver.observe(slide, { attributes: true, attributeFilter: ["class"] });
    });
    syncHeroTypewriters();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function power2Out(value) {
    return 1 - Math.pow(1 - value, 2);
  }

  function power3Out(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function setMotionState(element, opacity, transform) {
    if (!element) return;
    element.style.opacity = String(opacity);
    element.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
    element.style.transform = transform;
  }

  function resetContinuousMotion() {
    setMotionState(typoOpen, 1, "none");
    setMotionState(typoCube, 1, "none");
    setMotionState(typoCopy, 1, "none");
    setMotionState(globalTechCopy, 1, "none");
    globalTechLogos.forEach(function (logo) {
      setMotionState(logo, 1, "none");
    });
  }

  function syncTypoMotion() {
    if (!typoSection || !typoOpen || !typoCube || !typoCopy) return;
    if (reduceMotion.matches) {
      resetContinuousMotion();
      return;
    }

    var rect = typoSection.getBoundingClientRect();
    var viewportHeight = window.innerHeight;
    var progress = clamp(
      (viewportHeight * 0.82 - rect.top) / (viewportHeight * 0.74),
      0,
      1,
    );
    var typeProgress = power3Out(progress);
    var scale = 0.45 + 1.05 * typeProgress;
    var copyProgress = power2Out(clamp((progress - 0.28) / 0.5, 0, 1));

    setMotionState(
      typoOpen,
      typeProgress,
      "translateX(" + -65 * (1 - typeProgress) + "%) scale(" + scale + ")",
    );
    setMotionState(
      typoCube,
      typeProgress,
      "translateX(" + 65 * (1 - typeProgress) + "%) scale(" + scale + ")",
    );
    setMotionState(
      typoCopy,
      copyProgress,
      "translateY(" + 44 * (1 - copyProgress) + "px)",
    );
  }

  function syncGlobalTechMotion() {
    if (!globalTechSection || !globalTechCopy || !globalTechLogos.length) return;
    if (reduceMotion.matches) {
      resetContinuousMotion();
      return;
    }

    var rect = globalTechSection.getBoundingClientRect();
    var viewportHeight = window.innerHeight;
    var progress = clamp(
      (viewportHeight * 0.78 - rect.top) / (viewportHeight * 0.44),
      0,
      1,
    );
    var timelineTime = progress * 1.12;
    var copyProgress = power2Out(clamp(timelineTime / 0.55, 0, 1));

    setMotionState(
      globalTechCopy,
      copyProgress,
      "translateY(" + 36 * (1 - copyProgress) + "px)",
    );

    globalTechLogos.forEach(function (logo, index) {
      var start = 0.22 + index * 0.08;
      var logoProgress = power2Out(clamp((timelineTime - start) / 0.5, 0, 1));
      setMotionState(
        logo,
        logoProgress,
        "translateY(" + 28 * (1 - logoProgress) + "px)",
      );
    });
  }

  function activateCapability(activeCard) {
    capabilityCards.forEach(function (card) {
      var active = card === activeCard;
      card.classList.toggle("is-active", active);
      if (active) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
    });
  }

  function syncCapabilities() {
    if (!capabilityCards.length) return;
    if (window.innerWidth <= 1100) return;

    var focusLine = window.innerHeight * 0.56;
    var middleCard = capabilityCards[1];
    var lastCard = capabilityCards[2];
    var activeCard = capabilityCards[0];

    if (lastCard && lastCard.getBoundingClientRect().top <= focusLine - 120) {
      activeCard = lastCard;
    } else if (middleCard && middleCard.getBoundingClientRect().top <= focusLine + 120) {
      activeCard = middleCard;
    }

    activateCapability(activeCard);
  }

  function resetCases() {
    if (!casesPanel || !casesSection) return;
    casesPanel.style.removeProperty("top");
    casesPanel.style.removeProperty("width");
    casesPanel.style.removeProperty("height");
    casesPanel.style.removeProperty("border-radius");
    casesSection.style.setProperty("--case-opening-opacity", "1");
    casesPanel.style.setProperty("--case-head-opacity", "1");
    casesPanel.style.setProperty("--case-head-y", "0px");
    casesPanel.style.setProperty("--case-content-opacity", "1");
    casesPanel.style.setProperty("--case-bg-opacity", "0.62");
    casesPanel.style.setProperty("--case-content-y", "0px");
  }

  function syncCases() {
    if (!casesPanel || !casesSection) return;
    if (window.innerWidth <= 1100 || reduceMotion.matches) {
      resetCases();
      return;
    }

    var rect = casesSection.getBoundingClientRect();
    var viewportHeight = window.innerHeight;
    var progress = clamp(-rect.top / 550, 0, 1);
    var startWidth = Math.min(800, window.innerWidth * 0.63);
    var panelWidth = startWidth + (window.innerWidth - startWidth) * progress;
    var headProgress = power2Out(clamp(progress / 0.2, 0, 1));
    var contentProgress = clamp((progress - 0.3) / 0.48, 0, 1);

    casesPanel.style.top = 64 * (1 - progress) + "%";
    casesPanel.style.width = panelWidth + "px";
    casesPanel.style.height = viewportHeight - 40 + 40 * progress + "px";
    casesPanel.style.borderRadius = 16 * (1 - progress) + "px";
    casesSection.style.setProperty(
      "--case-opening-opacity",
      String(1 - clamp(progress / 0.36, 0, 1)),
    );
    casesPanel.style.setProperty("--case-head-opacity", String(headProgress));
    casesPanel.style.setProperty("--case-head-y", 16 * (1 - headProgress) + "px");
    casesPanel.style.setProperty("--case-content-opacity", String(contentProgress));
    casesPanel.style.setProperty("--case-bg-opacity", String(contentProgress * 0.62));
    casesPanel.style.setProperty("--case-content-y", 20 * (1 - contentProgress) + "px");
  }

  function syncScrollState() {
    ticking = false;
    syncTypoMotion();
    syncCapabilities();
    syncGlobalTechMotion();
    syncCases();
  }

  function requestSync() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncScrollState);
  }

  capabilityCards.forEach(function (card) {
    card.addEventListener("pointerenter", function () {
      activateCapability(card);
    });
    card.addEventListener("focusin", function () {
      activateCapability(card);
    });
  });

  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync);
  reduceMotion.addEventListener("change", requestSync);
  requestSync();
})();
