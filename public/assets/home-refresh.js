(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hero = document.querySelector(".home-page .hero");
  var heroSlides = hero ? Array.from(hero.querySelectorAll(".hslide")) : [];
  var revealTargets = document.querySelectorAll(".typo-section, .global-tech-section");
  var capabilityCards = Array.from(document.querySelectorAll(".capability-card"));
  var casesSection = document.querySelector(".home-cases-section");
  var casesPanel = document.querySelector(".home-cases-panel");
  var ticking = false;

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
      var span = document.createElement("span");
      span.className = "typewriter-character";
      span.textContent = character;
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

    if (lastCard && lastCard.getBoundingClientRect().top <= focusLine - 100) {
      activeCard = lastCard;
    } else if (middleCard && middleCard.getBoundingClientRect().top <= focusLine + 100) {
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
    var start = viewportHeight * 0.78;
    var progress = clamp((start - rect.top) / (viewportHeight * 0.78), 0, 1);
    var startWidth = Math.min(800, window.innerWidth * 0.63);
    var panelWidth = startWidth + (window.innerWidth - startWidth) * progress;
    var contentProgress = clamp((progress - 0.3) / 0.48, 0, 1);

    casesPanel.style.top = 64 * (1 - progress) + "%";
    casesPanel.style.width = panelWidth + "px";
    casesPanel.style.height = viewportHeight - 40 + 40 * progress + "px";
    casesPanel.style.borderRadius = 16 * (1 - progress) + "px";
    casesSection.style.setProperty(
      "--case-opening-opacity",
      String(1 - clamp(progress / 0.36, 0, 1)),
    );
    casesPanel.style.setProperty("--case-content-opacity", String(contentProgress));
    casesPanel.style.setProperty("--case-bg-opacity", String(contentProgress * 0.62));
    casesPanel.style.setProperty("--case-content-y", 20 * (1 - contentProgress) + "px");
  }

  function syncScrollState() {
    ticking = false;
    syncCapabilities();
    syncCases();
  }

  function requestSync() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(syncScrollState);
  }

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.2 },
    );
    revealTargets.forEach(function (target) {
      observer.observe(target);
    });
  } else {
    revealTargets.forEach(function (target) {
      target.classList.add("is-visible");
    });
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
