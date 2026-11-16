
(function () {
  const $ = (id) => document.getElementById(id);

  const state = {
    choice: 0, // 0 belum pilih, 1 hadir, 2 tidak hadir
    sessions: [],
    selected: new Set(),
    counts: {},
    smartData: [],
    ready: false,
    submitting: false,
    closed: false
  };

  const ZERO_ID = "00000000-0000-0000-0000-000000000000";

  const getApp = () => window.BryanApp?.state;
  const getAPI = () => window.TwinkleAPI;

  function unwrap(res) {
    return res?.data?.data ?? res?.data ?? null;
  }

  function notify(type, callback) {
    if (typeof window.showNotifModal === "function") {
      window.showNotifModal(type, callback);
    } else if (type === "confirm_rsvp") {
      if (confirm("Confirm your RSVP?")) callback?.();
    } else {
      alert(type.replaceAll("_", " "));
    }
  }

  function paint(button, active) {
    if (!button) return;
    button.style.backgroundColor = active ? "#4B3D2A" : "transparent";
    button.style.color = active ? "#fff" : "#4B4B44";
    button.setAttribute("aria-pressed", String(active));
  }

 
function updateButtons() {
  paint($("rsvpAttend"), state.choice === 1);
  paint($("rsvpUnable"), state.choice === 2);

  const confirmBtn = $("rsvpConfirmBtn");

  if (confirmBtn) {
    confirmBtn.innerHTML =
      state.choice === 1
        ? "Confirm<br>Attendance"
        : state.choice === 2
          ? "Confirm Unable<br>To Attend"
          : "Confirm";

    // Deadline closed tidak mengunci interaksi UI.
    confirmBtn.disabled = state.submitting || !state.ready;
    confirmBtn.style.opacity = confirmBtn.disabled ? "0.55" : "1";
    confirmBtn.style.cursor = confirmBtn.disabled
      ? "not-allowed"
      : "pointer";
  }

  const attendBtn = $("rsvpAttend");
  const unableBtn = $("rsvpUnable");

  if (attendBtn) {
    attendBtn.disabled = !state.ready || state.submitting;
  }

  if (unableBtn) {
    unableBtn.disabled = !state.ready || state.submitting;
  }
}


  function selectChoice(status) {
    if (!state.ready || state.submitting) return;

    state.choice = status;

    // Satu sesi: otomatis dipilih ketika Attend
    if (status === 1 && state.sessions.length === 1) {
      const id = state.sessions[0].eventSessionId;
      state.selected.add(id);
    }

    updateButtons();
    renderSessions();
  }

  function getSessionId(session) {
    return session.eventSessionId || session.id;
  }

  function renderSessions() {
    const container = $("rsvpSmartForm");
    if (!container) return;

    container.replaceChildren();

    if (state.choice !== 1 || state.sessions.length === 0) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    // Jika hanya satu sesi, tidak perlu checkbox.
    if (state.sessions.length === 1) {
      return;
    }

    const title = document.createElement("p");
    title.className = "text-[3.59vw] md:text-[14px]";
    title.textContent = "Please Select Your Event";
    container.appendChild(title);

    state.sessions.forEach((session) => {
      const id = getSessionId(session);

      const label = document.createElement("label");
      label.className =
        "flex w-full items-center justify-start gap-3 rounded-md border border-[#4B3D2A] p-3 text-left text-[3.59vw] md:text-[14px]";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.selected.has(id);
      checkbox.className = "h-4 w-4 accent-[#4B3D2A]";

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          state.selected.add(id);
        } else {
          state.selected.delete(id);
        }

        renderSessions();
      });

      const text = document.createElement("span");
      text.textContent = session.name || "Wedding Event";

      label.append(checkbox, text);
      container.appendChild(label);
    });
  }

  function isClosed(event) {
    if (event?.isAllowedRSVP === false) return true;

    if (!event?.closeRSVPDate) return false;

    const value = String(event.closeRSVPDate);
    const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : value + "+07:00";

    const deadline = new Date(normalized);

    return !Number.isNaN(deadline.getTime()) &&
      Date.now() > deadline.getTime();
  }

  async function loadRSVP() {
    const app = getApp();
    const api = getAPI();

    if (!app?.dataEvent || !api) return;

    state.ready = false;
    state.closed = isClosed(app.dataEvent);
    updateButtons();

    if (!app.pin || !app.guest) {
      console.warn("[RSVP] PIN atau data tamu tidak tersedia");
      return;
    }

    try {
      const [sessionResult, smartResult] = await Promise.all([
        api.getGuestSessionsByPin(app.pin, app.dataEvent.id),
        api.getSmartRsvpData(app.url, app.pin)
      ]);

      if (!sessionResult?.ok || !smartResult?.ok) {
        throw new Error("Failed to load Smart RSVP data");
      }

      const sessions = unwrap(sessionResult);
      const smartData = unwrap(smartResult);

      if (!Array.isArray(sessions) || !Array.isArray(smartData)) {
        throw new Error("Invalid Smart RSVP response");
      }

      state.smartData = smartData;

      state.sessions = sessions
        .filter((s) =>
          s.eventId === app.dataEvent.id ||
          s.eventId === ZERO_ID
        )
        .map((s) => ({
          ...s,
          eventSessionId: getSessionId(s)
        }));

      // Baca status RSVP sebelumnya jika tersedia
      const priorStatuses = smartData.map((s) => s.rsvpStatus);

      state.choice = priorStatuses.includes(1)
        ? 1
        : priorStatuses.includes(2)
          ? 2
          : 0;

      state.selected.clear();

      state.sessions.forEach((session) => {
        const id = session.eventSessionId;
        const smart = smartData.find((s) => s.id === id);

        state.counts[id] = Number(smart?.rsvp) > 0
          ? Number(smart.rsvp)
          : 1;

        if (smart?.rsvpStatus === 1) {
          state.selected.add(id);
        }
      });

      if (state.choice === 1 && state.sessions.length === 1) {
        state.selected.add(state.sessions[0].eventSessionId);
      }

      state.ready = state.sessions.length > 0;

      updateButtons();
      renderSessions();

      console.log("[RSVP] Ready", {
        pin: app.pin,
        sessions: state.sessions.length,
        choice: state.choice,
        closed: state.closed,
        smartData: state.smartData
      });

    } catch (error) {
      state.ready = false;
      updateButtons();
      console.error("[RSVP] Error:", error);
    }
  }

  function hasSmartQuestions() {
    return state.smartData.some((item) =>
      (Array.isArray(item.questionList) && item.questionList.length > 0) ||
      (Array.isArray(item.questionGeneralList) &&
        item.questionGeneralList.length > 0)
    );
  }

  function buildPayload() {
    const app = getApp();

    return {
      eventId: app.dataEvent.id,
      groupId: null,
      name: app.guest.name,
      phone: app.guest.phone || "",
      pin: app.pin,
      status: state.choice,
      url: app.url,
      maybeDate: null,
      maybeNote: null,
      questionList: state.choice === 1
        ? state.sessions.map((session) => {
            const id = session.eventSessionId;
            const selected = state.selected.has(id);

            return {
              eventSessionId: id,
              guestInvitation: selected
                ? state.counts[id] || 1
                : 0,
              questions: [],
              guestAttendances: []
            };
          })
        : []
    };
  }

  
function submitClick() {
  if (state.submitting) return;

  if (!state.ready) {
    notify("incomplete_rsvp");
    return;
  }

  // Harus memilih Attend atau Unable.
  if (state.choice === 0) {
    notify("incomplete_rsvp");
    return;
  }

  // Jika Attend, minimal satu sesi harus dipilih.
  if (
    state.choice === 1 &&
    state.selected.size === 0
  ) {
    notify("session_required");
    return;
  }

  // Ketika RSVP masih OPEN, pertanyaan tambahan
  // harus didukung sebelum submit sungguhan.
  if (!state.closed && hasSmartQuestions()) {
    notify("incomplete_rsvp");
    return;
  }

  // Popup konfirmasi pertama.
  notify("confirm_rsvp", () => {

    // RSVP CLOSED: SIMULASI FRONTEND SAJA.
    if (state.closed) {
      notify(
        state.choice === 1
          ? "rsvp_preview_hadir"
          : "rsvp_preview_tidak_hadir"
      );

      console.log(
        "[RSVP] Design simulation only. No API submission.",
        {
          choice: state.choice,
          selectedSessions: [...state.selected],
          closed: state.closed
        }
      );

      return;
    }

    // RSVP OPEN: kirim ke backend seperti biasa.
    submitToAPI();
  });
}


  async function submitToAPI() {
    if (state.submitting || !state.ready || state.closed) return;

    state.submitting = true;
    updateButtons();

    try {
      const payload = buildPayload();

      console.log("[RSVP] Sending payload:", payload);

      const result = await getAPI().submitRSVP(payload);

      if (!result?.ok || result.status !== 200) {
        const message =
          result?.data?.messageEN ||
          result?.data?.messageID ||
          result?.data?.message ||
          "Failed to submit RSVP.";

        throw new Error(message);
      }

      notify(
        state.choice === 1
          ? "rsvp_confirmed_hadir"
          : "rsvp_confirmed_tidak_hadir"
      );

      // Sinkronkan status RSVP setelah submit
      await loadRSVP();

    } catch (error) {
      console.error("[RSVP] Submit failed:", error);
      alert(error.message || "Failed to submit RSVP.");
    } finally {
      state.submitting = false;
      updateButtons();
    }
  }

  function init() {
    const attend = $("rsvpAttend");
    const unable = $("rsvpUnable");
    const confirm = $("rsvpConfirmBtn");

    if (!attend || !unable || !confirm) return;

    attend.addEventListener("click", () => selectChoice(1));
    unable.addEventListener("click", () => selectChoice(2));
    confirm.addEventListener("click", submitClick);

    updateButtons();

    if (getApp()?.status === "success") {
      loadRSVP();
    }
  }

  window.addEventListener("bryan:data-ready", loadRSVP);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.BryanRSVP = { state, loadRSVP, buildPayload };
})();
