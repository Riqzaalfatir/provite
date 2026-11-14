/* =========================================
   BRYAN & VANESSA - OPENING INVITATION
========================================= */

(() => {
  // Lock scroll sedini mungkin.
  document.documentElement.style.overflow = "hidden";

  document.addEventListener("DOMContentLoaded", () => {
    const opening = document.getElementById("openingScreen");
    const backdrop = document.getElementById("openingBackdrop");
    const card = document.getElementById("openingCard");
    const openBtn = document.getElementById("btnOpenInvitation");
    const guestNameEl = document.getElementById("openingGuestName");
    const heroVideo = document.getElementById("heroVideo");

    if (!opening || !openBtn) {
      document.documentElement.style.overflow = "";
      return;
    }

    let isOpened = false;

    // =====================================
    // 1. LOCK SCROLL
    // =====================================
    document.body.style.overflow = "hidden";

    // =====================================
    // 2. GUEST NAME
    // =====================================
    // Contoh: ?to=John%20Doe
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get("to");

    if (guestNameEl && guestName) {
      guestNameEl.textContent = guestName;
    }

    // =====================================
    // 3. PAUSE HERO VIDEO
    // =====================================
    // if (heroVideo) {
    //   heroVideo.autoplay = false;
    //   heroVideo.pause();
    // }

    // =====================================
    // 4. OPEN INVITATION
    // =====================================
    openBtn.addEventListener("click", () => {
      if (isOpened) return;

      isOpened = true;
      openBtn.disabled = true;

      // Fade out background overlay
      if (backdrop) {
        backdrop.classList.remove("bg-[#000000]/40", "backdrop-blur-[5.2px]");

        backdrop.classList.add("bg-transparent", "backdrop-blur-0");
      }

      // Animasi card seperti Framer Motion:
      // opacity 0, scale 0.93, translateY 30px
      if (card) {
        card.classList.remove("opacity-100", "scale-100", "translate-y-0");

        card.classList.add("opacity-0", "scale-[0.93]", "translate-y-[30px]");
      }

      // Fade out seluruh opening
      opening.classList.remove("opacity-100");
      opening.classList.add("opacity-0");

      // Unlock scroll
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";

      window.scrollTo({ top: 0, behavior: "instant" });

      // Start hero video
      // if (heroVideo) {
      //   heroVideo.muted = true;
      //   heroVideo.currentTime = 0;

      //   heroVideo.play().catch((err) => {
      //     console.warn("Hero video playback:", err);
      //   });
      // }
      if (heroVideo && heroVideo.paused) {
        heroVideo.play().catch((err) => {
          console.warn("Hero video playback:", err);
        });
      }

      // Remove opening setelah animasi 900ms
      window.setTimeout(() => {
        opening.remove();
      }, 950);
    });
  });
})();
