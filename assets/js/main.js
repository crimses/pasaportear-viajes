(() => {
  "use strict";

  /* Ejecuta tareas que miden el diseño (fuerzan layout) cuando el navegador está libre,
     después de la carga: así no retrasan el primer pintado ni bloquean el hilo principal. */
  const whenIdle = (fn) => {
    const run = () => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 200));
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run, { once: true });
  };

  /* Footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile nav toggle */
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menú");
        document.body.style.overflow = "";
      });
    });
  }

  /* Scroll reveal via IntersectionObserver */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Video divisor: reproducir al hacer clic */
  const videoDivider = document.getElementById("video-divider");
  const videoPlayBtn = document.getElementById("video-divider-play");
  const videoEl = document.getElementById("video-divider-video");

  if (videoDivider && videoPlayBtn && videoEl) {
    const videoSource = videoEl.querySelector("source");

    const cancelVideo = () => {
      videoDivider.classList.remove("is-playing");
    };

    videoPlayBtn.addEventListener("click", () => {
      /* El póster se asigna recién al reproducir (ya está en caché por la imagen de fondo) */
      if (!videoEl.getAttribute("poster") && videoEl.dataset.poster) {
        videoEl.setAttribute("poster", videoEl.dataset.poster);
      }
      videoDivider.classList.add("is-playing");
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(cancelVideo);
      }
    });

    /* El archivo todavía no fue cargado por el cliente: evita que la UI
       quede colgada esperando un video que no existe. */
    if (videoSource) videoSource.addEventListener("error", cancelVideo);
    videoEl.addEventListener("error", cancelVideo);
    videoEl.addEventListener("stalled", cancelVideo);

    videoEl.addEventListener("ended", cancelVideo);
  }

  /* Destinos carousel */
  const destinosCarousel = document.getElementById("destinos-carousel");
  const destinosNavBtns = document.querySelectorAll(".destinos-nav__btn");

  if (destinosCarousel && destinosNavBtns.length) {
    const getStep = () => {
      const track = destinosCarousel.querySelector(".destinos-track");
      const card = destinosCarousel.querySelector(".destino-card");
      if (!track || !card) return 320;
      const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      return card.getBoundingClientRect().width + gap;
    };

    const updateNavState = () => {
      const max = destinosCarousel.scrollWidth - destinosCarousel.clientWidth - 1;
      destinosNavBtns.forEach((btn) => {
        const dir = Number(btn.dataset.destinosDir);
        if (dir < 0) btn.disabled = destinosCarousel.scrollLeft <= 0;
        if (dir > 0) btn.disabled = destinosCarousel.scrollLeft >= max;
      });
    };

    /* Modo anclado (solo escritorio): la sección queda fija y la rueda del
       mouse recorre los destinos. Cada px de scroll vertical = 1 px horizontal. */
    const destinosSection = document.getElementById("destinos");
    const destinosSticky = destinosSection && destinosSection.querySelector(".destinos-sticky");
    const siteHeader = document.getElementById("site-header");
    const pinMq = window.matchMedia("(min-width: 901px) and (hover: hover) and (pointer: fine)");
    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pinned = false;
    let pinMax = 0;
    let pinPadTop = 0;
    let pinTicking = false;

    const unpin = () => {
      pinned = false;
      if (!destinosSection) return;
      destinosSection.classList.remove("is-pinned");
      destinosSection.style.height = "";
      destinosSection.style.boxSizing = "";
      destinosSticky.style.top = "";
    };

    const syncPin = () => {
      pinTicking = false;
      if (!pinned) return;
      const headerH = siteHeader ? siteHeader.offsetHeight : 0;
      const offset = destinosSection.getBoundingClientRect().top + pinPadTop - headerH;
      const progress = Math.min(1, Math.max(0, -offset / pinMax));
      destinosCarousel.scrollLeft = progress * pinMax;
    };

    const setupPin = () => {
      if (!destinosSection || !destinosSticky) return;
      unpin();
      if (!pinMq.matches || reducedMq.matches) {
        updateAll();
        return;
      }
      /* La clase se agrega antes de medir: en este modo las tarjetas se
         ajustan al alto de la pantalla */
      destinosSection.classList.add("is-pinned");
      const headerH = siteHeader ? siteHeader.offsetHeight : 0;
      const stickyH = destinosSticky.offsetHeight;
      const max = destinosCarousel.scrollWidth - destinosCarousel.clientWidth;
      /* Si el contenido no entra en pantalla junto al header, no se ancla */
      if (max <= 0 || stickyH > window.innerHeight - headerH) {
        unpin();
        updateAll();
        return;
      }
      pinned = true;
      pinMax = max;
      pinPadTop = parseFloat(getComputedStyle(destinosSection).paddingTop) || 0;
      destinosSection.style.boxSizing = "content-box";
      destinosSection.style.height = `${stickyH + max}px`;
      destinosSticky.style.top = `${headerH}px`;
      syncPin();
    };

    const requestPinSync = () => {
      if (!pinned || pinTicking) return;
      pinTicking = true;
      requestAnimationFrame(syncPin);
    };

    /* Desplaza el carrusel una tarjeta: en modo anclado mueve la página */
    const moveStep = (dir) => {
      if (pinned) window.scrollBy({ top: dir * getStep(), behavior: "smooth" });
      else destinosCarousel.scrollBy({ left: dir * getStep(), behavior: "smooth" });
    };

    destinosNavBtns.forEach((btn) => {
      btn.addEventListener("click", () => moveStep(Number(btn.dataset.destinosDir)));
    });

    const progressBar = document.querySelector(".destinos-progress__bar");

    const updateProgress = () => {
      if (!progressBar) return;
      const total = destinosCarousel.scrollWidth;
      const visible = destinosCarousel.clientWidth;
      const max = total - visible;
      const thumb = Math.min(1, visible / total);
      const ratio = max > 0 ? destinosCarousel.scrollLeft / max : 0;
      progressBar.style.width = `${thumb * 100}%`;
      progressBar.style.transform = `translateX(${ratio * (1 / thumb - 1) * 100}%)`;
    };

    const updateAll = () => {
      updateNavState();
      updateProgress();
    };

    destinosCarousel.addEventListener("scroll", updateAll, { passive: true });
    window.addEventListener("resize", () => {
      setupPin();
      updateAll();
    });
    window.addEventListener("scroll", requestPinSync, { passive: true });
    pinMq.addEventListener("change", setupPin);
    reducedMq.addEventListener("change", setupPin);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => whenIdle(setupPin));
    whenIdle(() => {
      setupPin();
      updateAll();
    });

    /* Arrastrar con el mouse (el touch ya scrollea de forma nativa) */
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragStartPageY = 0;
    let dragging = false;
    let moved = false;

    destinosCarousel.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      dragStartX = e.clientX;
      dragStartScroll = destinosCarousel.scrollLeft;
      dragStartPageY = window.scrollY;
    });

    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        destinosCarousel.classList.add("is-dragging");
      }
      if (!moved) return;
      if (pinned) window.scrollTo({ top: dragStartPageY - dx, behavior: "instant" });
      else destinosCarousel.scrollLeft = dragStartScroll - dx;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      destinosCarousel.classList.remove("is-dragging");
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    /* Un arrastre no debe abrir el link de la tarjeta */
    destinosCarousel.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      },
      true
    );
    destinosCarousel.addEventListener("dragstart", (e) => e.preventDefault());

    /* Teclado: flechas izquierda/derecha cuando el carrusel tiene foco */
    destinosCarousel.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      moveStep(e.key === "ArrowRight" ? 1 : -1);
    });
  }

  /* Carruseles infinitos (reseñas y marcas). Se clonan los ítems las veces necesarias
     para cubrir cualquier ancho de pantalla y el recorrido es exactamente el de una
     tanda, así el reinicio del bucle no se nota. Para sumar o cambiar ítems alcanza con
     editar los originales del HTML: los clones se generan solos. */
  const initLoopCarousel = (carouselSel, trackSel, speed) => {
    const carousel = document.querySelector(carouselSel);
    const track = carousel && carousel.querySelector(trackSel);
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const originals = Array.from(track.children);

    const build = () => {
      track.querySelectorAll("[data-clone]").forEach((n) => n.remove());
      const first = originals[0];
      const last = originals[originals.length - 1];
      const gap = parseFloat(getComputedStyle(first).marginRight) || 0;
      const setW = last.offsetLeft + last.offsetWidth - first.offsetLeft + gap;
      if (!setW) return;

      const copies = Math.ceil(carousel.clientWidth / setW) + 1;
      for (let i = 0; i < copies; i++) {
        originals.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          clone.dataset.clone = "";
          track.appendChild(clone);
        });
      }
      track.style.setProperty("--set-w", `${setW}px`);
      track.style.animationDuration = `${setW / speed}s`;
      carousel.classList.add("is-looping");
    };

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    });
    whenIdle(build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => whenIdle(build));
  };

  initLoopCarousel(".testimonials-carousel", ".testimonials-track", 45); /* px por segundo */
  initLoopCarousel(".brands-carousel", ".brands-track", 60);

  /* FAQ accordion */
  document.querySelectorAll(".accordion__trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const item = trigger.closest(".accordion__item");
      const isOpen = item.classList.contains("is-open");

      item.parentElement.querySelectorAll(".accordion__item").forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".accordion__trigger").setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

})();
