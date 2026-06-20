/* ============================================================
   Q.ANT — enhancement runtime  (ADDITIVE / isolated)
   Feature-flagged: window.QANT_ENHANCE (default true).

   Exactly two features (hero beam / shader untouched):
   1) vertical scroll-beam down the left edge
   2) section "assembly": pieces fly into place on scroll (scrub)
   + the readability scrims and the number count-up are kept so text
   stays legible and the stats don't sit at 0.
   ============================================================ */
(function () {
  "use strict";
  if (window.QANT_ENHANCE === false) return;

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("qant-enh");

  const B = window.__QANT_BEAM__ || (window.__QANT_BEAM__ = {});
  if (B.dampTarget == null) B.dampTarget = 1;

  if (!gsap || !ST) return;

  /* ---- readability: scrim + beam steps back behind active text ---- */
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
    // both features off; show content + final numbers
    document.querySelectorAll(".scrim").forEach((el) => el.classList.add("on"));
    const sb = document.getElementById("scroll-beam"); if (sb) sb.style.display = "none";
    const sl = document.querySelector("#sigLayer"); if (sl) sl.classList.add("show");
    document.querySelectorAll("#proof [data-count]").forEach((el) =>
      (el.textContent = (+el.dataset.count).toLocaleString("en-US") + (el.dataset.suffix || "")));
    return;
  }

  /* ============================================================
     FEATURE 1 — vertical scroll-beam (left edge)
     ============================================================ */
  const head = document.getElementById("beam-head");
  const trail = document.getElementById("beam-trail");
  if (head && trail) {
    ST.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      onUpdate: (self) => {
        const p = self.progress;
        head.style.top = (p * 100) + "%";
        head.style.opacity = Math.min(1, p * 8);   // fade in once scrolling starts
        trail.style.height = (p * 100) + "%";
      },
    });
  }

  /* ============================================================
     FEATURE 2 — section assembly (scrub, reversible)
     Tag the content elements of each non-hero section as pieces,
     scatter them (seeded-random), fly them into place on scroll.
     ============================================================ */
  const PIECE_SEL = "h1,h2,.eyebrow,.q-eyebrow,.reveal,.stat,.plist .cell,.stage,.card";
  document.querySelectorAll("section:not(.hero):not(#hero)").forEach((section) => {
    if (section.classList.contains("signature")) return; // chip composite stays put
    // collect candidates, drop any nested inside another candidate
    let pieces = [...section.querySelectorAll(PIECE_SEL)];
    pieces = pieces.filter((el) => !pieces.some((o) => o !== el && o.contains(el)));
    pieces.forEach((piece) => piece.classList.add("assemble-piece"));

    pieces.forEach((piece, i) => {
      const seed = i * 7 + 13;
      const randX = Math.sin(seed) * 100;                       // -100..+100
      const randY = 60 + Math.abs(Math.cos(seed) * 80);         // 60..140
      const randR = Math.sin(seed * 3) * 6;                     // -6..+6 deg
      const randS = 0.88 + Math.abs(Math.cos(seed * 2)) * 0.1;  // 0.88..0.98

      gsap.set(piece, { x: randX, y: randY, rotation: randR, scale: randS, opacity: 0 });
      gsap.to(piece, {
        x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 85%", end: "top 20%", scrub: 1.2 },
      });
    });
  });

  /* numbers count up while assembling (down on reverse) */
  document.querySelectorAll("#proof .stat").forEach((stat) => {
    const v = stat.querySelector(".v");
    const end = +v.dataset.count, suf = v.dataset.suffix || "", o = { v: 0 };
    gsap.to(o, {
      v: end, ease: "none",
      onUpdate: () => (v.textContent = Math.round(o.v).toLocaleString("en-US") + suf),
      scrollTrigger: { trigger: stat, start: "top 85%", end: "top 25%", scrub: 1.2 },
    });
  });

  /* keep the signature chip composite + image grade lift (existing) */
  const sig = document.querySelector("#signature");
  const sigLayer = document.querySelector("#sigLayer");
  if (sig && sigLayer)
    ST.create({ trigger: sig, start: "top 65%", end: "bottom 35%",
      onToggle: (self) => sigLayer.classList.toggle("show", self.isActive) });
  document.querySelectorAll(".stage[data-lit]").forEach((stage) =>
    ST.create({ trigger: stage, start: "top 70%", end: "bottom 30%",
      onToggle: (self) => stage.classList.toggle("lit", self.isActive) }));

  ST.refresh();
  addEventListener("load", () => ST.refresh());
})();
