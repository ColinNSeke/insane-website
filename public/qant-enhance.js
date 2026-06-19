/* ============================================================
   Q.ANT — 50k enhancement runtime  (ADDITIVE / isolated)
   Feature-flagged: window.QANT_ENHANCE (default true).
   Talks to the existing beam through window.__QANT_BEAM__
   (uniforms exposed by the page) WITHOUT rewriting the tested
   shader or the existing scroll runtime. It only:
     · dims the beam + raises a soft scrim behind active text
     · reveals / parallaxes / ken-burns the staged imagery
     · orchestrates the signature "beam from the chip" moment
   Everything degrades for reduced-motion and the mobile
   (static-hero) fallback.
   ============================================================ */
(function () {
  "use strict";

  if (window.QANT_ENHANCE === false) return;

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STATIC = document.documentElement.classList.contains("qant-static");

  document.documentElement.classList.add("qant-enh");

  /* ---- shared beam control ----------------------------------
     The page's scroll runtime writes uEnergy / uNodeY every
     scroll tick AND mirrors them into B.baseEnergy / B.baseNodeY.
     We layer multiplicative damp + boost on top, smoothed in our
     own rAF so it holds even when the user stops scrolling. */
  const ctl = {
    dampT: 1, damp: 1,        // <1 => beam steps back behind text
    boostT: 1, boost: 1,      // >1 => signature / stat pulse
    nodeAddT: 0, nodeAdd: 0,  // vertical nudge to align the node
  };
  let activeText = 0;

  function waitForBeam(cb, tries) {
    tries = tries || 0;
    if (window.__QANT_BEAM__ && window.__QANT_BEAM__.U) return cb(window.__QANT_BEAM__);
    if (tries > 120) return; // ~2s; beam may be disabled — features still degrade fine
    requestAnimationFrame(() => waitForBeam(cb, tries + 1));
  }

  if (!reduce && !STATIC) {
    waitForBeam((B) => {
      const baseBloom = B.bloom ? B.bloom.strength : 0;
      function tick() {
        ctl.damp += (ctl.dampT - ctl.damp) * 0.07;
        ctl.boost += (ctl.boostT - ctl.boost) * 0.06;
        ctl.nodeAdd += (ctl.nodeAddT - ctl.nodeAdd) * 0.06;
        const baseE = B.baseEnergy != null ? B.baseEnergy : B.U.uEnergy.value;
        const baseN = B.baseNodeY != null ? B.baseNodeY : B.U.uNodeY.value;
        B.U.uEnergy.value = baseE * ctl.damp * ctl.boost;
        B.U.uNodeY.value = baseN + ctl.nodeAdd;
        if (B.bloom) B.bloom.strength = baseBloom + (ctl.boost - 1) * 0.9;
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  if (!gsap || !ST) return; // reveals need GSAP; bail quietly if absent

  /* ============================================================
     PRIO 1 — READABILITY
     Each [data-readable] block raises a feathered radial scrim
     and asks the beam to step back while it sits in the reading
     band. Never a hard box; the beam dims, the text stays crisp.
     ============================================================ */
  function setDamp() {
    ctl.dampT = activeText > 0 ? 0.42 : 1;
  }
  document.querySelectorAll("[data-readable]").forEach((block) => {
    const scrim = block.querySelector(".scrim");
    ST.create({
      trigger: block,
      start: "top 72%",
      end: "bottom 28%",
      onToggle(self) {
        if (scrim) scrim.classList.toggle("on", self.isActive);
        activeText += self.isActive ? 1 : -1;
        if (activeText < 0) activeText = 0;
        setDamp();
      },
    });
  });

  if (reduce) {
    // freeze everything open and stop here
    document.querySelectorAll(".stage--reveal,.kb").forEach((el) => el.classList.add("in"));
    document.querySelectorAll(".scrim").forEach((el) => el.classList.add("on"));
    const sl = document.querySelector("#sigLayer"); if (sl) sl.classList.add("show");
    document.querySelectorAll("[data-split]").forEach((h) => {
      h.innerHTML = h.textContent.replace(/\*(.+?)\*/g, "<em>$1</em>");
    });
    return;
  }

  /* ============================================================
     PRIO 2 — STAGED IMAGERY
     clip-path reveals, ken-burns on dwell, gentle parallax,
     duotone -> colour as a card scrolls into view.
     ============================================================ */
  document.querySelectorAll(".stage--reveal, .kb").forEach((el) => {
    ST.create({
      trigger: el,
      start: "top 82%",
      onEnter: () => el.classList.add("in"),
    });
  });
  document.querySelectorAll(".stage[data-lit]").forEach((el) => {
    ST.create({
      trigger: el,
      start: "top 70%",
      end: "bottom 30%",
      onToggle: (self) => el.classList.toggle("lit", self.isActive),
    });
  });

  // parallax on full-bleed backgrounds and tagged images
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const img = el.querySelector("img") || el;
    const amt = parseFloat(el.dataset.parallax) || 12;
    gsap.fromTo(
      img,
      { yPercent: -amt },
      {
        yPercent: amt,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  /* ============================================================
     PRIO 4 — KINETIC STATEMENT
     Word-by-word reveal for the oversized typographic moment.
     (The existing count-up stats stay untouched; we only sync a
     beam pulse to them below.)
     ============================================================ */
  document.querySelectorAll("[data-split]").forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.textContent = "";
    const spans = [];
    words.forEach((w, i) => {
      const wrap = document.createElement("span");
      wrap.className = "word";
      const inner = document.createElement("span");
      inner.innerHTML = w.replace(/\*(.+?)\*/g, "<em>$1</em>"); // *italics*
      wrap.appendChild(inner);
      h.appendChild(wrap);
      if (i < words.length - 1) h.appendChild(document.createTextNode(" "));
      spans.push(inner);
    });
    gsap.fromTo(
      spans,
      { yPercent: 118, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: h, start: "top 78%" },
      }
    );
  });

  // beam breathes with the stat section
  const proof = document.querySelector("#proof");
  if (proof) {
    ST.create({
      trigger: proof,
      start: "top 70%",
      end: "bottom 40%",
      onToggle(self) {
        ctl.boostT = self.isActive ? 1.22 : 1;
      },
    });
  }

  /* ============================================================
     SIGNATURE MOMENT — "the light starts here"
     The product render is screen-blended over the live beam, so
     the beam appears to erupt from the real chip. As the section
     centres we align the node to the chip core, push energy + a
     screen flash, then settle.
     ============================================================ */
  const sig = document.querySelector("#signature");
  const sigLayer = document.querySelector("#sigLayer");
  if (sig && sigLayer) {
    const flash = sigLayer.querySelector(".sig-flash");
    function fire() {
      sigLayer.classList.add("show");
      gsap.to(ctl, { boostT: 1.7, duration: 0.9, ease: "power2.out" });
      if (flash)
        gsap.fromTo(flash, { opacity: 0 },
          { opacity: 1, duration: 0.55, ease: "power2.out",
            onComplete: () => gsap.to(flash, { opacity: 0.4, duration: 1.4, ease: "power2.inOut" }) });
    }
    function settle() {
      sigLayer.classList.remove("show");
      ctl.boostT = 1;
      if (flash) gsap.to(flash, { opacity: 0, duration: 0.8 });
    }
    ST.create({
      trigger: sig,
      start: "top 65%",
      end: "bottom 35%",
      onEnter: fire,
      onEnterBack: fire,
      onLeave: settle,
      onLeaveBack: settle,
    });
    // subtle node drift across the section so the beam meets the chip core
    gsap.fromTo(
      ctl,
      { nodeAddT: -0.025 },
      {
        nodeAddT: 0.025,
        ease: "none",
        scrollTrigger: { trigger: sig, start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
  }

  ST.refresh();
})();
