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
