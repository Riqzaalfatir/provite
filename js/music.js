
(function () {
  const MEDIA_BASE = "https://media.twinklebook.com/";

  let audio;
  let button;
  let playIcon;
  let pauseIcon;

  let invitationOpened = false;
  let wasPlayingBeforeHidden = false;

  function setIcon(playing) {
    if (!button || !playIcon || !pauseIcon) return;

    playIcon.classList.toggle("hidden", playing);
    pauseIcon.classList.toggle("hidden", !playing);

    button.setAttribute("aria-pressed", String(playing));
    button.setAttribute(
      "aria-label",
      playing ? "Pause music" : "Play music"
    );
  }

  function getMusicURL() {
    const content = window.BryanApp?.state?.dataContent;
    if (!content) return "";

    const raw =
      content.backgroundSoundData?.url ||
      content.songList ||
      "";

    if (typeof raw !== "string" || !raw.trim()) {
      return "";
    }

    try {
      const url = new URL(raw.trim(), MEDIA_BASE);
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function loadMusic() {
    const src = getMusicURL();
    if (!src || !audio) return;

    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }

    console.log("[BryanMusic] Music source:", src);

    // Jika undangan sudah dibuka sebelum API siap,
    // coba putar setelah sumber musik tersedia.
    if (invitationOpened && !document.hidden) {
      playMusic();
    }
  }

  async function playMusic() {
    if (!audio || !audio.src || document.hidden) return;

    try {
      await audio.play();
      setIcon(true);
    } catch (error) {
      setIcon(false);
      console.warn("[BryanMusic] Playback blocked:", error);
    }
  }

  function pauseMusic() {
    if (!audio) return;
    audio.pause();
    setIcon(false);
  }

  function toggleMusic() {
    if (!audio?.src) {
      console.warn("[BryanMusic] No audio source");
      return;
    }

    if (audio.paused) {
      playMusic();
    } else {
      wasPlayingBeforeHidden = false;
      pauseMusic();
    }
  }

  function handleVisibility() {
    if (!audio?.src) return;

    if (document.hidden) {
      wasPlayingBeforeHidden = !audio.paused;

      if (wasPlayingBeforeHidden) {
        pauseMusic();
      }
    } else if (wasPlayingBeforeHidden) {
      wasPlayingBeforeHidden = false;
      playMusic();
    }
  }

  function init() {
    audio = document.getElementById("bgAudio");
    button = document.getElementById("btnMusic");
    playIcon = document.getElementById("iconPlay");
    pauseIcon = document.getElementById("iconPause");

    if (!audio || !button || !playIcon || !pauseIcon) {
      return;
    }

    audio.loop = true;

    button.addEventListener("click", toggleMusic);

    audio.addEventListener("play", () => setIcon(true));
    audio.addEventListener("pause", () => setIcon(false));
    audio.addEventListener("ended", () => setIcon(false));

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    // Tombol opening pada invitation.html.
    document.getElementById("btnOpenInvitation")
      ?.addEventListener("click", () => {
        invitationOpened = true;
        loadMusic();
        playMusic();
      });

    // Sumber musik dapat datang setelah DOM siap.
    window.addEventListener("bryan:data-ready", loadMusic);

    if (window.BryanApp?.state?.status === "success") {
      loadMusic();
    }

    setIcon(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.BryanMusic = {
    play: playMusic,
    pause: pauseMusic,
    load: loadMusic
  };
})();
