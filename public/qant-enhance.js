/* ============================================================
   Q.ANT — enhancement runtime  (ADDITIVE / isolated)
   Feature-flagged: window.QANT_ENHANCE (default true).

   The HERO beam / shader is NOT touched. This file adds two things:
   1) a vertical side-beam that flows down the left edge with scroll
   2) section "assembly": scattered pieces fly into place as the beam
      head reaches them (scrub-coupled, reversible).
   Plus the readability scrims. reduced-motion → all off.
   ============================================================ */
(function () {
  "use strict";
  if (window.QANT_ENHANCE === false) return;

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STATIC = document.documentElement.classList.contains("qant-static");
  const small = matchMedia("(max-width: 860px)").matches;
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
        B.dampTarget = activeText > 0 ? 0.5 : 1;
      },
    });
  });

  if (reduce) {
    document.querySelectorAll(".scrim").forEach((el) => el.classList.add("on"));
    const sl = document.querySelector("#sigLayer"); if (sl) sl.classList.add("show");
    document.querySelectorAll("#proof [data-count]").forEach((el) =>
      (el.textContent = (+el.dataset.count).toLocaleString("en-US") + (el.dataset.suffix || "")));
    return; // no side-beam, no assembly
  }

  /* ============================================================
     THE VERTICAL SIDE-BEAM — drips from the hero beam, flows the
     left edge with scroll. Pure DOM; CSS reads --p (smoothed by
     the scrub). Not rendered on the mobile static fallback.
     ============================================================ */
  const sideBeam = document.querySelector("#sideBeam");
  if (sideBeam && !STATIC) {
    ST.create({
      trigger: "#main", start: "top top", end: "bottom bottom", scrub: 0.8,
      onUpdate: (self) => sideBeam.style.setProperty("--p", self.progress.toFixed(4)),
    });
  } else if (sideBeam) {
    sideBeam.style.display = "none";
  }

  /* ============================================================
     SECTION ASSEMBLY — pieces start scattered (seeded-random per
     element) and fly to their layout spot as the section enters.
     scrub-coupled, staggered top→down, reversible.
     ============================================================ */
  const rand = (s) => { const x = Math.sin(s * 99.137) * 43758.545; return x - Math.floor(x); };

  // split each section headline into word spans (preserve <em>)
  const splitHeadline = (el) => {
    if (el.dataset.split === "done") return;
    const frag = document.createDocumentFragment();
    const add = (content, isEl) => {
      const mask = document.createElement("span"); mask.className = "asm-word";
      if (isEl) mask.appendChild(content); else mask.textContent = content;
      frag.appendChild(mask);
    };
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((tok) => {
          if (tok === "") return;
          if (!tok.trim()) frag.appendChild(document.createTextNode(tok));
          else add(tok, false);
        });
      } else if (node.nodeType === 1) { add(node.cloneNode(true), true); }
    });
    el.innerHTML = ""; el.appendChild(frag); el.dataset.split = "done";
  };
  document.querySelectorAll("[data-wipe]").forEach(splitHeadline);

  // amplitude — gentler on small screens
  const AX = small ? 40 : 110, AY = small ? 50 : 130, AR = small ? 3 : 7;

  let seedBase = 0;
  document.querySelectorAll("main > section").forEach((sec) => {
    if (sec.id === "hero" || sec.classList.contains("signature")) return;

    // collect pieces, drop any nested inside another piece (e.g. bento .stage)
    let pieces = [...sec.querySelectorAll(".asm-word, .reveal, .stat, .cell, .card, .stage")];
    pieces = pieces.filter((el) => !pieces.some((o) => o !== el && o.contains(el)));
    if (!pieces.length) return;

    pieces.forEach((el, i) => {
      const s = seedBase + i;
      gsap.set(el, {
        xPercent: 0, x: (rand(s) * 2 - 1) * AX,
        y: AY * (0.4 + rand(s + 1) * 0.7),
        rotation: (rand(s + 2) * 2 - 1) * AR,
        scale: 0.88 + rand(s + 3) * 0.07,
        autoAlpha: 0, transformOrigin: "50% 50%",
      });
    });
    seedBase += pieces.length + 7;

    gsap.to(pieces, {
      x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, ease: EASE, stagger: 0.05,
      scrollTrigger: { trigger: sec, start: "top 80%", end: "top 32%", scrub: true },
    });
  });

  /* numbers count up WHILE flying in (and back down on reverse) */
  document.querySelectorAll("#proof .stat").forEach((stat) => {
    const v = stat.querySelector(".v");
    const end = +v.dataset.count, suf = v.dataset.suffix || "", o = { v: 0 };
    gsap.to(o, {
      v: end, ease: "none",
      onUpdate: () => (v.textContent = Math.round(o.v).toLocaleString("en-US") + suf),
      scrollTrigger: { trigger: stat, start: "top 80%", end: "top 38%", scrub: true },
    });
  });

  /* image grade lift + signature composite (kept, subtle, reversible) */
  document.querySelectorAll(".stage[data-lit]").forEach((stage) =>
    ST.create({ trigger: stage, start: "top 70%", end: "bottom 30%",
      onToggle: (self) => stage.classList.toggle("lit", self.isActive) }));

  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const isBg = el.classList.contains("bg-layer");
    const node = isBg ? el.querySelector("img") : el;
    if (!node) return;
    const amt = parseFloat(el.dataset.parallax) || 10;
    gsap.fromTo(node, { yPercent: -amt }, { yPercent: amt, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });

  const sig = document.querySelector("#signature");
  const sigLayer = document.querySelector("#sigLayer");
  if (sig && sigLayer) {
    ST.create({ trigger: sig, start: "top 65%", end: "bottom 35%",
      onToggle: (self) => sigLayer.classList.toggle("show", self.isActive) });
  }

  ST.refresh();
  addEventListener("load", () => ST.refresh());
})();
