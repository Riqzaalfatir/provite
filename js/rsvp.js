
(function () {
  const btnAttend = document.getElementById("rsvpAttend");
  const btnUnable = document.getElementById("rsvpUnable");
  const btnConfirm = document.getElementById("rsvpConfirmBtn");

  if (!btnAttend || !btnUnable || !btnConfirm) return;

  /* ---------- PILIHAN ATTEND / UNABLE ---------- */

  let choice = null; // "attend" | "unable" | null

  function paint(btn, active) {
    btn.style.backgroundColor = active ? "#4B3D2A" : "transparent";
    btn.style.color = active ? "#fff" : "#4B4B44";

    btn.setAttribute(
      "aria-pressed",
      active ? "true" : "false"
    );
  }

  function select(value) {
    choice = value;

    paint(btnAttend, value === "attend");
    paint(btnUnable, value === "unable");

    btnConfirm.innerHTML =
      value === "attend"
        ? "Confirm<br />Attendance"
        : "Confirm Unable<br />To Attend";
  }

  btnAttend.addEventListener("click", function () {
    select("attend");
  });

  btnUnable.addEventListener("click", function () {
    select("unable");
  });

  /* ---------- TOMBOL CONFIRM ---------- */

  btnConfirm.addEventListener("click", function () {

    // Belum memilih Attend / Unable
    if (!choice) {
      window.showNotifModal("incomplete_rsvp");
      return;
    }

    // Simpan pilihan saat tombol diklik
    const selectedChoice = choice;

    // Tampilkan modal konfirmasi
    window.showNotifModal("confirm_rsvp", function () {

      // TODO:
      // Kirim selectedChoice ke API / backend di sini.
      // Untuk sementara hanya simulasi konfirmasi.

      if (selectedChoice === "attend") {
        window.showNotifModal("rsvp_confirmed_hadir");
      } else {
        window.showNotifModal("rsvp_confirmed_tidak_hadir");
      }

    });

  });

})();
