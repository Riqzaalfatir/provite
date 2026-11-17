document.addEventListener("DOMContentLoaded", () => {
  const floating = document.getElementById("floatingButtons");
  const musicButton = document.getElementById("btnMusic");
  const rsvpButton = document.getElementById("btnRsvpFloat");
  const iconPlay = document.getElementById("iconPlay");
  const iconPause = document.getElementById("iconPause");

  if (!floating || !musicButton || !rsvpButton) return;

  let musicPlaying = false;

  function showFloatingButtons() {
    floating.classList.remove("opacity-0", "pointer-events-none");
    floating.classList.add("opacity-100");
  }

  // Tampilkan setelah Opening Invitation selesai
  const openingScreen = document.getElementById("openingScreen");

  if (!openingScreen) {
    showFloatingButtons();
  } else {
    const observer = new MutationObserver(() => {
      if (
        !document.contains(openingScreen) ||
        getComputedStyle(openingScreen).display === "none"
      ) {
        showFloatingButtons();
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }

  // SIMULASI PLAY / PAUSE
  musicButton.addEventListener("click", () => {
    musicPlaying = !musicPlaying;

    iconPlay.classList.toggle("hidden", musicPlaying);
    iconPause.classList.toggle("hidden", !musicPlaying);

    musicButton.setAttribute("aria-pressed", String(musicPlaying));
    musicButton.setAttribute(
      "aria-label",
      musicPlaying ? "Pause music" : "Play music",
    );
  });

  // SCROLL KE RSVP
  rsvpButton.addEventListener("click", () => {
    document.getElementById("rsvp")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});
