
document.addEventListener("DOMContentLoaded", () => {
  const floating = document.getElementById("floatingButtons");
  const musicButton = document.getElementById("btnMusic");
  const rsvpButton = document.getElementById("btnRsvpFloat");
  const iconPlay = document.getElementById("iconPlay");
  const iconPause = document.getElementById("iconPause");

  const rsvpPopup = document.getElementById("rsvpFloatPopup");
  const profileSection = document.getElementById("profile");
  const openingScreen = document.getElementById("openingScreen");

  if (!floating || !musicButton || !rsvpButton) return;

  let musicPlaying = false;
  let popupShown = false;
  let popupTimer = null;

  // =====================================
  // 1. FLOATING BUTTONS MUNCUL SEJAK AWAL
  // =====================================
  floating.classList.remove("opacity-0", "pointer-events-none");
  floating.classList.add("opacity-100");

  // =====================================
  // 2. MUSIC BUTTON
  // =====================================
  musicButton.addEventListener("click", () => {
    musicPlaying = !musicPlaying;

    iconPlay?.classList.toggle("hidden", musicPlaying);
    iconPause?.classList.toggle("hidden", !musicPlaying);

    musicButton.setAttribute("aria-pressed", String(musicPlaying));
    musicButton.setAttribute(
      "aria-label",
      musicPlaying ? "Pause music" : "Play music"
    );
  });

  // =====================================
  // 3. RSVP POPUP
  // =====================================
  function hideRsvpPopup() {
    if (!rsvpPopup) return;

    clearTimeout(popupTimer);

    rsvpPopup.classList.remove(
      "opacity-100",
      "translate-x-0"
    );

    rsvpPopup.classList.add(
      "opacity-0",
      "translate-x-[12px]"
    );
  }

  function showRsvpPopup() {
    if (!rsvpPopup || popupShown) return;

    // Jangan tampilkan popup selama opening masih ada.
    if (openingScreen && document.contains(openingScreen)) return;

    popupShown = true;

    rsvpPopup.classList.remove(
      "opacity-0",
      "translate-x-[12px]"
    );

    rsvpPopup.classList.add(
      "opacity-100",
      "translate-x-0"
    );

    popupTimer = window.setTimeout(hideRsvpPopup, 3000);
  }


  // =====================================
  // 4. POPUP MUNCUL SAAT MASUK PROFILE
  // =====================================
  if (profileSection && rsvpPopup) {
    const checkPopup = () => {
      if (popupShown) return;

      // Opening harus sudah selesai
      if (openingScreen && document.contains(openingScreen)) {
        return;
      }

      const rect = profileSection.getBoundingClientRect();

      // Popup muncul ketika bagian Profile mulai masuk
      // ke 80% tinggi viewport.
      if (rect.top <= window.innerHeight * 0.7 &&
          rect.bottom > 0) {
        showRsvpPopup();
      }
    };

    window.addEventListener("scroll", checkPopup, {
      passive: true
    });

    window.addEventListener("resize", checkPopup);

    // Periksa juga saat opening selesai
    if (openingScreen) {
      const openingObserver = new MutationObserver(() => {
        if (!document.contains(openingScreen)) {
          openingObserver.disconnect();
          checkPopup();
        }
      });

      openingObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    checkPopup();
  }


  // =====================================
  // 5. SCROLL KE RSVP
  // =====================================
  rsvpButton.addEventListener("click", () => {
    hideRsvpPopup();

    document.getElementById("rsvp")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});
