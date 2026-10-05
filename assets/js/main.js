(() => {
  "use strict";

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

    destinosNavBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = Number(btn.dataset.destinosDir);
        destinosCarousel.scrollBy({ left: dir * getStep(), behavior: "smooth" });
      });
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
    window.addEventListener("resize", updateAll);
    updateAll();

    /* Arrastrar con el mouse (el touch ya scrollea de forma nativa) */
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragging = false;
    let moved = false;

    destinosCarousel.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
      moved = false;
      dragStartX = e.clientX;
      dragStartScroll = destinosCarousel.scrollLeft;
    });

    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        destinosCarousel.classList.add("is-dragging");
      }
      if (moved) destinosCarousel.scrollLeft = dragStartScroll - dx;
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
      destinosCarousel.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * getStep(), behavior: "smooth" });
    });
  }

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

  /* Contact form: AJAX submit to Formspree */
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  if (form && note) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      note.removeAttribute("data-state");
      note.textContent = "Enviando...";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          note.textContent = "¡Listo! Recibí tu consulta y te voy a responder a la brevedad.";
          note.setAttribute("data-state", "success");
          form.reset();
        } else {
          note.textContent = "Hubo un problema al enviar. Probá de nuevo o escribime por WhatsApp.";
          note.setAttribute("data-state", "error");
        }
      } catch (err) {
        note.textContent = "Hubo un problema al enviar. Probá de nuevo o escribime por WhatsApp.";
        note.setAttribute("data-state", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
})();
