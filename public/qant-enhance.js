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
  const STATIC = document.documentElement.classList.contains("qant-static");

  document.documentElement.classList.add("qant-enh");

  // TEMP diagnostic — report status on-page
  const dbg = document.getElementById("qant-debug");
  const setDbg = (m) => { if (dbg) dbg.textContent = m; };
  setDbg("enhance: RUNNING\ngsap=" + !!gsap + "  ScrollTrigger=" + !!ST +
         "\nLenis=" + !!window.Lenis + "\nreduce=" + reduce + "  static=" + STATIC);

  const B = window.__QANT_BEAM__ || (window.__QANT_BEAM__ = {});
  if (B.dampTarget == null) B.dampTarget = 1;

  if (!gsap || !ST) { setDbg("enhance STOPPED:\ngsap=" + !!gsap + " ScrollTrigger=" + !!ST + "\n(GSAP/ScrollTrigger did NOT load)"); return; }

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

  /* (Feature 1 — the big background beam — is coupled to scroll in the
     inline module via uNodeY; no DOM beam here.) */

  /* ============================================================
     SECTION ASSEMBLY — HARD. Every visible piece flies in from a big
     offset (120–240px down, ±80px across, ±9° rotated, scale .8), each
     on its OWN element trigger, scrub-coupled = reversible.
     ============================================================ */
  const PIECE_SEL = "h1,h2,h3,.eyebrow,.q-eyebrow,.reveal,.stat,.plist .cell,.stage,.card";
  document.querySelectorAll("section:not(.hero):not(#hero)").forEach((section) => {
    if (section.classList.contains("signature")) return; // chip composite stays put
    // collect candidates, drop any nested inside another candidate
    let pieces = [...section.querySelectorAll(PIECE_SEL)];
    pieces = pieces.filter((el) => !pieces.some((o) => o !== el && o.contains(el)));

    window.__QPIECES__ = (window.__QPIECES__ || 0) + pieces.length;
    pieces.forEach((piece, i) => {
      piece.classList.add("assemble-piece");
      gsap.fromTo(piece,
        {
          y: 120 + (i % 5) * 30,        // 120–240px down
          x: ((i % 3) - 1) * 80,        // -80, 0, +80
          rotation: ((i % 7) - 3) * 3,  // -9°..+9°
          scale: 0.8, opacity: 0,
        },
        {
          y: 0, x: 0, rotation: 0, scale: 1, opacity: 1, ease: "power3.out",
          scrollTrigger: { trigger: piece, start: "top 95%", end: "top 45%", scrub: 1 },
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

  /* ============================================================
     PINNED 3D CARD — drive assembly.html's internal scroll from the
     parent. Pin ~2.6 viewport; parent progress → iframe scrollTop, so
     the real photonic card assembles in slow motion (reversible).
     ============================================================ */
  const card3d = document.querySelector("#card3d");
  const frame = document.getElementById("card3dFrame");
  if (card3d && frame && !STATIC) {
    ST.create({
      trigger: card3d, start: "top top", end: "+=260%",
      pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate(self) {
        try {
          const w = frame.contentWindow, d = w && w.document;
          if (d && d.body) {
            const max = d.body.scrollHeight - w.innerHeight;
            if (max > 0) w.scrollTo(0, self.progress * max);
          }
        } catch (e) { /* iframe not ready yet */ }
      },
    });
  }

  ST.refresh();
  addEventListener("load", () => ST.refresh());

  setDbg("enhance: DONE ✓\ngsap=" + !!gsap + " ST=" + !!ST + " Lenis=" + !!window.Lenis +
         "\npieces animated=" + (window.__QPIECES__ || 0) +
         "\ntriggers=" + ST.getAll().length);
})();
