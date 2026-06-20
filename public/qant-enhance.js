/* ============================================================
   Q.ANT — enhancement runtime  (ADDITIVE / isolated)
   Feature-flagged: window.QANT_ENHANCE (default true).

   THE BEAM IS THE STORY. The scroll-scrubbed beam journey lives in
   the shader (driven by the page-progress keyframe map in the inline
   module). This file only does SERVING content motion (simple,
   reversible) + readability scrims. It must never out-shout the beam.
   ============================================================ */
(function () {
  "use strict";
  if (window.QANT_ENHANCE === false) return;

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "power3.out";

  document.documentElement.classList.add("qant-enh");

  const B = window.__QANT_BEAM__ || (window.__QANT_BEAM__ = {});
  if (B.dampTarget == null) B.dampTarget = 1;
  if (B.boostTarget == null) B.boostTarget = 1;
  if (B.nodeAddTarget == null) B.nodeAddTarget = 0;

  if (!gsap || !ST) return;

  /* ---- READABILITY: scrim + beam steps back behind active text ----
     (the numbers section is handled separately so its flare can read) */
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

  /* NUMBERS section: a strong radial scrim behind the numbers, faded in
     with the leap (peaks when the section is centred). Beam is free to
     flare; the scrim keeps 1,000 / 30× / 50× readable through it. */
  const proof = document.querySelector("#proof");
  const proofScrim = proof && proof.querySelector(".scrim");
  if (proof && proofScrim) {
    ST.create({
      trigger: proof, start: "top bottom", end: "bottom top", scrub: true,
      onUpdate(self) {
        const e = 1 - Math.abs(self.progress - 0.5) * 2; // triangular: 1 at centre
        proofScrim.style.opacity = Math.max(0, e).toFixed(3);
      },
    });
  }

  if (reduce) {
    document.querySelectorAll(".scrim").forEach((el) => el.classList.add("on"));
    const sl = document.querySelector("#sigLayer"); if (sl) sl.classList.add("show");
    document.querySelectorAll("#proof [data-count]").forEach((el) =>
      (el.textContent = (+el.dataset.count).toLocaleString("en-US") + (el.dataset.suffix || "")));
    return;
  }

  /* ---- HEADLINES: simple opacity + translateY, scrub, reversible ---- */
  document.querySelectorAll("[data-wipe]").forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, y: 30 }, {
      autoAlpha: 1, y: 0, ease: EASE,
      scrollTrigger: { trigger: el, start: "top 85%", end: "top 55%", scrub: true },
    });
  });
  /* body copy / eyebrows / small items keep a quiet reversible fade */
  document.querySelectorAll("section:not(#hero) .reveal").forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, y: 24 }, {
      autoAlpha: 1, y: 0, ease: EASE,
      scrollTrigger: { trigger: el, start: "top 86%", end: "top 60%", scrub: true },
    });
  });

  /* ---- IMAGES: gentle zoom-settle only (no fancy clip/parallax) ---- */
  document.querySelectorAll(".stage").forEach((stage) => {
    const img = stage.querySelector("img");
    if (!img) return;
    gsap.fromTo(img, { scale: 1.08 }, {
      scale: 1.0, ease: EASE,
      scrollTrigger: { trigger: stage, start: "top 90%", end: "top 45%", scrub: true },
    });
    if (stage.hasAttribute("data-lit"))
      ST.create({ trigger: stage, start: "top 70%", end: "bottom 30%",
        onToggle: (self) => stage.classList.toggle("lit", self.isActive) });
  });

  /* ---- background depth parallax stays (subtle) ---- */
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const isBg = el.classList.contains("bg-layer");
    const node = isBg ? el.querySelector("img") : el;
    if (!node) return;
    const amt = parseFloat(el.dataset.parallax) || 10;
    gsap.fromTo(node, { yPercent: -amt }, {
      yPercent: amt, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  /* ---- NUMBERS: scroll-coupled countup + scale/y; labels stagger ---- */
  if (proof) {
    proof.querySelectorAll(".stat").forEach((stat) => {
      const v = stat.querySelector(".v");
      const end = +v.dataset.count, suf = v.dataset.suffix || "", o = { v: 0 };
      const tl = gsap.timeline({
        scrollTrigger: { trigger: stat, start: "top 82%", end: "top 42%", scrub: true },
      });
      tl.fromTo(v, { scale: 0.85, y: 30, autoAlpha: 0.3 },
        { scale: 1, y: 0, autoAlpha: 1, ease: EASE }, 0);
      tl.to(o, { v: end, ease: "none",
        onUpdate: () => (v.textContent = Math.round(o.v).toLocaleString("en-US") + suf) }, 0);
      const label = stat.querySelector(".l");
      if (label) tl.fromTo(label, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, ease: EASE }, 0.12);
    });
  }

  /* ---- CARDS: staggered opacity + translateY, scrub ---- */
  const cards = document.querySelectorAll("#applications .card");
  if (cards.length) {
    gsap.fromTo(cards, { autoAlpha: 0, y: 60 }, {
      autoAlpha: 1, y: 0, ease: EASE, stagger: 0.06,
      scrollTrigger: { trigger: "#applications", start: "top 78%", end: "top 38%", scrub: true },
    });
  }
  /* problem cells: same simple staggered rise */
  const cells = document.querySelectorAll("#problem .plist .cell");
  if (cells.length) {
    gsap.fromTo(cells, { autoAlpha: 0, y: 40 }, {
      autoAlpha: 1, y: 0, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: "#problem .plist", start: "top 84%", end: "top 50%", scrub: true },
    });
  }

  /* ---- SIGNATURE composite: just reveal the product render in view ---- */
  const sig = document.querySelector("#signature");
  const sigLayer = document.querySelector("#sigLayer");
  if (sig && sigLayer) {
    ST.create({
      trigger: sig, start: "top 65%", end: "bottom 35%",
      onToggle: (self) => sigLayer.classList.toggle("show", self.isActive),
    });
  }

  ST.refresh();
  addEventListener("load", () => ST.refresh());
})();
