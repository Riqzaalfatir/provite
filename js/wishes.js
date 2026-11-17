/* =========================================
   BRYAN & VANESSA - STATIC WISHES
   NORMAL + SEE ALL + BACK + POPUP
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  // =====================================
  // DATA CONTOH STATIS
  // =====================================

  let wishes = [
    {
      id: 1,
      nama: "Lorem Ipsum",
      pesan:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      id: 2,
      nama: "Dolor Sit",
      pesan:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      id: 3,
      nama: "Amet Consectetur",
      pesan:
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    },
    {
      id: 4,
      nama: "Adipiscing Elit",
      pesan:
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    },
  ];

  // =====================================
  // ELEMENTS
  // =====================================
  const form = document.getElementById("wishForm");
  const wishList = document.getElementById("wishList");

  const normal = document.getElementById("wishesNormal");
  const all = document.getElementById("wishesAll");
  const grid = document.getElementById("wishesGrid");

  const viewAllBtn = document.getElementById("wishViewAll");
  const viewAllLabel = viewAllBtn?.querySelector(".wish-button-label");

  const modal = document.getElementById("wishesModal");
  const modalCard = document.getElementById("wishesModalCard");
  const popupName = document.getElementById("wishesPopupName");
  const popupMessage = document.getElementById("wishesPopupMessage");
  const popupInitials = document.getElementById("wishesPopupInitials");
  const popupClose = document.getElementById("wishesPopupClose");

  if (
    !form ||
    !wishList ||
    !normal ||
    !all ||
    !grid ||
    !viewAllBtn ||
    !viewAllLabel ||
    !modal ||
    !modalCard ||
    !popupName ||
    !popupMessage ||
    !popupInitials
  )
    return;

  const inputName = form.querySelector('[name="name"]');
  const inputMessage = form.querySelector('[name="message"]');

  if (!inputName || !inputMessage) return;

  let showAll = false;
  let closeTimer = null;

  // =====================================
  // HELPER CREATE ELEMENT
  // =====================================
  function el(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;

    if (text !== undefined) {
      node.textContent = text;
    }

    return node;
  }

  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  }

  // =====================================
  // RENDER NORMAL - KOTAK COKLAT
  // =====================================
  function renderNormal() {
    wishList.replaceChildren();

    wishes.forEach((item, index) => {
      const wrapper = el("div", "mb-4");

      const name = el(
        "p",
        "mb-2 font-constan text-[3.59vw] font-bold text-[#FFF8EE] md:text-[14px]",
        item.nama,
      );

      const message = el(
        "p",
        "whitespace-pre-wrap break-words font-constan text-[3.59vw] leading-[1.6] text-[#FFF8EE] md:text-[13px]",
        item.pesan,
      );

      wrapper.append(name, message);

      if (index !== wishes.length - 1) {
        const divider = el("div", "mt-4 border-t border-white/30");

        wrapper.appendChild(divider);
      }

      wishList.appendChild(wrapper);
    });
  }

  // =====================================
  // RENDER SEE ALL - GRID 2 KOLOM
  // =====================================
  function renderGrid() {
    grid.replaceChildren();

    wishes.forEach((item) => {
      const card = el("button", "wishes-message-card");

      card.type = "button";
      card.setAttribute("aria-label", `Read message from ${item.nama}`);

      const content = el("div", "wishes-message-content");

      const quote = el("span", "wishes-message-quote", "“");

      const message = el("p", "wishes-message-text", item.pesan);

      const footer = el("div", "wishes-message-footer");

      const avatar = el(
        "span",
        "wishes-message-avatar",
        getInitials(item.nama),
      );

      const name = el("span", "wishes-message-name", item.nama);

      content.append(quote, message);
      footer.append(avatar, name);
      card.append(content, footer);

      // Klik kartu membuka popup detail
      card.addEventListener("click", () => {
        openMessage(item);
      });

      grid.appendChild(card);
    });
  }

  // =====================================
  // NORMAL / SEE ALL / BACK
  // =====================================
  function setView(value) {
    showAll = value;

    // Tampilkan hanya salah satu
    normal.style.display = showAll ? "none" : "block";
    all.style.display = showAll ? "block" : "none";

    // Ubah label tombol, icon tetap
    viewAllLabel.textContent = showAll ? "BACK" : "SEE ALL MESSAGES";

    if (showAll) {
      renderGrid();
      all.scrollTop = 0;
    } else {
      renderNormal();
      wishList.scrollTop = 0;
    }
  }

  // =====================================
  // TWINKLEBOOK API INTEGRATION
  // =====================================

  let wishesSubmitting = false;
  let wishesEventId = null;
  let guestNameAutofilled = false;

  function unwrap(result) {
    return result?.data?.data ?? result?.data ?? null;
  }

  function decodeHtml(text) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(text ?? "");
    return textarea.value;
  }

  function refreshWishesView() {
    if (showAll) {
      renderGrid();
    } else {
      renderNormal();
    }
  }

  function autofillGuestName() {
    const guestName = window.BryanApp?.state?.guest?.name;

    // Hanya isi otomatis sekali, jangan menimpa ketikan tamu.
    if (guestName && !guestNameAutofilled && !inputName.value.trim()) {
      inputName.value = guestName;
      guestNameAutofilled = true;
    }
  }

  async function loadWishes() {
    const app = window.BryanApp?.state;
    const api = window.TwinkleAPI;

    if (!app?.dataEvent?.id || !api?.getAllPMG) return;

    wishesEventId = app.dataEvent.id;
    autofillGuestName();

    try {
      const result = await api.getAllPMG(wishesEventId);

      if (!result?.ok) {
        throw new Error("Failed to load wishes");
      }

      const data = unwrap(result);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : null;

      if (!list) {
        throw new Error("Invalid wishes response");
      }

      // Sama seperti referensi Next.js:
      // daftar API dipakai jika memiliki pesan.
      if (list.length > 0) {
        wishes = list.map((item, index) => ({
          id: item.id ?? index,
          nama: decodeHtml(item.name),
          pesan: decodeHtml(item.message),
        }));
      }

      refreshWishesView();

      console.log("[BryanApp] Wishes loaded:", {
        eventId: wishesEventId,
        apiCount: list.length,
        displayed: wishes.length,
      });
    } catch (error) {
      console.error("[BryanApp] Wishes API error:", error);
      // Tidak menghapus data yang sudah tampil.
    }
  }

  window.addEventListener("bryan:data-ready", () => {
    loadWishes();
  });

  // Jika app.js selesai sebelum listener ini dipasang.
  if (window.BryanApp?.state?.status === "success") {
    loadWishes();
  }

  viewAllBtn.addEventListener("click", () => {
    setView(!showAll);
  });

  // =====================================
  // OPEN POPUP
  // =====================================
  function openPopup() {
    clearTimeout(closeTimer);

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.remove("opacity-0");
        modal.classList.add("opacity-100");

        modalCard.classList.remove("opacity-0", "scale-95");

        modalCard.classList.add("opacity-100", "scale-100");
      });
    });
  }

  // =====================================
  // CLICK MESSAGE -> DETAIL
  // =====================================
  function openMessage(item) {
    popupName.textContent = item.nama;
    popupMessage.textContent = item.pesan;
    popupInitials.textContent = getInitials(item.nama);

    openPopup();
  }

  // =====================================
  // CLOSE POPUP
  // =====================================
  function closePopup() {
    modal.classList.remove("opacity-100");
    modal.classList.add("opacity-0");

    modalCard.classList.remove("opacity-100", "scale-100");

    modalCard.classList.add("opacity-0", "scale-95");

    clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }, 400);
  }

  popupClose?.addEventListener("click", closePopup);

  // Klik backdrop
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closePopup();
    }
  });

  // ESC untuk menutup popup
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closePopup();
    }
  });

  // =====================================
  // WISHES SIMULATION - TANPA PIN
  // =====================================

  function submitWishSimulation(nama, pesan) {
    const newWish = {
      id: `local-${Date.now()}`,
      nama,
      pesan,
    };

    // Tambahkan pesan terbaru ke urutan pertama
    wishes.unshift(newWish);

    // Perbarui tampilan Normal dan See All
    refreshWishesView();

    // Kosongkan form
    inputName.value = "";
    inputMessage.value = "";

    // Kembali ke daftar normal agar pesan terlihat
    setView(false);
    wishList.scrollTop = 0;

    // Tandai popup sebagai simulasi lokal
    const label = document.querySelector(
      "#wishesSuccessModal .wishes-success-label",
    );

    if (label) {
      label.textContent = "MESSAGE PREVIEW";
    }

    showWishesSuccessPopup();

    console.log(
      "[Wishes] Simulasi berhasil. Pesan hanya disimpan sementara:",
      newWish,
    );
  }

  // =====================================
  // SEND WISH - TWINKLEBOOK API
  // =====================================

  // =====================================
  // SEND WISH - API + SIMULASI TANPA PIN
  // =====================================

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (wishesSubmitting) return;

    const nama = inputName.value.trim();
    const pesan = inputMessage.value.trim();

    // Validasi form
    if (!nama || !pesan) {
      if (typeof window.showNotifModal === "function") {
        window.showNotifModal("incomplete_wishes");
      } else {
        alert("Please enter your name and message.");
      }
      return;
    }

    const app = window.BryanApp?.state;

    // =====================================
    // TANPA PIN: SIMULASI FRONTEND
    // =====================================

    if (!app?.pin) {
      submitWishSimulation(nama, pesan);
      return;
    }

    // =====================================
    // DENGAN PIN: KIRIM KE API
    // =====================================

    const api = window.TwinkleAPI;
    const eventId = app?.dataEvent?.id || wishesEventId;

    if (!eventId || typeof api?.submitPMG !== "function") {
      console.error("[Wishes] API not ready", {
        eventId,
        pin: app?.pin,
        apiAvailable: Boolean(api),
      });

      if (typeof window.showNotifModal === "function") {
        window.showNotifModal("submit_failed");
      } else {
        alert("Unable to send your wishes.");
      }

      return;
    }

    const submitButton = document.getElementById("wishSubmit");

    wishesSubmitting = true;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.opacity = "0.6";
    }

    try {
      const payload = {
        eventId,
        mediaFileId: null,
        name: nama,
        message: pesan,
        status: 1,
        type: 1,
      };

      const result = await api.submitPMG(payload);

      if (!result?.ok) {
        throw new Error(result?.data?.message || "Failed to send your wishes.");
      }

      // Berhasil dikirim ke backend
      inputMessage.value = "";

      // Kembalikan label popup untuk mode API
      const label = document.querySelector(
        "#wishesSuccessModal .wishes-success-label",
      );

      if (label) {
        label.textContent = "MESSAGE SENT";
      }

      // Popup sukses
      showWishesSuccessPopup();

      // Refresh daftar dari API
      loadWishes().catch((error) => {
        console.error("[Wishes] Refresh failed:", error);
      });

      console.log("[Wishes] API submission successful");
    } catch (error) {
      console.error("[Wishes] Submit failed:", error);

      if (typeof window.showNotifModal === "function") {
        window.showNotifModal("submit_failed");
      } else {
        alert(error.message || "Failed to send your wishes.");
      }
    } finally {
      wishesSubmitting = false;

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.style.opacity = "";
      }
    }
  });

  function showWishesSuccessPopup() {
    const modal = document.getElementById("wishesSuccessModal");

    if (!modal) return;

    modal.hidden = false;
  }

  function closeWishesSuccessPopup() {
    const modal = document.getElementById("wishesSuccessModal");

    if (!modal) return;

    modal.hidden = true;
  }

  document
    .getElementById("wishesSuccessClose")
    ?.addEventListener("click", closeWishesSuccessPopup);

  // =====================================
  // INITIAL RENDER
  // =====================================
  setView(false);
});
