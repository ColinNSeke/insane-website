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
        B.dampTarget = activeText > 0 ? 0.7 : 1;
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
    if (section.classList.contains("signature") || section.id === "descent") return; // own animation
    // collect candidates, drop any nested inside another candidate
    let pieces = [...section.querySelectorAll(PIECE_SEL)];
    pieces = pieces.filter((el) => !pieces.some((o) => o !== el && o.contains(el)));

    window.__QPIECES__ = (window.__QPIECES__ || 0) + pieces.length;
    pieces.forEach((piece, i) => {
      piece.classList.add("assemble-piece");
      gsap.fromTo(piece,
        {
          y: 150 + (i % 5) * 40,         // 150–310px down
          x: ((i % 3) - 1) * 120,        // -120, 0, +120
          z: -400,                       // comes forward from depth
          rotationX: 22,                 // 3D flip-in (flying)
          rotation: ((i % 7) - 3) * 4,   // -12°..+12°
          scale: 0.82, opacity: 0,
          transformPerspective: 900, transformOrigin: "50% 100%",
        },
        {
          y: 0, x: 0, z: 0, rotationX: 0, rotation: 0, scale: 1, opacity: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: piece, start: "top 96%", end: "top 42%", scrub: 1 },
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
     SIGNATURE DESCENT — pinned dive through the real renders. Each
     layer fades in small, scales up and fades out as you pass through
     it; the next is already arriving → a continuous push into the
     light. scrub-coupled = reversible.
     ============================================================ */
  const descent = document.querySelector("#descent");
  if (descent && !STATIC) {
    const layers = descent.querySelectorAll(".layer");
    const cap = descent.querySelector(".descent-cap");
    gsap.set(layers, { autoAlpha: 0, scale: 0.65, transformOrigin: "50% 50%" });
    gsap.set(layers[0], { autoAlpha: 1, scale: 1.05 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: descent, start: "top top", end: "+=320%",
        pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
    });
    layers.forEach((layer, i) => {
      const at = i * 0.8;
      if (i > 0) tl.fromTo(layer, { autoAlpha: 0, scale: 0.65 },
        { autoAlpha: 1, scale: 1.05, ease: "power1.out", duration: 0.5 }, at);
      // last layer stays (we end inside the light), others zoom past + fade
      tl.to(layer, { scale: 1.9, autoAlpha: i === layers.length - 1 ? 1 : 0,
        ease: "power1.in", duration: 0.6 }, at + 0.45);
    });
    if (cap) tl.fromTo(cap, { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: -40, ease: "power1.in", duration: 0.6 }, 0.35);
  }

  /* ============================================================
     CUSTOM LIGHT CURSOR — a bright dot + a lagging ring that grows
     over interactive elements. Desktop fine-pointer only.
     ============================================================ */
  if (!STATIC && matchMedia("(pointer:fine)").matches) {
    const dot = document.createElement("div"); dot.id = "qant-cursor";
    const ring = document.createElement("div"); ring.id = "qant-cursor-ring";
    document.body.append(dot, ring);
    document.documentElement.classList.add("qant-cursor-on");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
    }, { passive: true });
    (function ring_loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(ring_loop);
    })();
    const grow = () => ring.classList.add("grow");
    const shrink = () => ring.classList.remove("grow");
    document.querySelectorAll("a,button,.btn,.nav-cta,.card,.stage,.stat").forEach((el) => {
      el.addEventListener("pointerenter", grow);
      el.addEventListener("pointerleave", shrink);
    });
  }

  ST.refresh();
  addEventListener("load", () => ST.refresh());

  setDbg("enhance: DONE ✓\ngsap=" + !!gsap + " ST=" + !!ST + " Lenis=" + !!window.Lenis +
         "\npieces animated=" + (window.__QPIECES__ || 0) +
         "\ntriggers=" + ST.getAll().length);
})();
