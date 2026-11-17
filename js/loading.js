/* ==============================================
   BRYAN & VANESSA - IMAGE PRELOADER
   Vanilla JavaScript version of usePreloader
============================================== */

document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("sectionLoading");
  const loadingBar = document.getElementById("loadingBar");
  const loadingPercent = document.getElementById("loadingPercent");

  if (!loadingScreen || !loadingBar || !loadingPercent) return;

  const BREAKPOINT = 1024;
  const MAX_WAIT_PER_IMAGE = 20000;
  const MIN_LOADING_TIME = 500;

  /* =========================================
   ASSET KHUSUS MOBILE
========================================= */

  const IMAGES_MOBILE = [
    // Belum ada aset yang eksklusif untuk mobile.
    // Aset invitation.html masuk ke IMAGES_COMMON.
  ];

  /* =========================================
   ASSET KHUSUS DESKTOP
   Hanya digunakan pada index.html
========================================= */

  /* =========================================
   ASSET KHUSUS DESKTOP
   BRYAN & VANESSA
========================================= */

  const IMAGES_DESKTOP = [
    // BACKGROUND DESKTOP
    "assets/images/desktop/langit.webp",
    "assets/images/desktop/ornamentbackground.webp",

    // PILAR KIRI DAN KANAN
    "assets/images/desktop/pilarkiri.webp",
    "assets/images/desktop/pilarkanan.webp",

    // BUNGA BAWAH DESKTOP
    "assets/images/desktop/bungakiri.webp",
    "assets/images/desktop/bungasampingkiri1.webp",
    "assets/images/desktop/bungasampingkiri2.webp",
    "assets/images/desktop/bungasampingkiri3.webp",
    "assets/images/desktop/bungasampingkiri4.webp",
    "assets/images/desktop/bungakanan.webp",

    // ORNAMEN ATAS DESKTOP
    "assets/images/desktop/Object (13).webp",
    "assets/images/desktop/Object (14).webp",
    "assets/images/desktop/Object (15).webp",

    // POHON SAMPING FULL
    "assets/images/desktop/pohon-samping-full.webp",
  ];

  /* =========================================
   ASSET UMUM - BRYAN & VANESSA
   Digunakan pada invitation.html
========================================= */

  const IMAGES_COMMON = [
    // LOADING SCREEN
    "assets/images/loadingscreen/provite.webp",

    // OPENING INVITATION
    "assets/images/opening/bungaatas.webp",
    "assets/images/opening/bungabawah.webp",

    // PROFILE - BACKGROUND
    "assets/images/event/langit.webp",
    "assets/images/profile/gunung.webp",
    "assets/images/profile/pola.webp",
    "assets/images/profile/layerr.webp",

    // PROFILE - ORNAMEN POHON
    "assets/images/profile/pohonatas.webp",
    "assets/images/profile/pohontengahkiri.webp",
    "assets/images/profile/pohontengahkanan.webp",
    "assets/images/profile/pohonsamping.webp",

    // PROFILE - ORNAMEN BUNGA
    "assets/images/profile/bungakiri.webp",
    "assets/images/profile/bungakanan.webp",
    "assets/images/profile/bungatengahkiri.webp",
    "assets/images/profile/bungatengahkanan.webp",

    // PROFILE - ICON
    "assets/icons/instagram.webp",

    // EVENT DETAIL
    "assets/icons/panah.webp",
    "assets/images/event/balroomsudirman.webp",

    // EVENT DETAIL - ORNAMEN POHON
    "assets/images/event/pohonatas.webp",
    "assets/images/event/pohonataskiri.webp",
    "assets/images/event/pohonsamping.webp",

    // EVENT DETAIL - GAPURA
    "assets/images/event/gapura.webp",

    // EVENT DETAIL - ORNAMEN BUNGA
    "assets/images/event/bungakiri.webp",
    "assets/images/event/bungakanan.webp",
    "assets/images/event/bungatengahkiri.webp",
    "assets/images/event/bungatengahkanan.webp",

    // GALLERY 1
    "assets/images/gallery/foto1.webp",

    // RSVP
    "assets/images/rsvp/gunungsalju.webp",
    "assets/images/rsvp/bungaataskiri.webp",
    "assets/images/rsvp/bungaataskanan.webp",
    "assets/images/rsvp/layer.webp",
    "assets/images/rsvp/pohonbawah.webp",
    "assets/icons/wa.png",

    // WEDDING GIFT
    "assets/images/gift/bg.webp",
    "assets/images/gift/layer.webp",
    "assets/images/gift/pohonatas.webp",
    "assets/images/gift/pohontengahkiri.webp",
    "assets/images/gift/pohontengahkanan.webp",
    "assets/images/gift/pohonsamping.webp",
    "assets/icons/bca.png",

    // GALLERY 2
    "assets/images/gallery2/foto1.webp",

    // WISHES
    "assets/images/wishes/bungaataskiri.webp",
    "assets/images/wishes/bungaataskanan.webp",
    "assets/icons/send.png",
    "assets/icons/pesan.png",

    // THANK YOU
    "assets/images/thankyou/gerbangg.webp",

    // GIF / ANIMASI
    "assets/gift/bird.gif",
    "assets/gift/kupuungu.gif",
    "assets/gift/kupuemas.gif",
  ];

  /* =========================================
     ASET DINAMIS (OPSIONAL)
  ========================================= */

  const DYNAMIC_IMAGES = [];

  /* =========================================
     PILIH ASET SESUAI VIEWPORT
  ========================================= */

  const isDesktop = window.innerWidth >= BREAKPOINT;

  const selectedImages = [
    ...(isDesktop ? IMAGES_DESKTOP : IMAGES_MOBILE),
    ...IMAGES_COMMON,
    ...DYNAMIC_IMAGES,
  ];

  // Hapus URL duplikat
  const imagesToLoad = [
    ...new Set(
      selectedImages.map((src) => new URL(src, document.baseURI).href),
    ),
  ];

  const total = imagesToLoad.length;

  let completed = 0;
  let failed = 0;

  const startedAt = performance.now();

  /* =========================================
     UPDATE PROGRESS
  ========================================= */

  function updateProgress() {
    const progress = total === 0 ? 100 : Math.round((completed / total) * 100);

    loadingBar.style.width = `${progress}%`;
    loadingPercent.textContent = `${progress}%`;
  }

  /* =========================================
     PRELOAD SINGLE IMAGE
  ========================================= */

  function preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();

      let finished = false;

      const timeout = setTimeout(() => {
        finish(false);
      }, MAX_WAIT_PER_IMAGE);

      function finish(success) {
        if (finished) return;

        finished = true;
        clearTimeout(timeout);

        img.onload = null;
        img.onerror = null;

        completed++;

        if (!success) {
          failed++;
          console.warn("[Preloader] Failed:", src);
        }

        updateProgress();
        resolve();
      }

      // Daftarkan handler SEBELUM menetapkan src
      img.onload = () => finish(true);
      img.onerror = () => finish(false);

      img.src = src;

      // Tangani gambar yang sudah ada di cache
      if (img.complete) {
        finish(img.naturalWidth > 0);
      }
    });
  }

  /* =========================================
     REMOVE LOADING SCREEN
  ========================================= */

  function hideLoadingScreen() {
    loadingBar.style.width = "100%";
    loadingPercent.textContent = "100%";

    loadingScreen.style.opacity = "0";
    loadingScreen.style.pointerEvents = "none";

    setTimeout(() => {
      loadingScreen.remove();
    }, 600);
  }

  /* =========================================
     MAIN PRELOADER
  ========================================= */

  async function startPreloading() {
    updateProgress();

    await Promise.all(imagesToLoad.map((src) => preloadImage(src)));

    // Hindari loading berkedip saat semua gambar cached
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    console.log("[Preloader] Finished", {
      total,
      completed,
      failed,
      success: total - failed,
    });

    hideLoadingScreen();
  }

  startPreloading();
});
