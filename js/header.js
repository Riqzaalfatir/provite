
/* ========================================
   BRYAN & VANESSA - HEADER NAVIGATION
======================================== */

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("headerToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const desktopNav = document.getElementById("desktopNav");
  const hint = document.getElementById("mobileMenuHint");

  const topLine = document.getElementById("headerLineTop");
  const middleLine = document.getElementById("headerLineMiddle");
  const bottomLine = document.getElementById("headerLineBottom");

  if (!toggle || !mobileMenu) return;

  const menuItems = [
    ...mobileMenu.querySelectorAll(".header-menu-item"),
  ];

  let isOpen = false;
  let isBusy = false;
  let lastScrollY = window.scrollY;
  let closeTimer = null;
  let openTimer = null;
  let previousOverflow = "";

  const MENU_DURATION = 0;

  // ===================================
  // HAMBURGER / X
  // ===================================
  function updateIcon(open) {
    if (open) {
      topLine.style.top = "50%";
      topLine.style.transform =
        "translateY(-50%) rotate(45deg)";

      middleLine.style.opacity = "0";
      middleLine.style.transform =
        "translateY(-50%) scaleX(0)";

      bottomLine.style.bottom = "auto";
      bottomLine.style.top = "50%";
      bottomLine.style.transform =
        "translateY(-50%) rotate(-45deg)";
    } else {
      topLine.style.top = "15%";
      topLine.style.transform = "none";

      middleLine.style.opacity = "1";
      middleLine.style.transform =
        "translateY(-50%) scaleX(1)";

      bottomLine.style.top = "auto";
      bottomLine.style.bottom = "15%";
      bottomLine.style.transform = "none";
    }
  }

  // ===================================
  // SMOOTH SCROLL
  // ===================================
  function scrollToSection(targetId) {
    const target = document.getElementById(targetId);

    if (!target) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    target.scrollIntoView({
      behavior: reduceMotion ? "instant" : "smooth",
      block: "start",
    });
  }

  // ===================================
  // OPEN MENU
  // ===================================
  function openMenu() {
    if (isOpen || isBusy) return;

    clearTimeout(closeTimer);
    clearTimeout(openTimer);

    isOpen = true;
    isBusy = true;

    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");

    mobileMenu.removeAttribute("inert");
    mobileMenu.setAttribute("aria-hidden", "false");

    mobileMenu.classList.remove(
      "opacity-0",
      "pointer-events-none"
    );

    mobileMenu.classList.add(
      "opacity-100",
      "pointer-events-auto"
    );

    updateIcon(true);

    menuItems.forEach((item, index) => {
      item.style.transitionDelay = `${150 + index * 60}ms`;

      requestAnimationFrame(() => {
        if (isOpen) item.classList.add("is-visible");
      });
    });

    if (hint) {
      hint.style.transitionDelay = "650ms";
      hint.classList.remove("opacity-0");
      hint.classList.add("opacity-100");
    }

    // Animasi masuk selesai.
    // Item navigasi tetap bisa diklik selama animasi.
    openTimer = window.setTimeout(() => {
      isBusy = false;
    }, 1050);
  }

  // ===================================
  // CLOSE MENU
  // ===================================
  function closeMenu(onClosed = null) {
    if (!isOpen) return;

    clearTimeout(closeTimer);
    clearTimeout(openTimer);

    isBusy = true;

    menuItems.forEach((item) => {
      item.style.transitionDelay = "0ms";
      item.classList.remove("is-visible");
    });

    if (hint) {
      hint.style.transitionDelay = "0ms";
      hint.classList.remove("opacity-100");
      hint.classList.add("opacity-0");
    }

    mobileMenu.classList.remove(
      "opacity-100",
      "pointer-events-auto"
    );

    mobileMenu.classList.add(
      "opacity-0",
      "pointer-events-none"
    );

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");

    updateIcon(false);

    closeTimer = window.setTimeout(() => {
      mobileMenu.setAttribute("inert", "");
      mobileMenu.setAttribute("aria-hidden", "true");

      document.body.style.overflow = previousOverflow;

      isOpen = false;
      isBusy = false;

      if (typeof onClosed === "function") {
        requestAnimationFrame(onClosed);
      }
    }, MENU_DURATION);
  }

  // ===================================
  // HAMBURGER TOGGLE
  // ===================================
  toggle.addEventListener("click", () => {
    if (isBusy) return;

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // ===================================
  // MOBILE NAVIGATION
  // ===================================
  menuItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();

      if (!isOpen) return;

      // Hindari pemrosesan berulang saat menu menutup
      if (closeTimer !== null && isBusy && !openTimer) {
        return;
      }

      const targetId = item
        .getAttribute("href")
        ?.replace("#", "");

      if (!targetId) return;

      // Hentikan timer animasi masuk
      clearTimeout(openTimer);
      openTimer = null;

      // Tutup overlay, kemudian smooth scroll
      closeMenu(() => {
        scrollToSection(targetId);
      });
    });
  });

  // ===================================
  // DESKTOP NAVIGATION
  // ===================================
  desktopNav
    ?.querySelectorAll('a[href^="#"]')
    .forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();

        const targetId = link
          .getAttribute("href")
          .slice(1);

        scrollToSection(targetId);
      });
    });

  // ===================================
  // DESKTOP SCROLL BEHAVIOR
  // ===================================
  window.addEventListener(
    "scroll",
    () => {
      if (!desktopNav) return;

      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastScrollY;

      if (currentScrollY <= 20 || difference < -2) {
        desktopNav.style.transform = "translateY(0)";
      } else if (difference > 2) {
        desktopNav.style.transform = "translateY(-100%)";
      }

      lastScrollY = currentScrollY;
    },
    { passive: true }
  );

  // ===================================
  // CLOSE ON ESC
  // ===================================
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen && !isBusy) {
      closeMenu();
    }
  });
});
