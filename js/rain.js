/* ============================================================
   Digital rain (hero) — adaptado de "digital rain.html"
   Solo la animación: va ENCIMA del fondo existente, sin fondo
   propio (borrado por destination-out), cortada en la línea
   superior del carrusel por el overflow:hidden del hero.
   ============================================================ */

(function () {
  "use strict";

  const cv = document.getElementById("hero-rain");
  if (!cv || !cv.getContext) return;

  const ctx = cv.getContext("2d");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";
  const FPS = 24;
  const STEP = 1000 / FPS;
  const CELL = 18;

  let w = 0,
    h = 0,
    dpr = 1,
    cols = 0,
    drops = [],
    glyph = [],
    raf = 0,
    live = false,
    last = 0;

  const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  const size = () => {
    const r = cv.getBoundingClientRect();
    w = Math.max(1, r.width);
    h = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = CELL - 2 + "px ui-monospace, Menlo, Consolas, monospace";
    ctx.textBaseline = "top";
    cols = Math.ceil(w / CELL);
    drops = Array.from({ length: cols }, () => ({
      y: -Math.random() * h,
      v: CELL * (0.55 + Math.random() * 0.9),
      prev: pick(),
    }));
    glyph = Array.from({ length: cols }, pick);
    /* Transparente: el fondo real (back21) se ve debajo */
    ctx.clearRect(0, 0, w, h);
  };

  const draw = () => {
    /* Estela por transparencia alpha, no pintando un color de fondo */
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.17)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";

    for (let i = 0; i < cols; i++) {
      const d = drops[i];
      const x = i * CELL;
      if (Math.random() < 0.22) {
        d.prev = glyph[i];
        glyph[i] = pick();
      }
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#3dffa4";
      ctx.fillStyle = "#e6fff2";
      ctx.fillText(glyph[i], x, d.y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(61,255,164,0.82)";
      ctx.fillText(d.prev, x, d.y - CELL);
      d.y += d.v;
      if (d.y > h + Math.random() * 240) {
        d.y = -Math.random() * 160;
        d.v = CELL * (0.55 + Math.random() * 0.9);
      }
    }
  };

  const frame = (now) => {
    if (now - last >= STEP) {
      last = now;
      draw();
    }
    if (live) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!live && !calm) {
      live = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  };

  const stop = () => {
    live = false;
    cancelAnimationFrame(raf);
  };

  size();

  if (calm) {
    /* Sin movimiento: una pasada estática de glifos */
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    drops.forEach((d) => {
      d.y = Math.random() * h;
    });
    draw();
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0 }
    ).observe(cv);
  } else {
    start();
  }

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      size();
      if (calm) {
        drops.forEach((d) => {
          d.y = Math.random() * h;
        });
        draw();
      }
    }, 180);
  });
})();
