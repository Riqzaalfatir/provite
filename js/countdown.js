
(function () {
  const FALLBACK_DATE = "2026-12-18T18:00:24";
  const pad = (n) => String(n).padStart(2, "0");

  let interval = null;

  // API menggunakan waktu Indonesia (WIB / UTC+7)
  function parseEventDate(value) {
    if (!value || typeof value !== "string") return null;

    const normalized = value.trim();
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(normalized);

    const date = new Date(
      hasTimezone ? normalized : normalized + "+07:00"
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function updateCountdown(target) {
    const distance = Math.max(0, target.getTime() - Date.now());

    const values = {
      countdownDays: Math.floor(distance / 86400000),
      countdownHours: Math.floor((distance % 86400000) / 3600000),
      countdownMinutes: Math.floor((distance % 3600000) / 60000),
      countdownSeconds: Math.floor((distance % 60000) / 1000)
    };

    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = pad(value);
    });

    if (distance === 0 && interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function renderDate(target) {
    const element = document.getElementById("countdownWeddingDate");
    if (!element) return;

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).formatToParts(target);

    const get = (type) => parts.find(p => p.type === type)?.value || "";

    const day = Number(get("day"));
    const suffix =
      day % 100 >= 11 && day % 100 <= 13 ? "th" :
      day % 10 === 1 ? "st" :
      day % 10 === 2 ? "nd" :
      day % 10 === 3 ? "rd" : "th";

    element.replaceChildren(
      document.createTextNode(`${get("weekday")}, ${day}`),
      Object.assign(document.createElement("sup"), {
        className: "text-[3.59vw] md:text-[14px]",
        textContent: suffix
      }),
      document.createTextNode(` ${get("month")} ${get("year")}`)
    );
  }

  function startCountdown(dateString) {
    const target =
      parseEventDate(dateString) ||
      parseEventDate(FALLBACK_DATE);

    if (interval) clearInterval(interval);

    renderDate(target);
    updateCountdown(target);

    if (target.getTime() > Date.now()) {
      interval = setInterval(() => updateCountdown(target), 1000);
    }
  }

  // Mulai dari tanggal fallback
  function init() {
    const eventDate = window.BryanApp?.state?.dataEvent?.date;
    startCountdown(eventDate || FALLBACK_DATE);
  }

  // Perbarui otomatis ketika API sudah selesai
  window.addEventListener("bryan:data-ready", (event) => {
    startCountdown(event.detail?.dataEvent?.date || FALLBACK_DATE);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
