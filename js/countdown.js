(function () {
  // Friday, 18 December 2026, 00:00 WIB. Ubah jam di sini kalau perlu.
  const target = new Date("2026-12-18T00:00:00+07:00").getTime();

  const elDays = document.getElementById("cdDays");
  const elHours = document.getElementById("cdHours");
  const elMinutes = document.getElementById("cdMinutes");
  const elSeconds = document.getElementById("cdSeconds");

  if (!elDays || !elHours || !elMinutes || !elSeconds) return;

  const pad = (n) => String(n).padStart(2, "0");
  let timer;

  function tick() {
    const diff = target - Date.now();

    if (diff <= 0) {
      elDays.textContent = "00";
      elHours.textContent = "00";
      elMinutes.textContent = "00";
      elSeconds.textContent = "00";
      clearInterval(timer);
      return;
    }

    elDays.textContent = pad(Math.floor(diff / 86400000));
    elHours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    elMinutes.textContent = pad(Math.floor((diff % 3600000) / 60000));
    elSeconds.textContent = pad(Math.floor((diff % 60000) / 1000));
  }

  tick();
  timer = setInterval(tick, 1000);
})();