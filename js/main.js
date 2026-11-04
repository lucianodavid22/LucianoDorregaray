/* ============================================================
   Luciano Dorregaray — Portfolio
   Nav (activo + menú móvil), reveal on scroll, formulario
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------- Menú móvil ------------------------- */
  const pill = document.querySelector(".nav-pill");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));

  if (pill && toggle) {
    const setOpen = (open) => {
      pill.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    };

    toggle.addEventListener("click", () => {
      setOpen(!pill.classList.contains("is-open"));
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!pill.contains(event.target)) setOpen(false);
    });
  }

  /* ----------------- Sección activa en la nav ----------------- */
  const sectionIds = navLinks.map((link) => link.dataset.section).filter(Boolean);
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const markActive = (id) => {
    navLinks.forEach((link) => {
      const active = link.dataset.section === id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  if (sections.length && "IntersectionObserver" in window) {
    const visible = new Map();

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId = null;
        let bestRatio = 0;
        visible.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) markActive(bestId);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* --------------------- Reveal on scroll --------------------- */
  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  if (revealItems.length) {
    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
      );

      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("is-in"));
    }
  }

  /* ---------------- Carrusel infinito (sin cortes) ----------------
     El loop CSS (-50% de un track) es perfecto solo si cada track
     mide >= ancho del viewport: si no, se ve el fin de la fila.
     Completamos los dos tracks por igual (idénticos => costura
     invisible) y re-medimos al redimensionar. */
  const marquee = document.querySelector(".marquee");

  if (marquee) {
    const tracks = marquee.querySelectorAll(".marquee-track");
    const template = tracks[0] ? tracks[0].innerHTML : "";

    const fill = () => {
      if (tracks.length < 2 || !template) return;
      const need = document.documentElement.clientWidth;
      const first = tracks[0];
      if (first.scrollWidth >= need) return;

      /* medimos sobre el track real (flex + gap), no un probe */
      let html = template;
      first.innerHTML = html;
      let guard = 0;
      while (first.scrollWidth < need && guard < 40) {
        html += template;
        first.innerHTML = html;
        guard += 1;
      }
      tracks[1].innerHTML = first.innerHTML;

      /* velocidad constante (~35 px/s) sin importar el ancho del track */
      const inner = marquee.querySelector(".marquee-inner");
      if (inner) inner.style.animationDuration = first.scrollWidth / 35 + "s";
    };

    fill();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fill).catch(() => {});
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fill, 200);
    });
  }

  /* ------------- Scroll smooth (independiente del Hz) -------------
     Duración en milisegundos y easing por timestamp: a 60, 120 o
     144 Hz la curva y la duración son idénticas (sin trabas). */
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollPadding = () => {
    const value = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    return Number.isFinite(value) ? value : 0;
  };

  /* el CSS smooth rompería los saltos por frame: lo desactivamos
     (el fallback sin JS sigue siendo scroll-behavior: smooth) */
  document.documentElement.style.scrollBehavior = "auto";

  let smoothRaf = 0;

  const cancelSmooth = () => {
    if (smoothRaf) {
      cancelAnimationFrame(smoothRaf);
      smoothRaf = 0;
    }
  };

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const scrollToY = (to) => {
    cancelSmooth();
    const from = window.scrollY;
    const distance = to - from;
    if (Math.abs(distance) < 2) return;

    if (reducedMotion) {
      window.scrollTo(0, to);
      return;
    }

    const duration = Math.min(1150, Math.max(420, 360 + Math.abs(distance) * 0.3));
    let startedAt = 0;

    const step = (now) => {
      if (!startedAt) startedAt = now;
      const p = Math.min(1, (now - startedAt) / duration);
      window.scrollTo(0, from + distance * easeInOutCubic(p));
      if (p < 1) smoothRaf = requestAnimationFrame(step);
      else smoothRaf = 0;
    };

    smoothRaf = requestAnimationFrame(step);
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const id = decodeURIComponent(link.getAttribute("href").slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();

    const to = Math.max(
      0,
      Math.round(target.getBoundingClientRect().top + window.scrollY - scrollPadding())
    );
    scrollToY(to);

    try {
      history.pushState(null, "", link.getAttribute("href"));
    } catch (err) {
      /* sin history (file://) igual scrollea */
    }
  });

  /* el usuario retoma el control al instante */
  ["wheel", "touchstart", "keydown"].forEach((type) => {
    window.addEventListener(
      type,
      (event) => {
        if (
          type === "keydown" &&
          !["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
            event.key
          )
        ) {
          return;
        }
        cancelSmooth();
      },
      { passive: true }
    );
  });

  /* ----------------------- Formulario -----------------------
     Envío en cadena (failover): FlowForm.to → FormSubmit →
     fallback mailto. El asunto siempre es "Consulta desde
     portfolio" y llega a lucianodavid2201@gmail.com.
     --------------------------------------------------------- */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");

  if (form && status && submitBtn) {
    const EMAIL = "lucianodavid2201@gmail.com";
    const SUBJECT = "Consulta desde portfolio";

    const CHECK_SVG =
      '<svg class="status-check" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
      '<circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M6 10.4l2.7 2.7L14 7.7" fill="none" stroke="currentColor" stroke-width="2"' +
      ' stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const OK_HTML =
      '<span class="status-ok">' + CHECK_SVG + "Mensaje enviado. Te respondo a la brevedad.</span>";

    const ENDPOINTS = [
      { url: "https://flowform.to/" + EMAIL, extra: { _subject: SUBJECT } },
      {
        url: "https://formsubmit.co/ajax/" + EMAIL,
        extra: { _subject: SUBJECT, _template: "table", _captcha: "false" },
      },
    ];

    const setStatus = (kind, html) => {
      status.className = "form-status" + (kind ? " is-" + kind : "");
      status.innerHTML = html;
    };

    const postJSON = async (endpoint, payload) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.assign({}, endpoint.extra, payload)),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("HTTP " + response.status);

        const data = await response.json().catch(() => ({}));
        if (data && (data.success === false || data.success === "false")) {
          throw new Error("rejected");
        }
        return true;
      } finally {
        clearTimeout(timer);
      }
    };

    /* Envío nativo sin JS: FlowForm redirige a ?sent=1 */
    const params = new URLSearchParams(window.location.search);
    if (params.get("sent")) {
      setStatus("ok", OK_HTML);
      try {
        history.replaceState(null, "", window.location.pathname + window.location.hash);
      } catch (err) {
        /* sin history: el mensaje igual queda visible */
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!email || !form.email.checkValidity()) {
        setStatus("error", "Cargá un email válido para poder responderte.");
        form.email.focus();
        return;
      }

      if (!message) {
        setStatus("error", "Escribí tu mensaje antes de enviar.");
        form.message.focus();
        return;
      }

      submitBtn.disabled = true;
      setStatus("", "Enviando…");

      let sent = false;
      for (const endpoint of ENDPOINTS) {
        try {
          await postJSON(endpoint, { email: email, message: message });
          sent = true;
          break;
        } catch (err) {
          /* siguiente endpoint */
        }
      }

      if (sent) {
        form.reset();
        setStatus("ok", OK_HTML);
      } else {
        setStatus(
          "error",
          'No se pudo enviar. Escribime directo a <a href="mailto:' +
            EMAIL +
            "?subject=" +
            encodeURIComponent(SUBJECT) +
            "&body=" +
            encodeURIComponent(message) +
            '">' +
            EMAIL +
            "</a>."
        );
      }

      submitBtn.disabled = false;
    });
  }
})();
