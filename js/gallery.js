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
  const dotsContainer = document.getElementById("gallery2Dots");

let dotButtons = [];
  const prevArrow = document.getElementById("gallery2Prev");
const nextArrow = document.getElementById("gallery2Next");

  let photos = [];
  let slides = [];
  let currentIndex = 0;
  let autoplayTimer = null;
  let resizeTimer = null;
  let refreshToken = 0;
  let touchStartX = 0;
  let swiped = false;

  const FALLBACK = "assets/images/gallery2/foto1.webp";

  // =====================================
  // 1. BACA FOTO DARI HTML / API
  // =====================================
  function readPhotos() {
    const images = [
      ...track.querySelectorAll(
        ".gallery-slide:not([data-gallery-generated]) img"
      )
    ];

    if (!images.length) return;

    photos = images.map((img) => ({
      src: img.getAttribute("src"),
      alt: img.alt || "Wedding photo",
      ratio: 0.6
    }));
  }

  // =====================================
  // 2. DETEKSI RASIO FOTO ASLI
  // =====================================
  function detectPhoto(photo) {
    return new Promise((resolve) => {
      const probe = new Image();

      probe.onload = () => {
        resolve({
          ...photo,
          ratio: probe.naturalHeight
            ? probe.naturalWidth / probe.naturalHeight
            : 0.6
        });
      };

      probe.onerror = () => {
        if (probe.src.endsWith(FALLBACK)) {
          resolve({ ...photo, ratio: 0.6 });
        } else {
          probe.src = FALLBACK;
          photo.src = FALLBACK;
        }
      };

      probe.src = photo.src;
    });
  }

  // =====================================
  // 3. BUAT PANEL FOTO
  // =====================================
  function createPanel(photo, photoIndex, part, height) {
    const isLandscape = photo.ratio > 1;

   const PORTRAIT_RATIO = 2 / 3.5;

const width = isLandscape
  ? (height * photo.ratio) / 3
  : height * PORTRAIT_RATIO;

    const slide = document.createElement("div");

    slide.className = "gallery-slide";
    slide.dataset.galleryGenerated = "true";
    slide.dataset.photoIndex = String(photoIndex);

    slide.style.width = `${Math.ceil(width)}px`;
    slide.style.flex = `0 0 ${Math.ceil(width)}px`;
    slide.style.height = "100%";

    if (isLandscape) {
      const visual = document.createElement("div");

      visual.className = "gallery-landscape-visual";

      visual.style.backgroundImage = `url("${photo.src}")`;
      visual.style.backgroundSize = "300% 100%";
      visual.style.backgroundPosition = `${part * 50}% center`;
      visual.style.backgroundRepeat = "no-repeat";

      slide.appendChild(visual);
    } else {
      const img = document.createElement("img");

      img.src = photo.src;
      img.alt = photo.alt;
      img.draggable = false;
      img.style.objectFit = "cover";

      slide.appendChild(img);
    }

    const dim = document.createElement("div");
    dim.className = "gallery-slide-dim";

    slide.appendChild(dim);

    return slide;
  }

  // =====================================
  // 4. BUAT SLIDE + LOOP
  // =====================================
  function buildSlides() {
    const height = viewport.clientHeight || 546;

    const originalSlides = [];

    photos.forEach((photo, photoIndex) => {
      if (photo.ratio > 1) {
        for (let part = 0; part < 3; part++) {
          originalSlides.push({ photoIndex, part });
        }
      } else {
        originalSlides.push({ photoIndex, part: null });
      }
    });

    // Tiga salinan agar slide sebelumnya/berikutnya
    // tetap mengisi sisi Gallery ketika looping.
    slides = [
      ...originalSlides,
      ...originalSlides,
      ...originalSlides
    ];

    const fragment = document.createDocumentFragment();

    slides.forEach(({ photoIndex, part }) => {
      fragment.appendChild(
        createPanel(
          photos[photoIndex],
          photoIndex,
          part,
          height
        )
      );
    });

    track.replaceChildren(fragment);

    return originalSlides.length;
  }

  function getOriginalCount() {
    return slides.length / 3;
  }


function renderDots() {
  if (!dotsContainer) return;

  dotsContainer.replaceChildren();
  dotButtons = [];

  photos.forEach((photo, photoIndex) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "gallery2-dot";
    dot.setAttribute(
      "aria-label",
      `Go to photo ${photoIndex + 1}`
    );

    const isLandscape = photo.ratio > 1;

    dot.dataset.inactiveWidth = isLandscape ? "22" : "14";
    dot.dataset.activeWidth = isLandscape ? "36" : "24";

    dot.style.width = `${dot.dataset.inactiveWidth}px`;

    dot.addEventListener("click", () => {
      const count = getOriginalCount();

      const relativeIndex = slides
        .slice(0, count)
        .findIndex(
          (slide) =>
            slide.photoIndex === photoIndex &&
            (slide.part === null || slide.part === 1)
        );

      if (relativeIndex < 0) return;

      goToSlide(count + relativeIndex);
      startAutoplay();
    });

    dotsContainer.appendChild(dot);
    dotButtons.push(dot);
  });
}

function updateDots(photoIndex) {
  dotButtons.forEach((dot, index) => {
    const active = index === photoIndex;

    dot.classList.toggle("active", active);

    dot.style.width = active
      ? `${dot.dataset.activeWidth}px`
      : `${dot.dataset.inactiveWidth}px`;

    dot.setAttribute("aria-current", active ? "true" : "false");
  });
}


  // =====================================
  // 5. POSISI SLIDE DI TENGAH
  // =====================================
  function positionSlide() {
    const slide = track.children[currentIndex];
    if (!slide) return;

    const offset =
      slide.offsetLeft -
      (viewport.clientWidth - slide.offsetWidth) / 2;

    track.style.transform =
      `translate3d(${-offset}px, 0, 0)`;

    const selectedPhotoIndex =
      Number(slide.dataset.photoIndex);
      updateDots(selectedPhotoIndex);

    [...track.children].forEach((panel) => {
      const dim = panel.querySelector(".gallery-slide-dim");

      if (dim) {
        dim.style.opacity =
          Number(panel.dataset.photoIndex) === selectedPhotoIndex
            ? "0"
            : "0.5";
      }
    });
  }

  function goToSlide(index) {
    if (!slides.length) return;

    currentIndex = index;
    positionSlide();
  }

  // Setelah melewati salinan tengah,
  // pindahkan posisi tanpa animasi.
  track.addEventListener("transitionend", (event) => {
    if (event.target !== track ||
        event.propertyName !== "transform") return;

    const count = getOriginalCount();
    if (!count) return;

    if (currentIndex < count ||
        currentIndex >= count * 2) {

      currentIndex =
        ((currentIndex % count) + count) % count + count;

      track.style.transition = "none";
      positionSlide();

      void track.offsetWidth;
      track.style.transition = "";
    }
  });

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

    if (getOriginalCount() <= 1) return;

    autoplayTimer = setInterval(() => {
      if (!lightbox.open && !document.hidden) {
        goToSlide(currentIndex + 1);
      }
    }, AUTOPLAY_DELAY);
  }

  // =====================================
  // 7. REFRESH FOTO DARI API
  // =====================================
  async function refreshGallery() {
    const token = ++refreshToken;

    stopAutoplay();
    readPhotos();

    if (!photos.length) return;

    const results = await Promise.all(
      photos.map(detectPhoto)
    );

    if (token !== refreshToken) return;

    photos = results;

    const count = buildSlides();
renderDots();

    // Mulai dari salinan tengah.
    // Jika foto pertama landscape, tampilkan panel tengah.
    currentIndex =
      count + (photos[0]?.ratio > 1 ? 1 : 0);

    track.style.transition = "none";
    positionSlide();

    requestAnimationFrame(() => {
      if (token !== refreshToken) return;

      track.style.transition = "";
      startAutoplay();
    });

    console.log(
      `[Gallery] ${trackId}: ${photos.length} foto, ${count} panel`
    );
  }

  // =====================================
  // 8. LIGHTBOX FOTO ASLI
  // =====================================
  track.addEventListener("click", (event) => {
    if (swiped) return;

    const slide = event.target.closest(".gallery-slide");

    if (!slide || !track.contains(slide)) return;

    const photoIndex = Number(slide.dataset.photoIndex);

    if (photos[photoIndex]) {
      openLightbox(photos, photoIndex);
    }
  });

  // =====================================
  // 9. SWIPE MOBILE
  // =====================================
  track.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
    swiped = false;
  }, { passive: true });

  track.addEventListener("touchend", (event) => {
    const distance =
      event.changedTouches[0].screenX - touchStartX;

    if (Math.abs(distance) > 50) {
      swiped = true;

      goToSlide(
        currentIndex + (distance < 0 ? 1 : -1)
      );

      startAutoplay();

      setTimeout(() => {
        swiped = false;
      }, 350);
    }
  }, { passive: true });

  // =====================================
  // 10. RESPONSIVE
  // =====================================
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      if (!photos.length) return;

      const count = getOriginalCount();
      const relativeIndex = count
        ? ((currentIndex % count) + count) % count
        : 0;

      const newCount = buildSlides();

      currentIndex = newCount + relativeIndex;

      track.style.transition = "none";
      positionSlide();

      requestAnimationFrame(() => {
        track.style.transition = "";
      });
    }, 150);
  });

 // ARROW KIRI
prevArrow?.addEventListener("click", () => {
  goToSlide(currentIndex - 1);
  startAutoplay();
});

// ARROW KANAN
nextArrow?.addEventListener("click", () => {
  goToSlide(currentIndex + 1);
  startAutoplay();
});

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
