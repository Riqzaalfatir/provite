
/* ================= HERO VIDEO ================= */

document.addEventListener("DOMContentLoaded", () => {
  const heroVideo = document.getElementById("heroVideo");

  if (!heroVideo) return;

  // DETIK VIDEO INGIN DIHENTIKAN
  const STOP_AT = 8.5; // Ganti sesuai detik yang diinginkan

  heroVideo.loop = false;

  heroVideo.addEventListener("timeupdate", () => {
    if (heroVideo.currentTime >= STOP_AT) {
      heroVideo.pause();
      heroVideo.currentTime = STOP_AT;
    }
  });
});
