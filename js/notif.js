// ================= NOTIF MODAL =================

// LINK WHATSAPP - ISI MANUAL NANTI
const NOTIF_WA_LINK = "";

// PATH GAMBAR ICON - BISA DIUBAH MANUAL
const NOTIF_ICONS = {
  success: "assets/icons/TandaCeklisBg.svg",
  warning: "assets/icons/TandaSeru.svg",
  question: "assets/icons/TandaTanya.svg",
};

// ================= CONFIG NOTIF =================

const NOTIF_CONFIG = {
  rsvp_preview_hadir: {
    icon: "success",
    title: "RSVP PREVIEW",
    messageid:
      "Simulasi konfirmasi kehadiran berhasil ditampilkan. Data tidak dikirim karena periode RSVP telah ditutup.",
    messageen:
      "Attendance confirmation preview completed. No RSVP was submitted because the RSVP period is closed.",
    buttons: [{ label: "Close", action: "close" }],
  },

  rsvp_preview_tidak_hadir: {
    icon: "success",
    title: "RSVP PREVIEW",
    messageid:
      "Simulasi konfirmasi ketidakhadiran berhasil ditampilkan. Data tidak dikirim karena periode RSVP telah ditutup.",
    messageen:
      "Non-attendance confirmation preview completed. No RSVP was submitted because the RSVP period is closed.",
    buttons: [{ label: "Close", action: "close" }],
  },

  rsvp_closed: {
    icon: "warning",
    title: "RSVP CLOSED",
    messageid:
      "Reservasi telah ditutup, terima kasih atas perhatian Anda. Jika ada pertanyaan, tim kami siap membantu.",
    messageen:
      "Reservations are now closed. Thank you for your attention. If you need any assistance, our team is here to help.",
    buttons: [{ label: "Close", action: "close" }],
  },

  private_link: {
    icon: "warning",
    title: "INVITATION ONLY",
    messageid:
      "Undangan ini diperuntukkan bagi tamu yang terdaftar; mohon gunakan tautan undangan yang sesuai.",
    messageen:
      "This invitation is intended for registered guests, please use the assigned invitation link.",
    buttons: [{ label: "Chat with Our Team", action: "wa" }],
  },

  rsvp_confirmed_hadir: {
    icon: "success",
    title: "RSVP CONFIRMED",
    messageid:
      "Konfirmasi kehadiran Anda telah kami terima. Terima kasih atas respons Anda, kami menghargai partisipasi Anda.",
    messageen:
      "Your attendance has been confirmed, we look forward to welcoming you. Thank you for your confirmation.",
    buttons: [{ label: "Close", action: "close" }],
  },

  incomplete_rsvp: {
    icon: "warning",
    title: "INCOMPLETE RSVP",
    messageid:
      "Mohon lengkapi data RSVP sebelum melanjutkan. Beberapa informasi masih belum terisi.",
    messageen:
      "Please complete your RSVP details before proceeding. Some required information is still missing.",
    buttons: [{ label: "Close", action: "close" }],
  },

  session_required: {
    icon: "question",
    title: "SESSION REQUIRED",
    messageid:
      "Pilihan sesi acara masih belum ditentukan. Mohon pilih minimal satu sesi yang akan dihadiri.",
    messageen:
      "Some session selections are still missing. Please select at least one session to attend.",
    buttons: [{ label: "Close", action: "close" }],
  },

  confirm_rsvp: {
    icon: "question",
    title: "CONFIRM RSVP",
    messageid:
      "Apakah Anda yakin dengan pilihan RSVP ini? Silakan lanjutkan untuk mengkonfirmasi pilihan Anda.",
    messageen:
      "Are you sure about your RSVP selection? Please proceed to submit your confirmation.",
    buttons: [
      { label: "Close", action: "close" },
      { label: "Confirm", action: "confirm" },
    ],
  },

  rsvp_unavailable: {
    icon: "warning",
    title: "RSVP UNAVAILABLE",
    messageid:
      "Mohon maaf, kuota tamu untuk sesi ini telah terpenuhi. Silakan hubungi tim kami untuk informasi lebih lanjut.",
    messageen:
      "We apologize, guest capacity for this session has been reached. Please contact our team for further assistance.",
    buttons: [
      { label: "Close", action: "close" },
      { label: "Chat with Our Team", action: "wa" },
    ],
  },

  rsvp_confirmed_tidak_hadir: {
    icon: "success",
    title: "RSVP CONFIRMED",
    messageid:
      "Konfirmasi ketidakhadiran Anda telah kami terima. Terima kasih atas konfirmasi Anda.",
    messageen:
      "Your response has been received. Thank you for your confirmation. We appreciate your response.",
    buttons: [{ label: "Close", action: "close" }],
  },

  incomplete_wishes: {
    icon: "warning",
    title: "INCOMPLETE WISHES",
    messageid:
      "Mohon lengkapi nama dan pesan sebelum mengirim. Beberapa informasi masih belum terisi.",
    messageen:
      "Please fill in your name and message before sending. Some required information is still missing.",
    buttons: [{ label: "Close", action: "close" }],
  },
};

// ================= MODAL LOGIC =================

let notifConfirmCallback = null;
let notifPreviousFocus = null;
let notifPreviousOverflow = "";

function closeNotifModal() {
  const modal = document.getElementById("notifModal");
  if (!modal || modal.style.display === "none") return;

  modal.style.display = "none";
  document.body.style.overflow = notifPreviousOverflow;

  notifConfirmCallback = null;
  notifPreviousFocus?.focus?.();
  notifPreviousFocus = null;
}

function showNotifModal(type, onConfirm = null) {
  const config = NOTIF_CONFIG[type];
  const modal = document.getElementById("notifModal");

  if (!modal || !config) {
    console.warn("Notif modal / type tidak ditemukan:", type);
    return;
  }

  const icon = document.getElementById("notifIconImage");
  const title = document.getElementById("notifTitle");
  const messageId = document.getElementById("notifId");
  const messageEn = document.getElementById("notifEn");
  const buttonContainer = document.getElementById("notifButtons");

  icon.src = NOTIF_ICONS[config.icon];
  icon.alt = config.icon;

  title.textContent = config.title;
  messageId.textContent = config.messageid;
  messageEn.textContent = config.messageen;

  notifConfirmCallback = onConfirm;

  buttonContainer.replaceChildren();

  config.buttons.forEach((button, index) => {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.textContent = button.label;

    if (button.action === "wa") {
      const waIcon = document.createElement("img");
      waIcon.src = "assets/icons/wa.png";
      waIcon.alt = "";
      waIcon.className = "h-[14px] w-[14px] object-contain";

      btn.prepend(waIcon);
    }

    btn.className = [
      "flex flex-1 items-center justify-center gap-1.5",
      "font-sans text-[14px] text-[#605F5E]",
      "transition-colors duration-150",
      "md:text-[21px]",
      button.action === "close" ? "font-normal" : "font-bold",
      index < config.buttons.length - 1 ? "border-r border-[#E0E0D8]" : "",
    ].join(" ");

    // ID kompatibel dengan markup lama
    if (button.action === "close") btn.id = "notifClose";
    if (button.action === "confirm") btn.id = "notifOk";

    btn.addEventListener("click", () => {
      if (button.action === "close") {
        closeNotifModal();
      }

      if (button.action === "wa") {
        if (!NOTIF_WA_LINK) {
          console.warn("Link WhatsApp belum diatur.");
          return;
        }

        window.open(NOTIF_WA_LINK, "_blank", "noopener,noreferrer");
      }

      if (button.action === "confirm") {
        const callback = notifConfirmCallback;
        closeNotifModal();

        if (typeof callback === "function") {
          callback();
        }
      }
    });

    buttonContainer.appendChild(btn);
  });

  if (modal.style.display === "none") {
    notifPreviousFocus = document.activeElement;
    notifPreviousOverflow = document.body.style.overflow;
  }

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  // Ulangi animasi saat modal dibuka
  const animation = modal.querySelector(".notif-anim");
  animation.style.animation = "none";
  void animation.offsetWidth;
  animation.style.animation = "";

  buttonContainer.querySelector("button")?.focus();
}

// Tutup ketika klik backdrop
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("notifModal");

  if (!modal) return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeNotifModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.style.display !== "none") {
      closeNotifModal();
    }
  });
});

// Bisa dipanggil dari rsvp.js dan wishes.js
window.showNotifModal = showNotifModal;
window.closeNotifModal = closeNotifModal;
