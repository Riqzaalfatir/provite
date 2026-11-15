
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

   let photos = [];

function readPhotos() {
  photos = Array.from(
    track.querySelectorAll(".gallery-slide img")
  ).map((img) => ({
    src: img.getAttribute("src"),
    alt: img.getAttribute("alt") || "Wedding photo"
  }));
}

    let currentIndex = 0;
    let autoplayTimer = null;
    let touchStartX = 0;
    let swiped = false;

    function goToSlide(index) {
      currentIndex =
        (index + photos.length) % photos.length;

      track.style.transform =
        `translateX(-${currentIndex * 100}%)`;
    }

    function stopAutoplay() {
      if (autoplayTimer !== null) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (photos.length <= 1) return;

      autoplayTimer = setInterval(() => {
        if (!lightbox.open && !document.hidden) {
          goToSlide(currentIndex + 1);
        }
      }, AUTOPLAY_DELAY);
    }

    function refreshGallery() {
  stopAutoplay();
  readPhotos();

  currentIndex = 0;
  track.style.transform = "translateX(0%)";

  if (photos.length > 0) {
    goToSlide(0);
    startAutoplay();
  }

  console.log(
    `[Gallery] ${trackId}: ${photos.length} foto`
  );
}

    // Klik foto untuk membuka Lightbox
   track.addEventListener("click", (event) => {
  if (swiped) return;

  const slide = event.target.closest(".gallery-slide");
  if (!slide || !track.contains(slide)) return;

  const slides = Array.from(
    track.querySelectorAll(".gallery-slide")
  );

  const index = slides.indexOf(slide);

  if (index >= 0) {
    openLightbox(photos, index);
  }
});

    // Swipe mobile
    track.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].screenX;
        swiped = false;
      },
      { passive: true }
    );

    track.addEventListener(
      "touchend",
      (event) => {
        const touchEndX =
          event.changedTouches[0].screenX;

        const distance = touchEndX - touchStartX;

        if (Math.abs(distance) > 50) {
          swiped = true;

          if (distance < 0) {
            goToSlide(currentIndex + 1);
          } else {
            goToSlide(currentIndex - 1);
          }

          startAutoplay();

          setTimeout(() => {
            swiped = false;
          }, 350);
        }
      },
      { passive: true }
    );
refreshGallery();

galleries.push({
  trackId,
  startAutoplay,
  stopAutoplay,
  refreshGallery
});
  }

  // ==========================
  // LIGHTBOX
  // ==========================

  function applyZoom() {
    lightboxImage.style.transform =
      `scale(${zoomScale})`;

    lightboxImage.style.cursor =
      zoomScale > 1 ? "zoom-out" : "zoom-in";
  }

  function updateLightbox() {
    if (!activePhotos.length) return;

    const photo = activePhotos[lightboxIndex];

    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.alt;

    counter.textContent =
      `${lightboxIndex + 1} / ${activePhotos.length}`;

    zoomScale = 1;
    applyZoom();

    thumbnails.querySelectorAll(
      ".gallery-thumbnail"
    ).forEach((thumbnail, index) => {
      thumbnail.classList.toggle(
        "active",
        index === lightboxIndex
      );
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

    document.documentElement.classList.add(
      "gallery-lightbox-open"
    );

    document.body.classList.add(
      "gallery-lightbox-open"
    );

    updateLightbox();
  }

  function closeLightbox() {
    if (!lightbox.open) return;

    lightbox.close();
  }

  function changeLightboxSlide(direction) {
    if (!activePhotos.length) return;

    lightboxIndex =
      (lightboxIndex + direction + activePhotos.length) %
      activePhotos.length;

    updateLightbox();
  }

  lightbox.addEventListener("close", () => {
    document.documentElement.classList.remove(
      "gallery-lightbox-open"
    );

    document.body.classList.remove(
      "gallery-lightbox-open"
    );

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
      lightboxTouchX =
        event.changedTouches[0].screenX;
    },
    { passive: true }
  );

  lightboxImage.addEventListener(
    "touchend",
    (event) => {
      const distance =
        event.changedTouches[0].screenX -
        lightboxTouchX;

      if (Math.abs(distance) > 50) {
        changeLightboxSlide(distance < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );

  // ==========================
  // JALANKAN KEDUA GALLERY
  // ==========================

  initGallery("galleryTrack");
  initGallery("galleryTrack2");

 window.addEventListener("bryan:gallery-updated", () => {
  galleries.forEach((gallery) => {
    gallery.refreshGallery();
  });
});
});
