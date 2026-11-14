
/* ================= SCROLL ANIMATION ================= */

document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(
    ".fade-up, .fade-in, .fade-left, .fade-right"
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");

          // Animasi hanya berjalan sekali
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  elements.forEach((element) => {
    observer.observe(element);
  });
});
