/* ============================================================
   Q.ANT — 50k enhancement runtime  (ADDITIVE / isolated)
   Feature-flagged: window.QANT_ENHANCE (default true).

   The render loop owns the beam uniforms; this file only sets
   *targets* on window.__QANT_BEAM__. Everything below is the
   scroll choreography: every animation is scrub-coupled or
   play/reverse, so the page lives in BOTH scroll directions.
   ============================================================ */
(function () {
  "use strict";
  if (window.QANT_ENHANCE === false) return;

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STATIC = document.documentElement.classList.contains("qant-static");
  const wide = matchMedia("(min-width: 1024px)").matches && !STATIC;
  const EASE = "power3.out";

  document.documentElement.classList.add("qant-enh");

  const B = window.__QANT_BEAM__ || (window.__QANT_BEAM__ = {});
  if (B.dampTarget == null) B.dampTarget = 1;
  if (B.boostTarget == null) B.boostTarget = 1;
  if (B.nodeAddTarget == null) B.nodeAddTarget = 0;

  if (!gsap || !ST) return;

  /* ---- READABILITY: scrim + beam steps back behind active text ---- */
  let activeText = 0;
  document.querySelectorAll("[data-readable]").forEach((block) => {
    const scrim = block.querySelector(".scrim");
    ST.create({
      trigger: block, start: "top 72%", end: "bottom 28%",
      onToggle(self) {
        if (scrim) scrim.classList.toggle("on", self.isActive);
        activeText += self.isActive ? 1 : -1;
        if (activeText < 0) activeText = 0;
        B.dampTarget = activeText > 0 ? 0.42 : 1;
      },
    });
  });

  /* SCHRITT 1 — calm ONLY the numbers section: cap energy + bloom there */
  const proof = document.querySelector("#proof");
  if (proof) {
    ST.create({
      trigger: proof, start: "top 85%", end: "bottom 15%",
      onToggle(self) {
        B.energyCap = self.isActive ? 0.5 : null;
        B.bloomCap = self.isActive ? 0.6 : null;
      },
    });
  }

  if (reduce) {
    document.querySelectorAll(".scrim").forEach((el) => el.classList.add("on"));
    const sl = document.querySelector("#sigLayer"); if (sl) sl.classList.add("show");
    document.querySelectorAll("#proof [data-count]").forEach((el) =>
      (el.textContent = (+el.dataset.count).toLocaleString("en-US") + (el.dataset.suffix || "")));
    return; // everything static, no triggers
  }

  /* ============================================================
     A) HEADLINES — mechanical split-text reveal (word by word)
     overflow:hidden masks + translateY, scrub-coupled + stagger.
     Scroll back = words slide back down. em markup preserved.
     ============================================================ */
  const splitHeadline = (el) => {
    if (el.dataset.split === "done") return [];
    const frag = document.createDocumentFragment();
    const inners = [];
    const addWord = (content, isEl) => {
      const mask = document.createElement("span"); mask.className = "word-mask";
      const inner = document.createElement("span"); inner.className = "word-in";
      if (isEl) inner.appendChild(content); else inner.textContent = content;
      mask.appendChild(inner); frag.appendChild(mask); inners.push(inner);
    };
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((tok) => {
          if (tok === "") return;
          if (!tok.trim()) frag.appendChild(document.createTextNode(tok));
          else addWord(tok, false);
        });
      } else if (node.nodeType === 1) {
        addWord(node.cloneNode(true), true);
      }
    });
    el.innerHTML = ""; el.appendChild(frag); el.dataset.split = "done";
    return inners;
  };

  document.querySelectorAll("[data-wipe]").forEach((el) => {
    const inners = splitHeadline(el);
    if (!inners.length) return;
    gsap.fromTo(inners, { yPercent: 115 }, {
      yPercent: 0, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 82%", end: "top 50%", scrub: true },
    });
  });

  /* ============================================================
     B) IMAGES — cinematic clip reveal + counter-parallax + zoom-settle
     (non-bento; bento gets the horizontal pin treatment below)
     ============================================================ */
  document.querySelectorAll(".stage").forEach((stage) => {
    if (stage.closest("#applications")) return;
    const img = stage.querySelector("img");
    gsap.fromTo(stage, { clipPath: "inset(0 0 100% 0)" }, {
      clipPath: "inset(0 0 0% 0)", ease: EASE,
      scrollTrigger: { trigger: stage, start: "top 88%", end: "top 46%", scrub: true },
    });
    if (img) {
      gsap.fromTo(img, { scale: 1.12 }, {
        scale: 1.0, ease: EASE,
        scrollTrigger: { trigger: stage, start: "top 88%", end: "top 46%", scrub: true },
      });
      if (!STATIC) {
        gsap.fromTo(img, { yPercent: -12 }, {
          yPercent: 12, ease: "none",
          scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
    }
    stage.hasAttribute("data-lit") && ST.create({
      trigger: stage, start: "top 70%", end: "bottom 30%",
      onToggle: (self) => stage.classList.toggle("lit", self.isActive),
    });
  });

  /* keep the bg-layer + principle-media depth parallax */
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const isBg = el.classList.contains("bg-layer");
    const node = isBg ? el.querySelector("img") : el;
    if (!node) return;
    const amt = parseFloat(el.dataset.parallax) || 12;
    gsap.fromTo(node, { yPercent: -amt }, {
      yPercent: amt, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  /* ============================================================
     E) PROBLEM CELLS — staggered rise + a hairline that draws in
     ============================================================ */
  const cells = document.querySelectorAll("#problem .plist .cell");
  if (cells.length) {
    gsap.fromTo(cells, { yPercent: 18, autoAlpha: 0 }, {
      yPercent: 0, autoAlpha: 1, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: "#problem .plist", start: "top 82%", end: "top 48%", scrub: true },
    });
    gsap.fromTo(cells, { "--cd": 0 }, {
      "--cd": 1, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: "#problem .plist", start: "top 80%", end: "top 45%", scrub: true },
    });
  }

  /* principle step dividers draw in (accent, reversible) */
  gsap.utils.toArray(".principle .pstep").forEach((el) => {
    gsap.fromTo(el, { "--d": 0 }, {
      "--d": 1, ease: EASE,
      scrollTrigger: { trigger: el, start: "top 88%", end: "top 60%", scrub: true },
    });
  });

  /* ============================================================
     C) NUMBERS — scroll-coupled count + scale + y; labels stagger
     ============================================================ */
  const fmtCount = (el) => ({ el, end: +el.dataset.count, suf: el.dataset.suffix || "", o: { v: 0 } });

  if (proof && wide) {
    const stats = proof.querySelectorAll(".stat .v");
    const labels = proof.querySelectorAll(".stat .l");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: proof, start: "top top", end: "+=140%",
        scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });
    // faint background lift only (capped to ≤0.5 / bloom ≤0.6 by the cap ST)
    tl.fromTo(B, { boostTarget: 1 }, { boostTarget: 1.35, ease: "power2.inOut", duration: 0.5 }, 0)
      .to(B, { boostTarget: 1, ease: "power2.inOut", duration: 0.5 }, 0.5);
    tl.fromTo(B, { disruptBoost: 0 }, { disruptBoost: 0.3, ease: "power1.inOut", duration: 0.5 }, 0)
      .to(B, { disruptBoost: 0, ease: "power1.inOut", duration: 0.5 }, 0.5);
    tl.fromTo(stats, { scale: 0.85, y: 30, autoAlpha: 0.3 },
      { scale: 1, y: 0, autoAlpha: 1, ease: EASE, stagger: 0.06, duration: 0.55 }, 0.05);
    tl.fromTo(labels, { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, ease: EASE, stagger: 0.06, duration: 0.5 }, 0.18);
    proof.querySelectorAll("[data-count]").forEach((el) => {
      const c = fmtCount(el);
      tl.to(c.o, { v: c.end, ease: "none", duration: 0.6,
        onUpdate: () => (c.el.textContent = Math.round(c.o.v).toLocaleString("en-US") + c.suf) }, 0.05);
    });
  } else if (proof) {
    proof.querySelectorAll(".stat").forEach((stat) => {
      const c = fmtCount(stat.querySelector(".v"));
      gsap.timeline({ scrollTrigger: { trigger: stat, start: "top 85%", end: "top 45%", scrub: true } })
        .fromTo(stat, { y: 30, autoAlpha: 0.3 }, { y: 0, autoAlpha: 1, ease: EASE })
        .to(c.o, { v: c.end, ease: "none",
          onUpdate: () => (c.el.textContent = Math.round(c.o.v).toLocaleString("en-US") + c.suf) }, 0);
    });
  }

  /* ---- SIGNATURE — beam erupts (toned) from the real chip ---- */
  const sig = document.querySelector("#signature");
  const sigLayer = document.querySelector("#sigLayer");
  if (sig && sigLayer) {
    const flash = sigLayer.querySelector(".sig-flash");
    const fire = () => {
      sigLayer.classList.add("show");
      gsap.to(B, { boostTarget: 1.32, duration: 0.9, ease: "power2.out", overwrite: true });
      if (flash) gsap.fromTo(flash, { opacity: 0 }, { opacity: 0.45, duration: 0.6, ease: "power2.out",
        onComplete: () => gsap.to(flash, { opacity: 0.2, duration: 1.4, ease: "power2.inOut" }) });
    };
    const settle = () => {
      sigLayer.classList.remove("show");
      gsap.to(B, { boostTarget: 1, duration: 0.7, ease: "power2.out", overwrite: true });
      if (flash) gsap.to(flash, { opacity: 0, duration: 0.8 });
    };
    ST.create({ trigger: sig, start: "top 65%", end: "bottom 35%",
      onEnter: fire, onEnterBack: fire, onLeave: settle, onLeaveBack: settle });
    gsap.fromTo(B, { nodeAddTarget: -0.025 }, { nodeAddTarget: 0.025, ease: "none",
      scrollTrigger: { trigger: sig, start: "top bottom", end: "bottom top", scrub: 0.6 } });
  }

  /* ============================================================
     THE VERTICAL LIGHT-TRAIL (lively again) — behind the content
     ============================================================ */
  let branchEl = null;
  if (!STATIC) {
    const trail = document.createElement("div");
    trail.className = "beam-trail"; trail.setAttribute("aria-hidden", "true");
    trail.innerHTML = '<div class="bt-line"></div><div class="bt-branch"><i></i><i></i></div><div class="bt-head"></div>';
    document.body.appendChild(trail);
    branchEl = trail.querySelector(".bt-branch");
    ST.create({
      trigger: "#main", start: "top top", end: "bottom bottom", scrub: 0.8,
      onUpdate(self) {
        const p = self.progress;
        trail.style.setProperty("--bx", (Math.sin(p * Math.PI * 3.0) * 12).toFixed(2) + "vw");
        const v = Math.min(Math.abs(self.getVelocity()) / 2600, 1);
        const fadeIn = Math.min(p / 0.06, 1);
        trail.style.setProperty("--bv", ((0.28 + v * 0.6) * fadeIn).toFixed(3));
      },
    });
    const principle = document.querySelector("#principle");
    if (principle) {
      ST.create({
        trigger: principle, start: "top 75%", end: "bottom 50%",
        onToggle: (self) => branchEl.classList.toggle("on", self.isActive),
        onUpdate: (self) => branchEl.style.setProperty("--split",
          Math.sin(Math.min(Math.max(self.progress, 0), 1) * Math.PI).toFixed(3)),
      });
    }
  }

  /* ============================================================
     D + F) APPLICATIONS — horizontal pin; cards glide in with depth
     ============================================================ */
  if (wide) {
    try {
      const apps = document.querySelector("#applications");
      const track = apps && apps.querySelector(".bento");
      if (apps && track) {
        apps.classList.add("pinmode");
        const distance = () => Math.max(0, track.scrollWidth - innerWidth + 120);
        const horiz = gsap.to(track, { x: () => -distance(), ease: "none",
          scrollTrigger: { trigger: apps, start: "top top", end: () => "+=" + distance(),
            scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
        track.querySelectorAll(".card").forEach((card) => {
          gsap.fromTo(card, { yPercent: 14, rotateX: 5, scale: 0.94, autoAlpha: 0.3 },
            { yPercent: 0, rotateX: 0, scale: 1, autoAlpha: 1, ease: EASE,
              scrollTrigger: { trigger: card, containerAnimation: horiz, start: "left 92%", end: "left 55%", scrub: true } });
          gsap.fromTo(card, { "--glow": 0 }, { "--glow": 1, ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: horiz, start: "left 80%", end: "left 50%", scrub: true } });
        });
      }
    } catch (e) { console.warn("[qant] applications pin disabled:", e); }
  } else {
    // non-pin fallback: cards still rise in, staggered + reversible
    gsap.fromTo("#applications .card", { yPercent: 12, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, ease: EASE, stagger: 0.08,
        scrollTrigger: { trigger: "#applications", start: "top 78%", end: "top 40%", scrub: true } });
  }

  /* ============================================================
     G) SECTION TRANSITIONS — cinematic overlap (parallax-out)
     Outgoing section drifts up + softens as it leaves the top.
     ============================================================ */
  if (!STATIC) {
    document.querySelectorAll("main > section").forEach((sec) => {
      if (sec.id === "proof" || sec.id === "applications" || sec.classList.contains("signature")) return;
      const inner = sec.querySelector(".wrap, .q-wrap") || sec;
      gsap.to(inner, { yPercent: -7, autoAlpha: 0.55, ease: "none",
        scrollTrigger: { trigger: sec, start: "bottom 78%", end: "bottom top", scrub: true } });
    });
  }

  ST.refresh();
  addEventListener("load", () => ST.refresh());
})();
