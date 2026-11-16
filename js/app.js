
(function () {
  const state = {
    dataEvent: null,
    dataContent: null,
    dataSession: [],
    guest: null,
    pin: null,
    url: null,
    status: "idle",
    error: null
  };

  const unwrap = (result) => {
    const data = result?.data;
    return data?.data ?? data ?? null;
  };


function renderOpeningGuest() {
  const guestName = state.guest?.name;

  if (!guestName) return;

  // Opening Invitation di dalam iframe
  const guestElement = document.getElementById("openingGuestName");

  if (guestElement) {
    guestElement.textContent = guestName;
  }

  // Beri tahu index.html untuk sinkronisasi
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: "BRYAN_GUEST_READY",
        guestName: guestName
      },
      window.location.origin
    );
  }
}


function renderOpeningEvent() {
  const event = state.dataEvent;
  if (!event) return;

  // 1. Nama pengantin
  const coupleElement = document.getElementById("openingCoupleName");

  if (coupleElement && event.groomName && event.brideName) {
    coupleElement.textContent =
      `${event.groomName} & ${event.brideName}`;
  }

  // 2. Tanggal pernikahan
  const dateElement = document.getElementById("openingWeddingDate");

  if (dateElement && event.date) {
    const date = new Date(event.date);

    if (!Number.isNaN(date.getTime())) {
      const weekday = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Asia/Jakarta"
      }).format(date);

      const month = new Intl.DateTimeFormat("en-US", {
        month: "long",
        timeZone: "Asia/Jakarta"
      }).format(date);

      const day = date.getDate();
      const year = date.getFullYear();

      const suffix =
        day % 10 === 1 && day !== 11 ? "ST" :
        day % 10 === 2 && day !== 12 ? "ND" :
        day % 10 === 3 && day !== 13 ? "RD" : "TH";

      dateElement.replaceChildren(
        document.createTextNode(`${weekday}, ${day}`),
        Object.assign(document.createElement("sup"), {
          textContent: suffix
        }),
        document.createTextNode(` ${month} ${year}`)
      );
    }
  }

  // 3. Kirim data Opening untuk sinkronisasi desktop
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: "BRYAN_OPENING_EVENT_READY",
        groomName: event.groomName,
        brideName: event.brideName,
        dateHTML: dateElement?.innerHTML ?? ""
      },
      window.location.origin
    );
  }
}



function renderProfile() {
  const event = state.dataEvent;
  if (!event) return;

  // Menampilkan dua baris tanpa menghilangkan data API.
  function setTwoLines(elementId, firstLine, secondLine) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const line1 = document.createElement("span");
    line1.className = "block whitespace-nowrap";
    line1.textContent = firstLine;

    const line2 = document.createElement("span");
    line2.className = "block whitespace-nowrap";
    line2.textContent = secondLine;

    element.replaceChildren(line1, line2);
  }

  // Nama: pisahkan sebelum kata terakhir.
  function splitName(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/);

    if (parts.length <= 1) {
      return [parts[0] || "", ""];
    }

    return [
      parts.slice(0, -1).join(" "),
      parts[parts.length - 1]
    ];
  }

  // Orang tua: baris kedua dimulai setelah simbol &.
  function splitParents(parentNames) {
    const value = String(parentNames || "").trim();
    const separator = value.indexOf("&");

    if (separator === -1) {
      return [value, ""];
    }

    return [
      value.slice(0, separator + 1).trim(),
      value.slice(separator + 1).trim()
    ];
  }

  // ===== GROOM =====
  const groomName = splitName(
    event.groomFullName || "Bryan Hans Sundjaja"
  );

  const groomParents = splitParents(
    event.groomParent ||
    "Mr. Handy Sundjaja & Mrs. Lenny Simon"
  );

  setTwoLines("profileGroomName", ...groomName);
  setTwoLines("profileGroomParent", ...groomParents);

  // ===== BRIDE =====
  const brideName = splitName(
    event.brideFullName || "Vanessa Reygina Agatha"
  );

  const brideParents = splitParents(
    event.brideParent ||
    "Mr. Aan Fredyan Hermawan & Mrs. Anita Theresia"
  );

  setTwoLines("profileBrideName", ...brideName);
  setTwoLines("profileBrideParent", ...brideParents);
}




function renderEventDetail() {
  const event = state.dataEvent;
  const eventId = event?.id;
  const sessions = Array.isArray(state.dataSession)
    ? state.dataSession
    : [];

  const list = document.getElementById("eventSessionList");
  if (!list || !eventId) return;

  const ZERO_ID = "00000000-0000-0000-0000-000000000000";

  // Hanya sesi yang memang dikembalikan untuk PIN tamu.
  const validSessions = sessions
    .filter((s) =>
      s &&
      (s.eventId === eventId || s.eventId === ZERO_ID)
    )
    .sort((a, b) =>
      String(a.date || "").localeCompare(String(b.date || ""))
    );

  const cards = Array.from(
    list.querySelectorAll("[data-event-session]")
  );

  const divider = document.getElementById("eventSessionDivider");

  function formatTime(dateString) {
    // Format API: 2026-12-18T11:30:46
    // Jam ini sudah merupakan waktu lokal event (WIB).
    const match = String(dateString || "")
      .match(/T(\d{2}):(\d{2})/);

    return match ? `${match[1]}.${match[2]} WIB` : "";
  }

  // Jika tidak ada sesi yang terverifikasi,
  // jangan tampilkan sesi statis sebagai akses tamu.
  if (validSessions.length === 0) {
    list.hidden = true;
    console.warn("[BryanApp] Tidak ada sesi untuk PIN ini");
    return;
  }

  // Isi setiap kartu sesuai urutan sesi dari API.
  // Desain awal menyediakan dua kartu.
  cards.forEach((card, index) => {
    const session = validSessions[index];

    card.hidden = !session;
    if (!session) return;

    const name = card.querySelector("[data-session-name]");
    const time = card.querySelector("[data-session-time]");

    if (name && session.name?.trim()) {
      name.textContent = session.name.trim();
    }

    const formattedTime = formatTime(session.date);

    if (time && formattedTime) {
      time.textContent = formattedTime;
    }
  });

  // Titik pemisah hanya muncul bila ada dua sesi.
  if (divider) {
    divider.hidden = validSessions.length < 2;
  }

  list.hidden = false;

  // Venue mengikuti sesi yang dialokasikan ke tamu.
  const venue = validSessions.find(
    (s) => s.address || s.latLong
  );

  const venueName = document.getElementById("eventVenueName");
  const venueAddress = document.getElementById("eventVenueAddress");
  const mapLink = document.getElementById("eventMapLink");

  // Nama venue API kosong -> fallback statis tetap.
  if (venueName && venue?.addressName?.trim()) {
    const name = venue.addressName.trim();

    if (!/^at\s/i.test(name)) {
      venueName.textContent = name;
    }
  }

  // Untuk menjaga layout, pertahankan alamat singkat statis
  // jika alamat API terlalu panjang.
  if (
    venueAddress &&
    venue?.address?.trim() &&
    venue.address.trim().length <= 65
  ) {
    venueAddress.textContent = venue.address.trim();
  }

  // Bangun tautan Google Maps dari koordinat API.
  if (mapLink && venue?.latLong) {
    const coords = String(venue.latLong).trim();

    if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(coords)) {
      mapLink.href =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(coords);
    }
  }

  console.log(
    "[BryanApp] Event Detail:",
    validSessions.map((s) => ({
      name: s.name,
      time: formatTime(s.date)
    }))
  );
}




function renderGallery() {
  const galleryData = state.dataContent?.galleryImageData;

  // Jika API kosong, Gallery 1 dan 2 tetap statis.
  if (!Array.isArray(galleryData) || !galleryData.length) {
    console.log("[BryanApp] Gallery 1 & 2 fallback lokal");
    return;
  }

  const MEDIA_BASE = "https://media.twinklebook.com/";

  const photos = galleryData
    .map((item) => {
      const raw = item?.url?.trim();
      if (!raw) return null;

      try {
        const url = new URL(raw, MEDIA_BASE);

        if (
          url.protocol !== "https:" ||
          url.hostname !== "media.twinklebook.com"
        ) {
          return null;
        }

        return url.href;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!photos.length) return;

  function updateTrack(trackId, fallback) {
    const track = document.getElementById(trackId);
    if (!track) return;

    const fragment = document.createDocumentFragment();

    photos.forEach((src, index) => {
      const slide = document.createElement("div");
      slide.className = "gallery-slide";

      const img = document.createElement("img");
      img.src = src;
      img.alt = `Bryan and Vanessa - Photo ${index + 1}`;
      img.className = "h-full w-full select-none object-cover";
      img.draggable = false;

      img.onerror = function () {
        this.onerror = null;
        this.src = fallback;
      };

      slide.appendChild(img);
      fragment.appendChild(slide);
    });

    track.replaceChildren(fragment);
  }

  // Gallery 1
  updateTrack(
    "galleryTrack",
    "assets/images/gallery/foto1.webp"
  );

  // Gallery 2
  updateTrack(
    "galleryTrack2",
    "assets/images/gallery2/foto1.webp"
  );

  // Refresh kedua slider dan lightbox.
  window.dispatchEvent(new Event("bryan:gallery-updated"));

  console.log(
    "[BryanApp] Gallery 1 & 2 updated:",
    photos.length,
    "foto per gallery"
  );
}


function renderRSVP() {
  const event = state.dataEvent;
  const guest = state.guest;

  if (!event) return;

  // ===========================
  // 1. NAMA TAMU
  // ===========================
  const guestElement = document.getElementById("rsvpGuestName");

  if (guestElement && guest?.name?.trim()) {
    guestElement.textContent = guest.name.trim();
  }

  // ===========================
  // 2. DEADLINE RSVP
  // ===========================
  const deadlineElement = document.getElementById("rsvpDeadline");

  const deadline = guest?.closeRSVPDate || event.closeRSVPDate;

  if (deadlineElement && deadline) {
    // Baca bagian tanggal kalender dari API
    // agar tidak bergeser akibat konversi timezone.
    const match = String(deadline).match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

    if (match) {
      const [, year, month, day] = match;

      const date = new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day))
      );

      deadlineElement.textContent =
        new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        }).format(date);
    }
  }

  // ===========================
  // 3. CHAT SUPPORT
  // ===========================
  const supportLink = document.getElementById("rsvpChatSupport");

  if (supportLink) {
    const phone = String(
      event.invitationWAUrl || ""
    ).replace(/\D/g, "");

    if (phone) {
      const guestName = guest?.name || "Guest";
      const eventName = event.name || "Wedding Invitation";

      const message =
        `Hi Provite Team, i need help with my RSVP ` +
        `with invitation name ${guestName} ` +
        `for The Event: ${eventName}`;

      supportLink.href =
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    }
  }

  console.log("[BryanApp] RSVP basic data updated", {
    guestName: guest?.name,
    deadline,
    eventId: event.id
  });
}


function renderWeddingGift() {
  const electronicGivings =
    state.dataContent?.electronicGivings;

  const firstCard = document.getElementById("giftCard");
  if (!firstCard) return;

  // Bersihkan kartu tambahan bila fungsi dipanggil ulang.
  document.querySelectorAll("[data-gift-extra]").forEach(
    (card) => card.remove()
  );

  // API kosong: seluruh isi HTML fallback tetap.
  if (
    !Array.isArray(electronicGivings) ||
    electronicGivings.length === 0
  ) {
    console.log("[BryanApp] Wedding Gift fallback lokal");
    return;
  }

  const gifts = electronicGivings
    .filter((item) =>
      item &&
      String(item.bankName || "").trim() &&
      String(item.accountNumber || "").trim()
    )
    .map((item) => ({
      bank: String(item.bankName).trim(),
      number: String(item.accountNumber).trim(),
      name: String(item.accountName || "").trim()
    }));

  if (!gifts.length) {
    console.log("[BryanApp] Data rekening tidak valid, fallback lokal");
    return;
  }

  // Logo yang sudah tersedia di assets.
  // Bank lainnya tidak menggunakan logo BCA secara keliru.
  const BANK_ICONS = {
    BCA: "assets/icons/bca.png"
  };

  function fillCard(card, gift) {
    const number = card.querySelector("#giftNumber, [data-gift-number]");
    const bank = card.querySelector("#giftBankName, [data-gift-bank]");
    const name = card.querySelector("#giftAccountName, [data-gift-name]");
    const icon = card.querySelector("#giftBankIcon, [data-gift-icon]");

    if (number) number.textContent = gift.number;
    if (bank) bank.textContent = gift.bank;
    if (name) name.textContent = gift.name;

    if (icon) {
      const logo = BANK_ICONS[gift.bank.toUpperCase()];

      if (logo) {
        icon.src = logo;
        icon.alt = gift.bank;
        icon.hidden = false;
      } else {
        icon.hidden = true;
      }
    }
  }

  // Rekening pertama menggunakan kartu HTML asli.
  fillCard(firstCard, gifts[0]);

  // Rekening kedua dan berikutnya: clone kartu asli.
  gifts.slice(1).forEach((gift) => {
    const card = firstCard.cloneNode(true);

    card.removeAttribute("id");
    card.dataset.giftExtra = "true";

    // Hindari ID duplikat.
    const idMap = {
      giftNumber: "gift-number",
      giftBankName: "gift-bank",
      giftAccountName: "gift-name",
      giftBankIcon: "gift-icon"
    };

    Object.entries(idMap).forEach(([id, dataName]) => {
      const el = card.querySelector(`#${id}`);

      if (el) {
        el.removeAttribute("id");
        el.setAttribute(`data-${dataName}`, "");
      }
    });


   const copyButton = card.querySelector("#btnCopy");

if (copyButton) {
  copyButton.removeAttribute("id");
  copyButton.setAttribute("data-gift-copy", "");
}

    // Jarak antar-kartu sama seperti desain pertama.
    card.classList.remove("mt-[8.97vw]", "md:mt-[35px]");
    card.classList.add("mt-[4vw]", "md:mt-[16px]");

    fillCard(card, gift);

    firstCard.parentNode.appendChild(card);
  });

  console.log(
    "[BryanApp] Wedding Gift updated:",
    gifts.length,
    "rekening"
  );
}



function showInvalidPinPage() {
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: "BRYAN_INVALID_PIN" },
      window.location.origin
    );
  } else {
    const privateURL = new URL(
      "private.html",
      document.baseURI
    );

    privateURL.searchParams.set(
      "id",
      state.url || "bryanvanessa"
    );

    window.location.replace(privateURL.href);
  }
}



  

async function initialize() {
  const config = window.TWINKLE_CONFIG;
  const api = window.TwinkleAPI;

  if (!config || !api) {
    console.error("[BryanApp] Config atau API belum tersedia");
    return;
  }

  const params = config.getParams();
  const url = params.slug;

  // Prioritas PIN: URL -> localStorage -> cookie
  const pin =
    params.urlPin ||
    localStorage.getItem(`${url}-pin`) ||
    config.readPinCookie?.(url) ||
    null;

  // Reset state
  state.url = url;
  state.pin = pin;
  state.dataEvent = null;
  state.dataContent = null;
  state.dataSession = [];
  state.guest = null;
  state.error = null;

  // TANPA PIN: mode preview
  if (!pin) {
    state.status = "fallback";

    console.log("[BryanApp] Mode preview tanpa PIN");

    window.dispatchEvent(
      new CustomEvent("bryan:fallback-ready", {
        detail: { ...state }
      })
    );

    return;
  }

  // DENGAN PIN: wajib validasi API
  state.status = "loading";

  try {
    // 1. Ambil event
    const eventRes = await api.getCurrentEvent(url);
    const event = unwrap(eventRes);

    if (!eventRes?.ok || !event?.id) {
      throw new Error("Event gagal dimuat");
    }

    const eventId = event.id;
    const lang = event.contentLanguage === "en" ? 1 : 0;

    // 2. Validasi PIN terlebih dahulu
    const guestRes = await api.getCurrentGuest(url, pin);
    const guestData = unwrap(guestRes);

    console.log("[BryanApp] Validasi PIN:", {
      status: guestRes?.status,
      ok: guestRes?.ok,
      hasGuest: Boolean(guestData?.id)
    });

    // HTTP 204: PIN tidak terdaftar
    if (guestRes?.status === 204) {
      state.status = "invalid-pin";
      state.error = "PIN tidak terdaftar";

      showInvalidPinPage();
      return;
    }

    // PIN hanya diterima jika guest valid
    if (
      guestRes?.status !== 200 ||
      !guestRes?.ok ||
      !guestData?.id
    ) {
      throw new Error("Data tamu gagal diverifikasi");
    }

    // 3. Ambil konten dan sesi setelah PIN valid
    const [contentRes, sessionRes] = await Promise.all([
      api.getEventContentByLang(eventId, lang),
      api.getGuestSessionsByPin(pin, eventId)
    ]);

    state.dataEvent = event;
    state.dataContent = contentRes?.ok
      ? unwrap(contentRes)
      : null;

    state.guest = guestData;

    const sessions = sessionRes?.ok
      ? unwrap(sessionRes)
      : null;

    state.dataSession = Array.isArray(sessions)
      ? sessions
      : [];

    state.status = "success";

    // 4. Render undangan
    renderOpeningEvent();
    renderOpeningGuest();
    renderProfile();
    renderEventDetail();
    renderGallery();
    renderRSVP();
    renderWeddingGift();

    console.log("[BryanApp] Data tamu berhasil dimuat");

    window.dispatchEvent(
      new CustomEvent("bryan:data-ready", {
        detail: { ...state }
      })
    );

  } catch (error) {
    state.status = "error";
    state.error = error.message;

    state.dataEvent = null;
    state.dataContent = null;
    state.dataSession = [];
    state.guest = null;

    console.error("[BryanApp] API error:", error);

    // Kesalahan jaringan/API bukan berarti PIN salah
    window.parent.postMessage(
      { type: "BRYAN_GUEST_LOAD_ERROR" },
      window.location.origin
    );
  }
}



  window.BryanApp = {
    state,
    initialize
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
