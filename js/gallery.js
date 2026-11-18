document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("galleryLightbox");

  if (!lightbox) return;

  const lightboxImage = document.getElementById("galleryLightboxImage");
  const counter = document.getElementById("galleryCounter");
  const thumbnails = document.getElementById("galleryThumbnails");

  const closeButton = document.getElementById("galleryClose");
  const prevButton = document.getElementById("galleryPrev");
  const nextButton = document.getElementById("galleryNext");
  const zoomInButton = document.getElementById("galleryZoomIn");
  const zoomOutButton = document.getElementById("galleryZoomOut");

  const AUTOPLAY_DELAY = 4000;

  const galleries = [];
  let activePhotos = [];
  let lightboxIndex = 0;
  let savedScrollY = 0;
  let zoomScale = 1;
  let lightboxTouchX = 0;

  // ==========================
  // SETUP GALLERY 1 & 2
  // ==========================

  function initGallery(trackId) {
    const track = document.getElementById(trackId);
    if (!track) return;

    const viewport = track.parentElement;

    let photos = [];
    let slides = [];
    let currentIndex = 0;
    let autoplayTimer = null;
    let resizeTimer = null;
    let touchStartX = 0;
    let swiped = false;
    let refreshToken = 0;

    // =====================================
    // 1. BACA FOTO ASLI
    // =====================================
    function readPhotos() {
      const originalImages = [
        ...track.querySelectorAll(
          ".gallery-slide:not([data-gallery-generated]) img",
        ),
      ];

      if (originalImages.length > 0) {
        photos = originalImages.map((img) => ({
          src: img.getAttribute("src"),
          alt: img.getAttribute("alt") || "Wedding photo",
          ratio: null,
        }));
      }
    }

    // =====================================
    // 2. DETEKSI RASIO FOTO
    // =====================================
    function detectRatio(photo) {
      return new Promise((resolve) => {
        const probe = new Image();

        probe.onload = () => {
          resolve(
            probe.naturalHeight > 0
              ? probe.naturalWidth / probe.naturalHeight
              : 0.65,
          );
        };

        probe.onerror = () => resolve(0.65);
        probe.src = photo.src;
      });
    }

    // =====================================
    // 3. BUAT PANEL GALLERY
    // =====================================

    function createPanel(photo, photoIndex) {
      const slide = document.createElement("div");

      slide.className = "gallery-slide";
      slide.dataset.galleryGenerated = "true";
      slide.dataset.photoIndex = String(photoIndex);

      const width = viewport.clientWidth;

      slide.style.width = `${width}px`;
      slide.style.flex = `0 0 ${width}px`;
      slide.style.height = "100%";

      const img = document.createElement("img");

      img.src = photo.src;
      img.alt = photo.alt;
      img.draggable = false;

      img.onerror = function () {
        this.onerror = null;
        this.src = "assets/images/gallery2/foto1.webp";
      };

      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = photo.ratio > 1 ? "contain" : "cover";
      img.style.objectPosition = "center";

      slide.appendChild(img);

      return slide;
    }

    // =====================================
    // 4. RENDER SLIDE PORTRAIT / LANDSCAPE
    // =====================================
    function buildSlides() {
      const fragment = document.createDocumentFragment();

      slides = [];

      photos.forEach((photo, photoIndex) => {
        fragment.appendChild(createPanel(photo, photoIndex));
        slides.push({ photoIndex });
      });

      track.replaceChildren(fragment);
    }

    // =====================================
    // 5. GESER SLIDE KE TENGAH
    // =====================================
    function goToSlide(index) {
      if (!slides.length) return;

      currentIndex = (index + slides.length) % slides.length;

      const slideWidth = viewport.clientWidth;

      track.style.transform = `translate3d(-${currentIndex * slideWidth}px, 0, 0)`;
    }

    // =====================================
    // 6. AUTOPLAY
    // =====================================
    function stopAutoplay() {
      if (autoplayTimer !== null) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (slides.length <= 1) return;

      autoplayTimer = setInterval(() => {
        if (!lightbox.open && !document.hidden) {
          goToSlide(currentIndex + 1);
        }
      }, AUTOPLAY_DELAY);
    }

    // =====================================
    // 7. REFRESH DARI API
    // =====================================
    async function refreshGallery() {
      const token = ++refreshToken;

      stopAutoplay();
      readPhotos();

      if (!photos.length) return;

      const ratios = await Promise.all(photos.map(detectRatio));

      if (token !== refreshToken) return;

      photos.forEach((photo, index) => {
        photo.ratio = ratios[index];
      });

      buildSlides();

      currentIndex = 0;

      requestAnimationFrame(() => {
        if (token !== refreshToken) return;

        goToSlide(currentIndex);
        startAutoplay();
      });
    }

    // =====================================
    // 8. KLIK FOTO -> LIGHTBOX ASLI
    // =====================================
    track.addEventListener("click", (event) => {
      if (swiped) return;

      const slide = event.target.closest(".gallery-slide");
      if (!slide || !track.contains(slide)) return;

      const photoIndex = Number(slide.dataset.photoIndex);

      if (Number.isInteger(photoIndex) && photos[photoIndex]) {
        openLightbox(photos, photoIndex);
      }
    });

    // =====================================
    // 9. SWIPE MOBILE
    // =====================================
    track.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].screenX;
        swiped = false;
      },
      { passive: true },
    );

    track.addEventListener(
      "touchend",
      (event) => {
        const distance = event.changedTouches[0].screenX - touchStartX;

        if (Math.abs(distance) > 50) {
          swiped = true;

          goToSlide(currentIndex + (distance < 0 ? 1 : -1));

          startAutoplay();

          setTimeout(() => {
            swiped = false;
          }, 350);
        }
      },
      { passive: true },
    );

    // =====================================
    // 10. RESPONSIVE
    // =====================================
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        if (!photos.length) return;

        buildSlides();
        goToSlide(currentIndex);
      }, 150);
    });

    refreshGallery();

    galleries.push({
      trackId,
      startAutoplay,
      stopAutoplay,
      refreshGallery,
    });
  }

  // ==========================
  // LIGHTBOX
  // ==========================

  function applyZoom() {
    lightboxImage.style.transform = `scale(${zoomScale})`;

    lightboxImage.style.cursor = zoomScale > 1 ? "zoom-out" : "zoom-in";
  }

  function updateLightbox() {
    if (!activePhotos.length) return;

    const photo = activePhotos[lightboxIndex];

    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;

    counter.textContent = `${lightboxIndex + 1} / ${activePhotos.length}`;

    zoomScale = 1;
    applyZoom();

    thumbnails
      .querySelectorAll(".gallery-thumbnail")
      .forEach((thumbnail, index) => {
        thumbnail.classList.toggle("active", index === lightboxIndex);
      });

    thumbnails.children[lightboxIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  function createThumbnails() {
    thumbnails.replaceChildren();

    activePhotos.forEach((photo, index) => {
      const thumbnail = document.createElement("img");

      thumbnail.src = photo.src;
      thumbnail.alt = `Thumbnail ${index + 1}`;
      thumbnail.className = "gallery-thumbnail";
      thumbnail.loading = "lazy";

      thumbnail.addEventListener("click", () => {
        lightboxIndex = index;
        updateLightbox();
      });

      thumbnails.appendChild(thumbnail);
    });
  }

  function openLightbox(photos, index) {
    if (lightbox.open) return;

    activePhotos = photos;
    lightboxIndex = index;
    savedScrollY = window.scrollY;

    galleries.forEach((gallery) => {
      gallery.stopAutoplay();
    });

    createThumbnails();

    lightbox.showModal();

    document.documentElement.classList.add("gallery-lightbox-open");

    document.body.classList.add("gallery-lightbox-open");

    updateLightbox();
  }

  function closeLightbox() {
    if (!lightbox.open) return;

    lightbox.close();
  }

  function changeLightboxSlide(direction) {
    if (!activePhotos.length) return;

    lightboxIndex =
      (lightboxIndex + direction + activePhotos.length) % activePhotos.length;

    updateLightbox();
  }

  lightbox.addEventListener("close", () => {
    document.documentElement.classList.remove("gallery-lightbox-open");

    document.body.classList.remove("gallery-lightbox-open");

    window.scrollTo({
      top: savedScrollY,
      behavior: "instant",
    });

    galleries.forEach((gallery) => {
      gallery.startAutoplay();
    });
  });

  // ==========================
  // LIGHTBOX CONTROLS
  // ==========================

  closeButton.addEventListener("click", closeLightbox);

  prevButton.addEventListener("click", () => {
    changeLightboxSlide(-1);
  });

  nextButton.addEventListener("click", () => {
    changeLightboxSlide(1);
  });

  zoomInButton.addEventListener("click", () => {
    zoomScale = Math.min(zoomScale + 0.5, 3);
    applyZoom();
  });

  zoomOutButton.addEventListener("click", () => {
    zoomScale = Math.max(zoomScale - 0.5, 1);
    applyZoom();
  });

  lightboxImage.addEventListener("click", () => {
    zoomScale = zoomScale === 1 ? 2 : 1;
    applyZoom();
  });

  // Navigasi keyboard
  document.addEventListener("keydown", (event) => {
    if (!lightbox.open) return;

    if (event.key === "ArrowRight") {
      changeLightboxSlide(1);
    }

    if (event.key === "ArrowLeft") {
      changeLightboxSlide(-1);
    }
  });

  // Klik backdrop
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  // Swipe Lightbox
  lightboxImage.addEventListener(
    "touchstart",
    (event) => {
      lightboxTouchX = event.changedTouches[0].screenX;
    },
    { passive: true },
  );

  lightboxImage.addEventListener(
    "touchend",
    (event) => {
      const distance = event.changedTouches[0].screenX - lightboxTouchX;

      if (Math.abs(distance) > 50) {
        changeLightboxSlide(distance < 0 ? 1 : -1);
      }
    },
    { passive: true },
  );

  // ==========================
  // JALANKAN GALLERY 2 SAJA
  // ==========================

  initGallery("galleryTrack2");

  window.addEventListener("bryan:gallery-updated", () => {
    galleries.forEach((gallery) => {
      gallery.refreshGallery();
    });
  });
});
