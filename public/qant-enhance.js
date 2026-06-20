/* ============================================================
   Q.ANT — 50k enhancement runtime  (ADDITIVE / isolated)
   Feature-flagged: window.QANT_ENHANCE (default true).

   The tested beam shader and its render loop are untouched. The
   loop is now the SINGLE owner of the beam uniforms; this file only
   sets *targets* on window.__QANT_BEAM__ (dampTarget / boostTarget /
   nodeAddTarget) and the loop damps toward them — so nothing jumps.

   Choreography is built to live in BOTH scroll directions: reveals
   reverse, headline mask-wipes + image clip-wipes are reversible,
   parallax runs at multiple depths, and Applications is a horizontal
   pin-scroll sequence. Degrades for reduced-motion + mobile.
   ============================================================ */
(function () {
  "use strict";

  if (window.QANT_ENHANCE === false) return;

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STATIC = document.documentElement.classList.contains("qant-static");
  const wide = matchMedia("(min-width: 1024px)").matches && !STATIC;

  // ---- ONE motion vocabulary: heavy ease, long tail, longer durations ----
  const EASE = "power4.out";
  const DUR = 1.5;

  document.documentElement.classList.add("qant-enh");

  // Beam handle — set modulation *targets*; the page's render loop damps to them.
  const B = window.__QANT_BEAM__ || (window.__QANT_BEAM__ = {});
  if (B.dampTarget == null) B.dampTarget = 1;
  if (B.boostTarget == null) B.boostTarget = 1;
  if (B.nodeAddTarget == null) B.nodeAddTarget = 0;

  if (!gsap || !ST) return; // reveals need GSAP; bail quietly if absent

  /* ============================================================
     PRIO 1 — READABILITY
     Each [data-readable] block raises a feathered radial scrim and
     asks the beam to step back (lower energy target) while it sits
     in the reading band. Reversible by nature (onToggle).
     ============================================================ */
  let activeText = 0;
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
        B.dampTarget = activeText > 0 ? 0.42 : 1;
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
    document.querySelectorAll("[data-wipe]").forEach((el) => (el.style.clipPath = "none"));
    return;
  }

  /* ============================================================
     PRIO 4 — REVEALS, REVERSIBLE
     ============================================================ */

  // image clip-wipes + ken-burns — replay on the way down AND back up
  document.querySelectorAll(".stage--reveal, .kb").forEach((el) => {
    ST.create({
      trigger: el,
      start: "top 84%",
      end: "bottom 12%",
      onEnter: () => el.classList.add("in"),
      onEnterBack: () => el.classList.add("in"),
      onLeaveBack: () => el.classList.remove("in"),
    });
  });

  // duotone -> colour while a card is on screen
  document.querySelectorAll(".stage[data-lit]").forEach((el) => {
    ST.create({
      trigger: el, start: "top 70%", end: "bottom 30%",
      onToggle: (self) => el.classList.toggle("lit", self.isActive),
    });
  });

  // SIGNATURE MOVE — the beam head scans each headline left→right: a clip
  // wipe with a gentle 0.35→1 opacity lift (NO glow, NO brightening past
  // normal). The text reads as quietly lit, never gleaming. Reversible.
  document.querySelectorAll("[data-wipe]").forEach((el) => {
    el.style.willChange = "clip-path, opacity";
    gsap.fromTo(
      el,
      { clipPath: "inset(0 100% 0 0)", opacity: 0.35 },
      {
        clipPath: "inset(0 0 0 0)", opacity: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 72%", end: "top 46%", scrub: true },
      }
    );
  });

  // multi-depth parallax: bg layers move their (oversized) image,
  // tagged foreground elements move themselves at a different rate.
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const isBg = el.classList.contains("bg-layer");
    const node = isBg ? el.querySelector("img") : el;
    if (!node) return;
    const amt = parseFloat(el.dataset.parallax) || 12;
    gsap.fromTo(
      node, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      }
    );
  });

  // oversized statement — word rise, reversible
  document.querySelectorAll("[data-split]").forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.textContent = "";
    const spans = [];
    words.forEach((w, i) => {
      const wrap = document.createElement("span"); wrap.className = "word";
      const inner = document.createElement("span");
      inner.innerHTML = w.replace(/\*(.+?)\*/g, "<em>$1</em>");
      wrap.appendChild(inner); h.appendChild(wrap);
      if (i < words.length - 1) h.appendChild(document.createTextNode(" "));
      spans.push(inner);
    });
    gsap.fromTo(spans, { yPercent: 118, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: DUR, ease: EASE, stagger: 0.1,
      scrollTrigger: { trigger: h, start: "top 80%", toggleActions: "play none none reverse" },
    });
  });

  /* ============================================================
     BEAM PULSES (targets only — loop damps)
     ============================================================ */
  /* A persistent vertical light-trail travels the page with scroll. Its
     bright head is the "playhead": content activates as the head reaches
     it. Desktop only (mobile = static fallback, no trail). */
  const liveBeam = !STATIC;
  let branchEl = null;
  if (liveBeam) {
    const trail = document.createElement("div");
    trail.className = "beam-trail";
    trail.setAttribute("aria-hidden", "true");
    trail.innerHTML = '<div class="bt-line"></div><div class="bt-branch"><i></i><i></i></div><div class="bt-head"></div>';
    document.body.appendChild(trail);
    branchEl = trail.querySelector(".bt-branch");
    // serpentine wander + head intensity rising with scroll velocity
    ST.create({
      trigger: "#main", start: "top top", end: "bottom bottom", scrub: 0.8,
      onUpdate(self) {
        const p = self.progress;
        const x = Math.sin(p * Math.PI * 3.0) * 12;                   // -12vw..12vw, off the text
        trail.style.setProperty("--bx", x.toFixed(2) + "vw");
        const v = Math.min(Math.abs(self.getVelocity()) / 2600, 1);
        const fadeIn = Math.min(p / 0.06, 1);                          // stay clear of the hero wave
        // dim + atmospheric: ~0.15 at rest, ~0.45 ceiling even at speed
        trail.style.setProperty("--bv", ((0.15 + v * 0.3) * fadeIn).toFixed(3));
      },
    });
  }

  /* BENTO — the beam forks into the cards → they light up in sequence */
  const bentoCards = document.querySelectorAll("#applications .card");
  if (bentoCards.length) {
    gsap.fromTo(bentoCards, { "--glow": 0 }, {
      "--glow": 1, ease: "none", stagger: { each: 0.12 },
      scrollTrigger: { trigger: "#applications", start: "top 72%", end: "top 22%", scrub: true },
    });
  }

  /* INTERFERENCE — the trail visibly splits into two paths, then recombines */
  const principle = document.querySelector("#principle");
  if (principle && branchEl) {
    ST.create({
      trigger: principle, start: "top 75%", end: "bottom 50%",
      onToggle: (self) => branchEl.classList.toggle("on", self.isActive),
      onUpdate(self) {
        const s = Math.sin(Math.min(Math.max(self.progress, 0), 1) * Math.PI); // open at mid, recombine
        branchEl.style.setProperty("--split", s.toFixed(3));
      },
    });
  }

  /* ============================================================
     THE CINEMATIC TAKEOVER — the numbers section
     Pin ~1.5 viewport; the background beam EXPLODES (energy→max, bloom
     cranks, interference fills the frame); numbers slam in + count up;
     everything settles on the way out. ONE explosion, reversible.
     ============================================================ */
  const proof = document.querySelector("#proof");
  const counters = (root) =>
    [...(root || document).querySelectorAll("[data-count]")].map((el) => ({
      el, end: +el.dataset.count, suf: el.dataset.suffix || "",
    }));

  if (proof && wide) {
    const stats = proof.querySelectorAll(".stat .v");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: proof, start: "top top", end: "+=130%",
        scrub: 0.7, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      },
    });
    // the COUNT is the moment — only the faintest lift on the background glow,
    // a barely-there interference; numbers rise quietly (opacity + small scale).
    tl.fromTo(B, { boostTarget: 1 }, { boostTarget: 1.22, ease: "power2.inOut", duration: 0.5 }, 0)
      .to(B, { boostTarget: 1, ease: "power2.inOut", duration: 0.5 }, 0.5);
    tl.fromTo(B, { disruptBoost: 0 }, { disruptBoost: 0.18, ease: "power1.inOut", duration: 0.5 }, 0)
      .to(B, { disruptBoost: 0, ease: "power1.inOut", duration: 0.5 }, 0.5);
    tl.fromTo(stats, { scale: 0.86, opacity: 0.35 },
      { scale: 1, opacity: 1, ease: "power3.out", duration: 0.55, stagger: 0.06 }, 0.05);
    counters(proof).forEach((c) => {
      const o = { v: 0 };
      tl.to(o, { v: c.end, ease: "none", duration: 0.6,
        onUpdate: () => (c.el.textContent = Math.round(o.v).toLocaleString("en-US") + c.suf) }, 0.05);
    });
  } else if (proof) {
    counters(proof).forEach((c) => {
      const o = { v: 0 };
      gsap.to(o, { v: c.end, ease: "none",
        onUpdate: () => (c.el.textContent = Math.round(o.v).toLocaleString("en-US") + c.suf),
        scrollTrigger: { trigger: c.el, start: "top 78%", end: "top 45%", scrub: true } });
    });
  }

  /* ---- SIGNATURE — beam erupts from the real chip ---- */
  const sig = document.querySelector("#signature");
  const sigLayer = document.querySelector("#sigLayer");
  if (sig && sigLayer) {
    const flash = sigLayer.querySelector(".sig-flash");
    const fire = () => {
      sigLayer.classList.add("show");
      gsap.to(B, { boostTarget: 1.32, duration: 0.9, ease: "power2.out", overwrite: true });
      if (flash)
        gsap.fromTo(flash, { opacity: 0 }, {
          opacity: 0.45, duration: 0.6, ease: "power2.out",
          onComplete: () => gsap.to(flash, { opacity: 0.2, duration: 1.4, ease: "power2.inOut" }),
        });
    };
    const settle = () => {
      sigLayer.classList.remove("show");
      gsap.to(B, { boostTarget: 1, duration: 0.7, ease: "power2.out", overwrite: true });
      if (flash) gsap.to(flash, { opacity: 0, duration: 0.8 });
    };
    ST.create({
      trigger: sig, start: "top 65%", end: "bottom 35%",
      onEnter: fire, onEnterBack: fire, onLeave: settle, onLeaveBack: settle,
    });
    gsap.fromTo(B, { nodeAddTarget: -0.025 }, {
      nodeAddTarget: 0.025, ease: "none",
      scrollTrigger: { trigger: sig, start: "top bottom", end: "bottom top", scrub: 0.6 },
    });
  }

  /* ---- product callouts: spec labels enter with offset to the image ---- */
  document.querySelectorAll("#product .stage--reveal").forEach((fig) => {
    const cap = fig.querySelector(".product-cap");
    if (!cap) return;
    gsap.fromTo(cap.children, { yPercent: 70, opacity: 0 }, {
      yPercent: 0, opacity: 1, ease: EASE, duration: DUR, stagger: 0.12,
      scrollTrigger: { trigger: fig, start: "top 78%", toggleActions: "play none none reverse" },
    });
  });

  /* ---- line-draw accent: the principle step dividers draw in ---- */
  gsap.utils.toArray(".principle .pstep").forEach((el) => {
    gsap.fromTo(el, { "--d": 0 }, {
      "--d": 1, ease: EASE, duration: DUR,
      scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
    });
  });

  /* ============================================================
     PIN SEQUENCE — Applications scrolls horizontally (rhythm change)
     Desktop only; mobile/reduced keep the vertical bento grid.
     ============================================================ */
  if (wide) {
    try {
      const apps = document.querySelector("#applications");
      const track = apps && apps.querySelector(".bento");
      if (apps && track) {
        apps.classList.add("pinmode");
        const distance = () => Math.max(0, track.scrollWidth - innerWidth + 120);
        const horiz = gsap.to(track, {
          x: () => -distance(), ease: "none",
          scrollTrigger: {
            trigger: apps, start: "top top", end: () => "+=" + distance(),
            scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true,
          },
        });
        // each card eases up to full as it crosses centre (tracks the pin tween)
        track.querySelectorAll(".card").forEach((card) => {
          gsap.fromTo(card, { scale: 0.92, autoAlpha: 0.55 }, {
            scale: 1, autoAlpha: 1, ease: "power2.out",
            scrollTrigger: { trigger: card, containerAnimation: horiz, start: "left 88%", end: "left 50%", scrub: true },
          });
        });
      }
    } catch (e) {
      /* pin is a nice-to-have; never let it take the page down */
      console.warn("[qant] applications pin disabled:", e);
    }
  }

  // keep triggers honest after async images / pin spacers settle
  ST.refresh();
  addEventListener("load", () => ST.refresh());
})();
