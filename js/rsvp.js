/**
 * Smart RSVP (vanilla JS) untuk Bryan & Vanessa (adaptasi Ferdy & Hashena).
 * Logika = hooks/useSmartRsvpController.tsx (state handler, validasi, collectDataRSVP disalin verbatim dari
 * public/events/test-wedding-ivander-michelle/js/rsvp.js); form dinamis adaptasi SmartRsvpFormBased.tsx,
 * rsvp/SmartRsvpFormModals.tsx dan StatusPopup.tsx template WeddingFerdyHashena.
 */
window.BryanRSVP = (function () {
  // Adaptasi dari Ferdy & Hashena untuk Bryan & Vanessa.
  // Memakai ID HTML Bryan & Vanessa dan API TwinkleAPI yang sudah ada.
  const api = window.TwinkleAPI;
  // Selalu menggunakan data acara dan tamu sebenarnya, termasuk saat localhost.
  // Tidak ada mode demo atau data dummy yang disisipkan otomatis.
  const selectorMap = {
    "#btnAttend": "#rsvpAttend",
    "#btnNotAttend": "#rsvpUnable",
    "#btnSubmitRsvp": "#rsvpConfirmBtn",
    "#btnChatSupport": "#rsvpChatSupport",
    "#rsvpDueDate": "#rsvpDeadline",
    "#rsvpAttendBlock": "#rsvpSmartForm",
  };
  const GENERAL_SESSION_ID = "GENERAL_ACCESS";

  const $ = (sel, root = document) =>
    root.querySelector(selectorMap[sel] || sel);
  const Swal = window.Swal || {
    fire: (opts) =>
      window.alert(`${opts?.title || "RSVP"}: ${opts?.text || ""}`),
  };

  // Format tanggal dasar tanpa mewajibkan library moment.js.
  const moment =
    window.moment ||
    function (input, sourceFormat) {
      const pad = (n) => String(n).padStart(2, "0");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let date;
      if (!input) date = new Date();
      else if (sourceFormat === "DD MMM YYYY") {
        const m = /^(\d{2}) ([A-Za-z]{3}) (\d{4})$/.exec(input);
        date = m
          ? new Date(
              +m[3],
              months.findIndex((x) => x.toLowerCase() === m[2].toLowerCase()),
              +m[1],
            )
          : new Date(input);
      } else if (sourceFormat === "DD/MM/YYYY HH:mm") {
        const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(input);
        date = m
          ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5])
          : new Date(input);
      } else if (sourceFormat === "h:mm A") {
        const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/i.exec(input);
        date = m
          ? new Date(
              2000,
              0,
              1,
              (+m[1] % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0),
              +m[2],
            )
          : new Date(input);
      } else if (sourceFormat === "HH:mm") {
        date = new Date(`2000-01-01T${input}`);
      } else date = new Date(input);
      if (isNaN(date.getTime())) date = new Date();
      return {
        format(fmt) {
          const Y = date.getFullYear(),
            M = date.getMonth() + 1,
            D = date.getDate(),
            h = date.getHours(),
            n = date.getMinutes();
          if (fmt === "DD MMM YYYY") return `${pad(D)} ${months[M - 1]} ${Y}`;
          if (fmt === "YYYY-MM-DD") return `${Y}-${pad(M)}-${pad(D)}`;
          if (fmt === "DD/MM/YYYY HH:mm")
            return `${pad(D)}/${pad(M)}/${Y} ${pad(h)}:${pad(n)}`;
          if (fmt === "YYYY-MM-DDTHH:mm")
            return `${Y}-${pad(M)}-${pad(D)}T${pad(h)}:${pad(n)}`;
          if (fmt === "HH:mm") return `${pad(h)}:${pad(n)}`;
          if (fmt === "h:mm A")
            return `${h % 12 || 12}:${pad(n)} ${h >= 12 ? "PM" : "AM"}`;
          return date.toLocaleDateString("en-GB");
        },
      };
    };

  const s = {
    data: null,
    paramUrl: "",
    eventId: "",
    pin: "",
    attendStatus: 0,
    selectedSessions: [],
    questionData: [],
    answers: {},
    guestData: {},
    isPublicInvitation: false,
    invitationUrl: "#",
    publicQuota: 0,
    generalQuestions: [],
    group: null,
    groupUrl: "",
    titleResponseRSVP: "Success",
    failedSubmitMessage: "Failed to submit RSVP",
    failedEnSubmitMessage: "Failed to submit RSVP",
    iti: null,
    // Khusus SmartRsvpFormBased
    selectedGuestCounts: {},
    isSubmit: false,
    ready: false,
    closed: false,
    demo: false,
  };
  let openDropdownId = null;

  // ════════════════════════════ helpers DOM ════════════════════════════
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function notifyRSVP(type, callback = null) {
    if (typeof window.showNotifModal === "function") {
      window.showNotifModal(type, callback);
    } else {
      console.warn("[RSVP] Notification system unavailable:", type);
    }
  }

  // Gunakan satu sistem notifikasi asli Bryan & Vanessa (js/notif.js).
  const showClosedModal = () => notifyRSVP("rsvp_closed");
  const showConfirmModal = () => notifyRSVP("confirm_rsvp", handleRSVP);
  const showGuestCountWarning = () => notifyRSVP("incomplete_rsvp");
  const showIncompleteRSVPModal = () => notifyRSVP("incomplete_rsvp");
  const showIncompleteModal = () =>
    notifyRSVP(
      s.titleResponseRSVP === "SESSION REQUIRED"
        ? "session_required"
        : "incomplete_rsvp",
    );
  const showConfirmedModal = (status) =>
    notifyRSVP(
      status === 1 ? "rsvp_confirmed_hadir" : "rsvp_confirmed_tidak_hadir",
    );

  const PERSON_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="shrink-0 text-[#000000]"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"></circle><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>';
  const CHEVRON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="shrink-0 text-[#000000] transition-transform duration-200"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const CHECK_SVG =
    '<svg viewBox="0 0 512 512" fill="rgba(107,107,107,0.85)"><path d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path></svg>';

  function chairIcon() {
    const span = el("span", "shrink-0");
    span.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 21v-6m14 6v-6M5 15V8a7 7 0 0 1 14 0v7M5 15h14M7 18h10"/></svg>';
    return span;
  }

  // NextUI <Checkbox color="danger">
  function checkbox(text, checked, onChange) {
    const wrap = el("label", "fh-check");
    const input = el("input", "sr-only");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", (e) => onChange(e.target.checked));
    const box = el("span", "fh-check-box");
    box.innerHTML = CHECK_SVG;
    wrap.append(
      input,
      box,
      el("span", "rsvp_question_value text-[14px]", text),
    );
    return wrap;
  }

  function range(n) {
    return Array.from({ length: Math.max(0, n || 0) }, (_, i) => i + 1);
  }

  // useLockBodyScroll.ts (selama popup RSVP terbuka)
  let lockCount = 0;
  let lockedY = 0;
  function lockScroll(lock) {
    const html = document.documentElement;
    const body = document.body;
    if (lock) {
      if (lockCount++ > 0) return;
      lockedY = window.scrollY;
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${lockedY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    } else {
      if (lockCount === 0 || --lockCount > 0) return;
      html.style.overflow = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, lockedY);
    }
  }

  // ════════════════════════════ state handlers (verbatim dari controller) ════════════════════════════
  const isChoiceSelected = (sessionId, questionId, choice, type) => {
    const current = s.answers[sessionId]?.[questionId];
    if (!current) return false;
    switch (type) {
      case 1:
        return current === choice;
      case 4:
        return current.split(",").some((a) => a.startsWith(`${choice}:;`));
      case 5:
        return current.startsWith(`${choice}:;`);
      default:
        return false;
    }
  };

  const handleSessionSelect = (sessionId, checked) => {
    s.selectedSessions = checked
      ? [...s.selectedSessions, sessionId]
      : s.selectedSessions.filter((id) => id !== sessionId);
  };

  const handleGuestCount = (sessionId, value) => {
    const newAnswers = {
      ...s.answers,
      [sessionId]: { ...s.answers[sessionId], guestInvitation: value },
    };
    Object.keys(newAnswers[sessionId]).forEach((qId) => {
      if (Array.isArray(newAnswers[sessionId][qId])) {
        newAnswers[sessionId][qId] = Array.from(
          { length: value },
          (_, i) =>
            newAnswers[sessionId][qId][i] || {
              id: `${qId}-${i + 1}`,
              name: "",
              options: [],
            },
        );
      }
    });
    Object.keys(newAnswers[sessionId]).forEach((key) => {
      const match = key.match(/-guest-(\d+)$/);
      if (match && parseInt(match[1]) >= value)
        delete newAnswers[sessionId][key];
    });
    s.answers = newAnswers;
  };

  // value untuk tipe 6/7/8 sudah diformat oleh input-nya (DD MMM YYYY, DD/MM/YYYY HH:mm, h:mm A)
  const handleAnswerChange = (sessionId, questionId, value, type) => {
    const formattedValue = type === 0 ? value.join(",") : value;
    s.answers = {
      ...s.answers,
      [sessionId]: { ...s.answers[sessionId], [questionId]: formattedValue },
    };
  };

  const handleCheckboxRadioSelect = (
    sessionId,
    questionId,
    choice,
    qty,
    isChecked,
    type,
  ) => {
    const current = s.answers[sessionId]?.[questionId]?.split(",") || [];
    const choiceValue = `${choice}:;${qty}`;
    let updated;
    if (type === 4) {
      updated = isChecked
        ? [...current, choiceValue]
        : current.filter((a) => !a.startsWith(`${choice}:;`));
    } else {
      updated = [choiceValue];
    }
    s.answers = {
      ...s.answers,
      [sessionId]: { ...s.answers[sessionId], [questionId]: updated.join(",") },
    };
  };

  const handleGuestAttendanceChange = (
    sessionId,
    questionId,
    guestIndex,
    field,
    value,
  ) => {
    const newGuests = [...(s.answers[sessionId][questionId] || [])];
    if (!newGuests[guestIndex]) {
      newGuests[guestIndex] = {
        id: `${questionId}-${guestIndex + 1}`,
        name: "",
        options: [],
        optionId: "",
      };
    }
    newGuests[guestIndex] = { ...newGuests[guestIndex], [field]: value };
    s.answers = {
      ...s.answers,
      [sessionId]: { ...s.answers[sessionId], [questionId]: newGuests },
    };
  };

  const clearChildAnswers = (ans, sessionId, guestIndex) => {
    const keysToDelete = [];
    const collect = (a) => {
      if (!a.child?.length) return;
      a.child.forEach((childQ) => {
        keysToDelete.push(
          guestIndex !== undefined
            ? `${childQ.id}-guest-${guestIndex}`
            : childQ.id,
        );
        collect(childQ);
      });
    };
    collect(ans);
    if (!keysToDelete.length) return;
    const newSession = { ...s.answers[sessionId] };
    keysToDelete.forEach((k) => delete newSession[k]);
    s.answers = { ...s.answers, [sessionId]: newSession };
  };

  // ════════════════════════════ dropdown kustom (CustomSelectDropdown / CustomGuestDropdown) ════════════════════════════
  // Menu dropdown menutup bila klik di luar (mousedown), seperti useEffect handleClickOutside.
  // Hanya satu listener aktif; dilepas setiap accordion dirender ulang. Listener yang tertinggal
  // akan merender ulang accordion saat mousedown, sehingga klik pada input/tombol RSVP tidak pernah sampai.
  let outsideHandler = null;
  function setOutsideHandler(fn) {
    if (outsideHandler)
      document.removeEventListener("mousedown", outsideHandler);
    outsideHandler = fn;
    if (fn)
      setTimeout(() => {
        if (outsideHandler === fn) document.addEventListener("mousedown", fn);
      }, 0);
  }

  function dropdownMenu(wrapper, items, close) {
    const menu = el(
      "div",
      "rsvp-dropdown-menu absolute top-full left-0 mt-[6px] w-full bg-white rounded-[8px] shadow-2xl border border-[#E5E5E5] z-50 max-h-[220px] overflow-y-auto",
    );
    items.forEach((it) => {
      const b = el(
        "button",
        `w-full text-left px-[14px] py-[8px] rsvp_question_value transition-colors ${it.active ? "bg-[#F2F2F2]" : "hover:bg-[#F7F7F7]"}`,
        it.label,
      );
      b.type = "button";
      b.addEventListener("click", () => it.onClick());
      menu.appendChild(b);
    });
    const outside = (e) => {
      if (!wrapper.contains(e.target)) close();
    };
    setOutsideHandler(outside);
    menu._cleanup = () => {
      if (outsideHandler === outside) setOutsideHandler(null);
    };
    return menu;
  }

  function customSelect({
    label,
    options,
    value,
    placeholder = "-- Select --",
    icon = true,
    onSelect,
  }) {
    const root = el("div", "flex flex-col gap-[4px] text-left w-full");
    if (label) root.appendChild(el("span", "rsvp_question_label", label));
    const line = el(
      "div",
      "flex items-center gap-[10px] border-b border-[#D0D0D0] pb-[8px]",
    );
    if (icon) line.appendChild(chairIcon());
    const wrapper = el("div", "relative flex-1 z-auto");
    const btn = el(
      "button",
      "w-full flex items-center justify-between bg-transparent outline-none rsvp_question_value text-[14px] md:text-[18px] text-left pl-[6px] cursor-pointer",
    );
    btn.type = "button";
    const text = el(
      "span",
      value ? "" : "text-[#B0B0B0]",
      value || placeholder,
    );
    btn.appendChild(text);
    btn.insertAdjacentHTML("beforeend", CHEVRON);
    wrapper.appendChild(btn);

    let menu = null;
    const close = () => {
      if (!menu) return;
      menu._cleanup();
      menu.remove();
      menu = null;
      wrapper.classList.replace("z-50", "z-auto");
      btn.lastElementChild.classList.remove("rotate-180");
    };
    btn.addEventListener("click", () => {
      if (menu) return close();
      const items = [
        {
          label: placeholder,
          active: !value,
          onClick: () => {
            close();
            onSelect("", "");
          },
        },
      ].concat(
        options.map((opt) => ({
          label: opt.choice,
          active: opt.choice === value,
          onClick: () => {
            close();
            onSelect(opt.choice, opt.id);
          },
        })),
      );
      menu = dropdownMenu(wrapper, items, close);
      wrapper.appendChild(menu);
      wrapper.classList.replace("z-auto", "z-50");
      btn.lastElementChild.classList.add("rotate-180");
    });
    line.appendChild(wrapper);
    root.appendChild(line);
    return root;
  }

  // Jumlah tamu: "-" (0) sampai kuota; hanya satu dropdown terbuka (openDropdownId)
  function guestDropdown({ sessionId, value, maxGuests, onSelect }) {
    const root = el("label", "flex flex-col gap-[4px] text-left");
    root.appendChild(el("span", "rsvp_question_label", "Number of Guest"));
    const line = el(
      "div",
      "flex items-center gap-[10px] border-b border-[#D0D0D0] pb-[8px]",
    );
    line.insertAdjacentHTML("beforeend", PERSON_ICON);
    const isOpen = openDropdownId === sessionId;
    const wrapper = el("div", `relative flex-1 ${isOpen ? "z-50" : "z-auto"}`);
    const btn = el(
      "button",
      "w-full flex items-center justify-between bg-transparent outline-none rsvp_question_value text-[14px] md:text-[18px] text-left pl-[6px]",
    );
    btn.type = "button";
    btn.appendChild(el("span", "", value && value > 0 ? String(value) : "-"));
    btn.insertAdjacentHTML("beforeend", CHEVRON);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openDropdownId = openDropdownId === sessionId ? null : sessionId;
      rerender();
    });
    wrapper.appendChild(btn);
    if (isOpen) {
      const close = () => {
        openDropdownId = null;
        rerender();
      };
      const items = [
        {
          label: "-",
          active: !value || value === 0,
          onClick: () => onSelect(0),
        },
      ].concat(
        range(Math.max(1, maxGuests)).map((n) => ({
          label: String(n),
          active: n === value,
          onClick: () => onSelect(n),
        })),
      );
      wrapper.appendChild(dropdownMenu(wrapper, items, close));
    }
    line.appendChild(wrapper);
    root.append(
      line,
      el(
        "span",
        "rsvp_question_hint text-[10px] text-[#888]",
        "Number of Guest Attending",
      ),
    );
    return root;
  }

  // ════════════════════════════ renderQuestionItem (SmartRsvpFormBased) ════════════════════════════
  // Perubahan struktur me-render ulang accordion; input teks hanya mengubah state supaya fokus tidak hilang.
  function renderQuestion(q, sessionId, guestIndex) {
    const scopedId =
      guestIndex !== undefined ? `${q.id}-guest-${guestIndex}` : q.id;
    const answer = s.answers[sessionId]?.[scopedId];
    const childBlock = (cls, children, gi) => {
      const wrap = el("div", cls);
      children.forEach((childQ) =>
        wrap.appendChild(renderQuestion(childQ, sessionId, gi)),
      );
      return wrap;
    };

    if (q.questionType === 0) {
      const wrap = el(
        "div",
        "flex flex-col gap-[6px] text-left mb-[16px] col-span-1 sm:col-span-2",
      );
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      const group = el("div", "mt-1 flex flex-col gap-2");
      const selected = answer?.split(",") || [];
      q.listAnswerChoices.forEach((ans) => {
        group.appendChild(
          checkbox(ans.choice, selected.includes(ans.choice), (checked) => {
            const current = (
              s.answers[sessionId]?.[scopedId]?.split(",") || []
            ).filter(Boolean);
            handleAnswerChange(
              sessionId,
              scopedId,
              checked
                ? [...current, ans.choice]
                : current.filter((c) => c !== ans.choice),
              0,
            );
            rerender();
          }),
        );
      });
      wrap.appendChild(group);
      return wrap;
    }

    if (q.questionType === 1) {
      const wrap = el(
        "div",
        "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2",
      );
      wrap.appendChild(
        customSelect({
          label: q.questionTitle,
          options: q.listAnswerChoices,
          value: answer || "",
          onSelect: (val) => {
            handleAnswerChange(sessionId, scopedId, val, 1);
            rerender();
          },
        }),
      );
      q.listAnswerChoices.forEach((ans) => {
        if (
          !isChoiceSelected(sessionId, scopedId, ans.choice, 1) ||
          !ans.child?.length
        )
          return;
        wrap.appendChild(
          childBlock(
            "mt-[16px] pl-3 border-l-2 border-[#D0D0D0]",
            ans.child,
            guestIndex,
          ),
        );
      });
      return wrap;
    }

    if (q.questionType === 2) {
      const wrap = el(
        "label",
        "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2",
      );
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      const line = el("div", "border-b border-[#D0D0D0] pb-[6px]");
      const ta = el(
        "textarea",
        "w-full bg-transparent outline-none rsvp_question_value placeholder:text-[#B0B0B0] resize-none",
      );
      ta.rows = 3;
      ta.placeholder = q.questionTitle;
      ta.value = answer || "";
      ta.addEventListener("input", (e) =>
        handleAnswerChange(sessionId, scopedId, e.target.value, 2),
      );
      line.appendChild(ta);
      wrap.appendChild(line);
      return wrap;
    }

    if (q.questionType === 4) {
      const wrap = el(
        "div",
        "flex flex-col gap-[6px] text-left mb-[16px] col-span-1 sm:col-span-2",
      );
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      q.listAnswerChoices.forEach((ans) => {
        const [choice, maxQty] = ans.choice.split("*|*");
        const currentQty =
          (s.answers[sessionId]?.[scopedId]?.split(",") || [])
            .find((a) => a.startsWith(`${choice}:;`))
            ?.split(":;")[1] || "1";
        const selected = isChoiceSelected(sessionId, scopedId, choice, 4);
        const item = el("div", "mb-2");
        const row = el("div", "flex gap-2 items-center");
        row.appendChild(
          checkbox(choice, selected, (checked) => {
            handleCheckboxRadioSelect(
              sessionId,
              scopedId,
              choice,
              parseInt(currentQty),
              checked,
              4,
            );
            rerender();
          }),
        );
        const sel = el(
          "select",
          "border-b border-[#D0D0D0] bg-transparent outline-none rsvp_question_value px-2 py-1",
        );
        range(parseInt(maxQty)).forEach((n) => {
          const o = el("option", "", String(n));
          o.value = n;
          sel.appendChild(o);
        });
        sel.value = currentQty;
        sel.addEventListener("change", (e) => {
          handleCheckboxRadioSelect(
            sessionId,
            scopedId,
            choice,
            parseInt(e.target.value),
            true,
            4,
          );
          rerender();
        });
        row.appendChild(sel);
        item.appendChild(row);
        if (ans.child?.length > 0 && selected)
          item.appendChild(
            childBlock(
              "mt-2 pl-3 border-l-2 border-[#D0D0D0]",
              ans.child,
              guestIndex,
            ),
          );
        wrap.appendChild(item);
      });
      return wrap;
    }

    if (q.questionType === 5) {
      const selectedChoice = answer?.split(":;")[0] || "";
      const selectedQty = answer?.split(":;")[1] || "1";
      const wrap = el(
        "div",
        "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2",
      );
      const row = el("div", "flex gap-2 items-center");
      const left = el("div", "flex-1");
      left.appendChild(
        customSelect({
          label: q.questionTitle,
          options: q.listAnswerChoices.map((a) => ({
            id: a.id,
            choice: a.choice.split("*|*")[0],
          })),
          value: selectedChoice,
          onSelect: (val) => {
            handleCheckboxRadioSelect(sessionId, scopedId, val, 1, true, 5);
            rerender();
          },
        }),
      );
      row.appendChild(left);
      q.listAnswerChoices.forEach((ans) => {
        const [choice, maxQty] = ans.choice.split("*|*");
        if (!isChoiceSelected(sessionId, scopedId, choice, 5)) return;
        const sel = el(
          "select",
          "bg-transparent outline-none rsvp_question_value border-b border-[#D0D0D0] px-2 self-end pb-[8px] cursor-pointer",
        );
        range(parseInt(maxQty)).forEach((n) => {
          const o = el("option", "", String(n));
          o.value = n;
          sel.appendChild(o);
        });
        sel.value = selectedQty;
        sel.addEventListener("change", (e) => {
          handleCheckboxRadioSelect(
            sessionId,
            scopedId,
            choice,
            parseInt(e.target.value),
            true,
            5,
          );
          rerender();
        });
        row.appendChild(sel);
      });
      wrap.appendChild(row);
      q.listAnswerChoices.forEach((ans) => {
        const [choice] = ans.choice.split("*|*");
        if (
          !isChoiceSelected(sessionId, scopedId, choice, 5) ||
          !ans.child?.length
        )
          return;
        wrap.appendChild(
          childBlock(
            "mt-2 pl-3 border-l-2 border-[#D0D0D0]",
            ans.child,
            guestIndex,
          ),
        );
      });
      return wrap;
    }

    // Tipe 6/7/8 (DatePicker / TimeInput underlined) -> input native bergaris bawah
    if (q.questionType === 6 || q.questionType === 7 || q.questionType === 8) {
      const cfg = {
        6: { type: "date", store: "DD MMM YYYY", input: "YYYY-MM-DD" },
        7: {
          type: "datetime-local",
          store: "DD/MM/YYYY HH:mm",
          input: "YYYY-MM-DDTHH:mm",
        },
        8: { type: "time", store: "h:mm A", input: "HH:mm" },
      }[q.questionType];
      const wrap = el(
        "div",
        "flex flex-col gap-[4px] text-left mb-[16px] col-span-1 sm:col-span-2",
      );
      wrap.appendChild(el("span", "rsvp_question_label", q.questionTitle));
      const input = el(
        "input",
        "w-full bg-transparent outline-none border-b border-[#D0D0D0] pb-[6px] rsvp_question_value",
      );
      input.type = cfg.type;
      input.value = answer
        ? moment(answer, cfg.store).format(cfg.input)
        : moment().format(cfg.input);
      input.addEventListener("change", (e) => {
        const v = e.target.value;
        handleAnswerChange(
          sessionId,
          scopedId,
          v ? moment(v, cfg.input).format(cfg.store) : "",
          q.questionType,
        );
      });
      wrap.appendChild(input);
      return wrap;
    }

    // Tipe 9: per tamu (nama + satu pilihan), anak per tamu
    if (q.questionType === 9) {
      const frag = el("div", "col-span-1 sm:col-span-2 flex flex-col");
      const guestCount = s.answers[sessionId]?.guestInvitation || 1;
      for (let i = 0; i < guestCount; i++) {
        const guest = s.answers[sessionId]?.[q.id]?.[i];
        const wrap = el(
          "div",
          "col-span-1 sm:col-span-2 flex flex-col gap-[4px] text-left mb-[16px]",
        );
        if (guestCount > 1)
          wrap.appendChild(el("span", "rsvp_question_label", `Guest ${i + 1}`));
        if (q.isCollectName) {
          const line = el(
            "div",
            "flex items-center gap-[10px] border-b border-[#D0D0D0] pb-[8px]",
          );
          line.insertAdjacentHTML("beforeend", PERSON_ICON);
          const input = el(
            "input",
            "w-full bg-transparent border-0 border-none outline-none focus:outline-none focus:ring-0 p-0 pl-[6px] rsvp_question_value text-[14px] md:text-[18px] placeholder:text-[#B0B0B0] text-left",
          );
          input.type = "text";
          input.placeholder = "Enter Your Full Name";
          input.value = guest?.name || "";
          input.addEventListener("input", (e) =>
            handleGuestAttendanceChange(
              sessionId,
              q.id,
              i,
              "name",
              e.target.value,
            ),
          );
          line.appendChild(input);
          wrap.appendChild(line);
        }
        if (q.listAnswerChoices?.length > 0) {
          const box = el("div", "mt-[12px]");
          const current = guest?.options?.[0] || "";
          box.appendChild(
            customSelect({
              options: q.listAnswerChoices,
              value: current,
              onSelect: (val, optionId) => {
                const selectedChoice = q.listAnswerChoices.find(
                  (a) => a.choice === val,
                );
                handleGuestAttendanceChange(
                  sessionId,
                  q.id,
                  i,
                  "options",
                  val ? [val] : [],
                );
                handleGuestAttendanceChange(
                  sessionId,
                  q.id,
                  i,
                  "optionId",
                  selectedChoice?.id || optionId || "",
                );
                rerender();
              },
            }),
          );
          q.listAnswerChoices.forEach((ans) => {
            if (current !== ans.choice || !ans.child?.length) return;
            box.appendChild(
              childBlock("mt-2 pl-3 border-l-2 border-[#D0D0D0]", ans.child, i),
            );
          });
          wrap.appendChild(box);
        }
        frag.appendChild(wrap);
      }
      return frag;
    }

    return el("div");
  }

  // ════════════════════════════ accordion sesi (AccordionSection) ════════════════════════════
  function currentGuestCount(session) {
    const sid = session.eventSessionId;
    const hasSavedResponse = Boolean(
      session.rsvp && session.rsvp > 0 && session.rsvpStatus === 1,
    );
    return s.selectedGuestCounts[sid] !== undefined
      ? s.selectedGuestCounts[sid]
      : hasSavedResponse
        ? (s.answers[sid]?.guestInvitation ?? 0)
        : 0;
  }

  function sessionContent(session) {
    const sid = session.eventSessionId;
    const frag = document.createDocumentFragment();
    frag.appendChild(
      guestDropdown({
        sessionId: sid,
        value: currentGuestCount(session),
        maxGuests: s.pin === "" ? s.publicQuota || 1 : session.quota || 1,
        onSelect: (count) => {
          s.selectedGuestCounts = { ...s.selectedGuestCounts, [sid]: count };
          handleGuestCount(sid, count);
          openDropdownId = null;
          rerender();
        },
      }),
    );
    if (session.questionList && session.questionList.length > 0) {
      const list = el("div", "flex flex-col gap-4 mt-[10px]");
      session.questionList
        .slice()
        .sort((a, b) => a.index - b.index)
        .forEach((q) => list.appendChild(renderQuestion(q, sid)));
      frag.appendChild(list);
    }
    return frag;
  }

  function renderAccordion() {
    const root = $("#rsvpAccordion");
    // semua dropdown lama ikut terhapus, jadi listener klik-luar-nya juga dilepas
    setOutsideHandler(null);
    root.innerHTML = "";
    if (s.attendStatus !== 1) return;

    const isSingleSession = s.questionData.length === 1;
    const list = el("div", "flex flex-col gap-[16px] w-full");
    s.questionData.forEach((session) => {
      const sid = session.eventSessionId;
      const isChecked = s.selectedSessions.includes(sid);
      const layer = openDropdownId === sid ? "relative z-40" : "relative z-10";

      if (isSingleSession) {
        const card = el(
          "div",
          `rounded-[10px] bg-white overflow-visible shadow-sm border border-[#E5E5E5] p-[20px] md:p-[24px] flex flex-col gap-[16px] text-left transition-shadow ${layer}`,
        );
        card.appendChild(sessionContent(session));
        list.appendChild(card);
        return;
      }

      const card = el(
        "div",
        `rounded-[10px] bg-white overflow-visible transition-shadow border border-[#E5E5E5] ${isChecked ? "shadow-md" : "shadow-sm"} ${layer}`,
      );
      const head = el(
        "button",
        "w-full flex items-center justify-between px-[20px] md:px-[24px] py-[16px] md:py-[18px] text-left",
      );
      head.type = "button";
      head.appendChild(
        el(
          "span",
          "rsvp_question_title font-medium text-[14px] md:text-[18px] text-[#111111]",
          session.name,
        ),
      );
      const box = el(
        "span",
        `shrink-0 w-[22px] h-[22px] rounded-[5px] border-2 flex items-center justify-center transition-colors ${isChecked ? "border-[#4B3D2A] bg-[#4B3D2A]" : "border-[#B0B0B0] bg-transparent"}`,
      );
      if (isChecked)
        box.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
      head.appendChild(box);
      head.addEventListener("click", () => {
        handleSessionSelect(sid, !isChecked);
        rerender();
        // animasi buka (motion height 0 -> auto) hanya saat baru dicentang
        if (!isChecked) {
          const c = root.querySelector(`[data-collapse="${CSS.escape(sid)}"]`);
          if (c) {
            c.classList.remove("is-open");
            void c.offsetWidth;
            c.classList.add("is-open");
          }
        }
      });
      card.appendChild(head);

      const collapse = el(
        "div",
        `session-collapse ${isChecked ? "is-open" : ""}`,
      );
      collapse.dataset.collapse = sid;
      const inner = el("div");
      if (isChecked) {
        const content = el(
          "div",
          "px-[20px] md:px-[24px] pb-[20px] md:pb-[24px] flex flex-col gap-[16px] text-left border-t border-[#F0F0F0] pt-[16px]",
        );
        content.appendChild(sessionContent(session));
        inner.appendChild(content);
      }
      collapse.appendChild(inner);
      card.appendChild(collapse);
      list.appendChild(card);
    });
    root.appendChild(list);

    if (s.generalQuestions.length > 0) {
      const g = el("div", "font-normal text-[12px] mt-[16px]");
      const card = el(
        "div",
        "flex flex-col gap-4 w-full shadow-sm rounded-[10px] bg-white border border-[#E5E5E5] p-[20px] md:p-[24px]",
      );
      const inner = el("div", "flex flex-col gap-4");
      s.generalQuestions
        .slice()
        .sort((a, b) => a.index - b.index)
        .forEach((q) =>
          inner.appendChild(renderQuestion(q, GENERAL_SESSION_ID)),
        );
      card.appendChild(inner);
      g.appendChild(card);
      root.appendChild(g);
    }
  }

  function rerender() {
    renderAccordion();
  }

  // ════════════════════════════ status & teks (Reservation.tsx) ════════════════════════════
  function setToggle(btn, active) {
    btn.classList.toggle("bg-[#4B3D2A]", active);
    btn.classList.toggle("text-white", active);
    btn.classList.toggle("bg-transparent", !active);
    btn.classList.toggle("text-[#4B3D2A]", !active);
    btn.style.backgroundColor = active ? "#4B3D2A" : "transparent";
    btn.style.color = active ? "#FFFFFF" : "#4B4B44";
    btn.setAttribute("aria-pressed", String(active));
  }

  function renderStatus() {
    const selected =
      s.attendStatus === 1 ? "hadir" : s.attendStatus === 2 ? "tidak" : null;

    setToggle($("#btnAttend"), s.attendStatus === 1);
    setToggle($("#btnNotAttend"), s.attendStatus === 2);

    // =====================================
    // 1. TAMPILKAN SMART RSVP JIKA ATTEND
    // =====================================
    $("#rsvpAttendBlock").classList.toggle(
      "hidden",
      selected !== "hadir" || s.questionData.length === 0,
    );

    $("#rsvpSessionHint").textContent =
      (s.questionData?.length ?? 0) > 1
        ? "Please select the events you will attend"
        : "PLEASE COMPLETE THE INFORMATION BELOW";

    // =====================================
    // 2. CONFIRM HANYA MUNCUL SETELAH MEMILIH
    // =====================================
    const confirmTitle = document.getElementById("rsvpConfirmTitle");

    const confirmButton =
      document.getElementById("rsvpConfirmBtn") ||
      document.getElementById("btnSubmitRsvp");

    const hasSelectedAttendance = s.attendStatus === 1 || s.attendStatus === 2;

    confirmTitle?.classList.toggle("hidden", !hasSelectedAttendance);

    confirmButton?.classList.toggle("hidden", !hasSelectedAttendance);

    // =====================================
    // 3. UPDATE LABEL DAN PERTANYAAN
    // =====================================
    renderSubmitLabel();
    renderAccordion();
  }

  function renderSubmitLabel() {
    const btn = $("#btnSubmitRsvp");
    const label = $("#btnSubmitLabel");
    btn.disabled = s.isSubmit;
    if (s.isSubmit) {
      label.textContent = "SENDING...";
    } else if (s.attendStatus === 1) {
      label.innerHTML = "Confirm<br>Attendance";
    } else if (s.attendStatus === 2) {
      label.innerHTML = "Confirm Unable<br>To Attend";
    } else {
      label.textContent = "CONFIRM";
    }
  }

  function renderGuestTexts() {
    const guest = s.guestData || {};
    const name = guest.name || s.paramUrl;
    if (name) $("#rsvpGuestName").textContent = name;
    const date = guest.closeRSVPDate || s.data?.dataEvent?.closeRSVPDate;
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        $("#rsvpDueDate").textContent = parsed.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    }
  }

  function isClosed(event) {
    if (event?.isAllowedRSVP === false) return true;
    if (!event?.closeRSVPDate) return false;
    const raw = String(event.closeRSVPDate);
    const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw)
      ? raw
      : raw + "+07:00";
    const deadline = new Date(normalized);
    return (
      Number.isFinite(deadline.getTime()) && Date.now() > deadline.getTime()
    );
  }

  // Adaptasi HTML: tidak mengubah class ukuran, jarak, warna, atau ornamen yang ada.
  function prepareBryanDOM() {
    const attend = $("#btnAttend");
    const confirmBtn = $("#btnSubmitRsvp");
    const form = $("#rsvpAttendBlock");
    if (!attend || !confirmBtn || !form) return false;
    const toggles = attend.parentElement;
    if (!toggles.id) toggles.id = "rsvpToggles";
    form.removeAttribute("hidden");
    form.classList.add("hidden");
    let hint = document.getElementById("rsvpSessionHint");
    if (!hint) {
      hint = el(
        "p",
        "font-constan text-[3.59vw] md:text-[14px] text-center text-[#4B4B44]",
      );
      hint.id = "rsvpSessionHint";
      form.appendChild(hint);
    }
    if (!document.getElementById("rsvpAccordion")) {
      const accordion = el("div", "w-full");
      accordion.id = "rsvpAccordion";
      form.appendChild(accordion);
    }
    // Jangan pindahkan teks Confirm Your RSVP atau tombol Confirm dari DOM asli.
    if (!document.getElementById("btnSubmitLabel")) {
      confirmBtn.innerHTML = "";
      const label = el("span", "leading-[1]");
      label.id = "btnSubmitLabel";
      confirmBtn.appendChild(label);
    }
    if (!document.getElementById("modalRoot")) {
      const root = el("div");
      root.id = "modalRoot";
      document.body.appendChild(root);
    }
    return true;
  }

  function showLoader() {
    lockScroll(true);
    const overlay = el(
      "div",
      "fixed inset-0 z-[9999] flex items-center justify-center bg-black/40",
    );
    overlay.appendChild(
      el(
        "div",
        "animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent",
      ),
    );
    $("#modalRoot").appendChild(overlay);
    return {
      remove: () => {
        overlay.remove();
        lockScroll(false);
      },
    };
  }

  // SubmitButton.onButtonClick: cek jumlah tamu tiap sesi yang dipilih dulu, baru handleSubmit
  function onSubmitClick() {
    // Tombol tetap interaktif saat CLOSED, tetapi tidak boleh mengirim data.
    if (s.closed || isClosed(s.data?.dataEvent)) return showClosedModal();
    if (!s.ready) return notifyRSVP("rsvp_unavailable");
    if (s.attendStatus === 1) {
      for (const session of s.questionData) {
        const sid = session.eventSessionId;
        if (!s.selectedSessions.includes(sid)) continue;
        const count = currentGuestCount(session);
        if (!count || count <= 0) {
          handleGuestCount(sid, 0);
          return showGuestCountWarning();
        }
      }
    }
    handleSubmit();
  }

  async function handleRSVP() {
    // Periksa status lagi sebelum API, termasuk jika admin menutup RSVP saat popup terbuka.
    if (s.closed || isClosed(s.data?.dataEvent)) {
      return showClosedModal();
    }
    s.isSubmit = true;
    renderSubmitLabel();
    const loader = showLoader();
    let res;
    try {
      if (isClosed(s.data?.dataEvent)) return showClosedModal();
      res = await api.submitRSVP(collectDataRSVP());
    } catch (error) {
      console.error("[Bryan RSVP] Submission error:", error);
      res = { status: 0, data: {} };
    } finally {
      loader.remove();
      s.isSubmit = false;
      renderSubmitLabel();
    }

    const genericId =
      "Terjadi kesalahan. Silakan periksa koneksi internet Anda dan coba lagi.";
    const genericEn =
      "Something went wrong. Please check your internet connection and try again";
    // hooks/useEventRSVP.ts
    if (res.status === 200) {
      s.titleResponseRSVP = "RSVP CONFIRMED";
      showConfirmedModal(s.attendStatus);
      return;
    }
    const errorId =
      res.status === 400
        ? (res.data?.messageID ?? res.data?.message ?? genericId)
        : genericId;
    const errorEn =
      res.status === 400
        ? (res.data?.messageEN ?? res.data?.message ?? genericEn)
        : genericEn;
    if (
      errorEn ===
      "Reservation Deadline has ended. Please contact helpdesk team for manual reservations. Thank you."
    ) {
      showClosedModal();
    } else {
      s.titleResponseRSVP = "Sorry";
      s.failedSubmitMessage =
        errorId || "Failed to submit RSVP, Please try again.";
      s.failedEnSubmitMessage =
        errorEn || "Failed to submit RSVP, Please try again.";
      showIncompleteModal();
    }
  }

  // ════════════════════════════ payload (collectDataRSVP, verbatim) ════════════════════════════
  function collectDataRSVP() {
    const answers = s.answers;
    const questionData = s.questionData;

    const buildChildParentIdMap = (sessionId) => {
      const childParentIdMap = {};
      Object.entries(answers[sessionId] || {}).forEach(([, val]) => {
        if (Array.isArray(val)) {
          val.forEach((guest, guestIndex) => {
            const optionId = Array.isArray(guest.optionId)
              ? guest.optionId[0]
              : guest.optionId;
            if (optionId) {
              Object.keys(answers[sessionId]).forEach((key) => {
                if (key.endsWith(`-guest-${guestIndex}`)) {
                  childParentIdMap[key] = {
                    parentId: optionId,
                    parentIndex: guestIndex,
                  };
                }
              });
            }
          });
        }
      });
      return childParentIdMap;
    };

    const buildQuestions = (sessionId) => {
      const childParentIdMap = buildChildParentIdMap(sessionId);
      const nonGuestChildMap = {};
      const questionList =
        questionData.find((x) => x.eventSessionId === sessionId)
          ?.questionList || [];

      s.generalQuestions.concat(questionList).forEach((q) => {
        if (!q.listAnswerChoices?.length) return;
        q.listAnswerChoices.forEach((ans) => {
          if (!ans.child?.length) return;
          const selectedAnswer = answers[sessionId]?.[q.id];
          const isSelected =
            selectedAnswer === ans.choice ||
            (typeof selectedAnswer === "string" &&
              selectedAnswer.split(",").includes(ans.choice));
          if (isSelected) {
            ans.child.forEach((childQ) => {
              nonGuestChildMap[childQ.id] = ans.id;
              const recurse = (cq) => {
                cq.listAnswerChoices?.forEach((cans) => {
                  if (!cans.child?.length) return;
                  const cSelected = answers[sessionId]?.[cq.id];
                  const cIsSelected =
                    cSelected === cans.choice ||
                    (typeof cSelected === "string" &&
                      cSelected.split(",").includes(cans.choice));
                  if (cIsSelected) {
                    cans.child.forEach((gcQ) => {
                      nonGuestChildMap[gcQ.id] = cans.id;
                      recurse(gcQ);
                    });
                  }
                });
              };
              recurse(childQ);
            });
          }
        });
      });

      const validParentKeys = new Set();
      Object.entries(answers[sessionId] || {}).forEach(([, val]) => {
        if (Array.isArray(val)) {
          val.forEach((guest, guestIndex) => {
            const optionIds = Array.isArray(guest.optionId)
              ? guest.optionId
              : guest.optionId
                ? [guest.optionId]
                : [];
            optionIds.forEach((id) =>
              validParentKeys.add(`${id}-${guestIndex}`),
            );
          });
        }
      });

      const directParentMap = {};
      Object.entries(answers[sessionId] || {}).forEach(([, val]) => {
        if (Array.isArray(val)) {
          val.forEach((guest, guestIndex) => {
            questionList.forEach((q) => {
              if (q.questionType === 9) {
                q.listAnswerChoices?.forEach((ans) => {
                  if (ans.choice === guest.options?.[0] && ans.child?.length) {
                    const walkQuestion = (parentQ) => {
                      if (!parentQ.listAnswerChoices?.length) return;
                      parentQ.listAnswerChoices.forEach((pans) => {
                        if (!pans.child?.length) return;
                        const scopedAnswer =
                          answers[sessionId]?.[
                            `${parentQ.id}-guest-${guestIndex}`
                          ] ?? answers[sessionId]?.[parentQ.id];
                        const isSelected =
                          scopedAnswer === pans.choice ||
                          (typeof scopedAnswer === "string" &&
                            scopedAnswer.split(",").includes(pans.choice));
                        if (isSelected) {
                          pans.child.forEach((childQ) => {
                            directParentMap[
                              `${childQ.id}-guest-${guestIndex}`
                            ] = { parentId: pans.id, parentIndex: guestIndex };
                            walkQuestion(childQ);
                          });
                        }
                      });
                    };
                    ans.child.forEach((childQ) => walkQuestion(childQ));
                  }
                });
              }
            });
          });
        }
      });

      const validDirectParentKeys = new Set();
      Object.entries(answers[sessionId] || {}).forEach(([qId, val]) => {
        if (!Array.isArray(val) && qId !== "guestInvitation") {
          const guestIndexMatch = qId.match(/-guest-(\d+)$/);
          const guestIndex = guestIndexMatch ? guestIndexMatch[1] : null;
          const realQId = qId.replace(/-guest-\d+$/, "");
          const findQ = (questions) => {
            for (const q of questions) {
              if (q.id === realQId) return q;
              for (const ans of q.listAnswerChoices || []) {
                for (const child of ans.child || []) {
                  const found = findQ([child]);
                  if (found) return found;
                }
              }
            }
            return null;
          };
          const q = findQ(questionList);
          if (q?.listAnswerChoices?.length) {
            q.listAnswerChoices.forEach((ans) => {
              const answerVal = val;
              if (
                ans.choice === answerVal ||
                answerVal.split(",").includes(ans.choice)
              ) {
                validDirectParentKeys.add(`${ans.id}-${guestIndex ?? "0"}`);
              }
            });
          }
        }
      });

      return Object.entries(answers[sessionId] || {})
        .filter(
          ([qId]) =>
            qId !== "guestInvitation" &&
            !Array.isArray(answers[sessionId][qId]),
        )
        .filter(([qId]) => {
          const parentInfo = childParentIdMap[qId];
          if (!parentInfo) return true;
          const type9Valid = validParentKeys.has(
            `${parentInfo.parentId}-${parentInfo.parentIndex}`,
          );
          if (!type9Valid) return false;
          const directParent = directParentMap[qId];
          if (directParent)
            return validDirectParentKeys.has(
              `${directParent.parentId}-${directParent.parentIndex}`,
            );
          return true;
        })
        .map(([qId, answer]) => {
          const realId = qId.replace(/-guest-\d+$/, "");
          const parentInfo = childParentIdMap[qId];
          const nonGuestParentId = nonGuestChildMap[realId];
          return {
            id: realId,
            answer,
            optionAnswer: "",
            parentId: parentInfo
              ? parentInfo.parentId
              : nonGuestParentId
                ? nonGuestParentId
                : null,
            parentIndex: parentInfo ? parentInfo.parentIndex : null,
          };
        });
    };

    const buildGuestAttendances = (sessionId) =>
      Object.entries(answers[sessionId] || {})
        .filter(([qId]) => Array.isArray(answers[sessionId][qId]))
        .map(([qId, guests]) => ({
          id: qId,
          answer: `${guests.length}|${guests.map((g) => (g.options.length ? `${g.name}~${g.options.join("-")}` : g.name)).join(";")}`,
          optionAnswer: "",
        }));

    return {
      eventId: s.eventId,
      groupId:
        s.isPublicInvitation && s.groupUrl && s.groupUrl !== ""
          ? s.group?.id || null
          : null,
      name: $("#attend_name")?.value || "" || s.guestData.name || "",
      phone: (s.iti ? s.iti.getNumber() : "") || s.guestData.phone || "",
      pin: s.pin || null,
      status: s.attendStatus,
      url: s.data.url,
      maybeDate: null,
      maybeNote: null,
      questionList:
        s.attendStatus === 1
          ? [
              ...questionData.map((session) => {
                const sessionId = session.eventSessionId;
                if (!s.selectedSessions.includes(sessionId)) {
                  return {
                    eventSessionId: sessionId,
                    guestInvitation: 0,
                    questions: [],
                    guestAttendances: [],
                  };
                }
                return {
                  eventSessionId: sessionId,
                  guestInvitation: answers[sessionId]?.guestInvitation || 1,
                  questions: buildQuestions(sessionId),
                  guestAttendances: buildGuestAttendances(sessionId),
                };
              }),
              ...(Object.keys(answers[GENERAL_SESSION_ID] || {}).length > 1
                ? [
                    {
                      guestInvitation: 1,
                      questions: buildQuestions(GENERAL_SESSION_ID),
                      guestAttendances:
                        buildGuestAttendances(GENERAL_SESSION_ID),
                    },
                  ]
                : []),
            ]
          : [],
    };
  }

  // ════════════════════════════ submit (handleSubmit + handleRSVP) ════════════════════════════
  function handleSubmit() {
    if (s.isPublicInvitation && !s.pin) {
      if (!($("#attend_name")?.value || ""))
        return Swal.fire({ title: "Name is required!", icon: "error" });
      if (!(s.iti && s.iti.getNumber()))
        return Swal.fire({ title: "Phone Number is required!", icon: "error" });
    }
    if (s.attendStatus === 0) {
      s.titleResponseRSVP = "CONFIRM YOUR ATTENDANCE";
      s.failedEnSubmitMessage = "Please confirm your attendance.";
      s.failedSubmitMessage = "Mohon konfirmasi kehadiran Anda.";
      return showIncompleteRSVPModal();
    }
    if (s.attendStatus === 1 && !s.selectedSessions.length) {
      s.titleResponseRSVP = "SESSION REQUIRED";
      s.failedEnSubmitMessage =
        "Some session selections are still missing. Please select at least one session to attend.";
      s.failedSubmitMessage =
        "Pilihan sesi acara masih belum ditentukan. Mohon pilih minimal satu sesi yang akan dihadiri.";
      return showIncompleteModal();
    }

    if (s.attendStatus === 1) {
      for (const sessionId of s.selectedSessions) {
        const guestCount = s.answers[sessionId]?.guestInvitation;
        if (!guestCount || guestCount === 0 || isNaN(guestCount)) {
          s.titleResponseRSVP = "INCOMPLETE RSVP";
          s.failedSubmitMessage = "Please select the Number of Guest.";
          s.failedEnSubmitMessage = "Please select the Number of Guest.";
          return showIncompleteRSVPModal();
        }
      }

      const isAnswerEmpty = (answer) =>
        answer === undefined ||
        answer === null ||
        answer === "" ||
        (Array.isArray(answer) && answer.length === 0);

      const validateQuestion = (q, sessionId, guestIndex) => {
        const scopedId =
          guestIndex !== undefined ? `${q.id}-guest-${guestIndex}` : q.id;
        const answer = s.answers[sessionId]?.[scopedId];

        if (q.questionType === 9) {
          const guestCount = s.answers[sessionId]?.guestInvitation || 1;
          const guestAnswers = s.answers[sessionId]?.[q.id] || [];
          for (let i = 0; i < guestCount; i++) {
            const guest = guestAnswers[i];
            const lbl = `guest ${i + 1} in "${q.questionTitle}"`;
            if (!guest?.name?.trim())
              return `Please fill in the name for ${lbl}`;
            if (
              q.guestAttendanceOptionType === 1 &&
              (!guest?.options || guest.options.length === 0)
            )
              return `Please select an option for ${lbl}`;
            if (q.guestAttendanceOptionType === 2 && !guest?.options?.[0])
              return `Please select an option for ${lbl}`;
            if (q.listAnswerChoices?.length) {
              for (const ans of q.listAnswerChoices) {
                if (!guest?.options?.includes(ans.choice) || !ans.child?.length)
                  continue;
                for (const childQ of ans.child) {
                  const error = validateQuestion(childQ, sessionId, i);
                  if (error) return error;
                }
              }
            }
          }
          return null;
        }

        if (isAnswerEmpty(answer)) return `Please fill in "${q.questionTitle}"`;

        if (q.listAnswerChoices?.length) {
          for (const ans of q.listAnswerChoices) {
            const choice = ans.choice.split("*|*")[0];
            const isSelected =
              answer === choice ||
              (typeof answer === "string" &&
                answer
                  .split(",")
                  .some((a) => a === choice || a.startsWith(`${choice}:;`)));
            if (!isSelected || !ans.child?.length) continue;
            for (const childQ of ans.child) {
              const error = validateQuestion(childQ, sessionId, guestIndex);
              if (error) return error;
            }
          }
        }
        return null;
      };

      const validateQuestions = (list, sessionId) => {
        for (const q of list) {
          const error = validateQuestion(q, sessionId);
          if (error) return error;
        }
        return null;
      };

      for (const session of s.questionData) {
        if (!s.selectedSessions.includes(session.eventSessionId)) continue;
        const error = validateQuestions(
          session.questionList,
          session.eventSessionId,
        );
        if (error) {
          s.titleResponseRSVP = "INCOMPLETE RSVP";
          s.failedSubmitMessage = error;
          return showIncompleteRSVPModal();
        }
      }

      const generalError = validateQuestions(
        s.generalQuestions,
        GENERAL_SESSION_ID,
      );
      if (generalError) {
        s.titleResponseRSVP = "INCOMPLETE RSVP";
        s.failedSubmitMessage = generalError;
        return showIncompleteRSVPModal();
      }
    }

    showConfirmModal();
  }

  // ════════════════════════════ init data (effect "Initialize data" + merge sesi) ════════════════════════════
  function initAnswersFromGuest(sessions, smartRsvp) {
    const mergedData = sessions
      .filter(
        (x) =>
          x.eventId === s.eventId ||
          x.eventId === "00000000-0000-0000-0000-000000000000",
      )
      .map((session) => {
        const q = smartRsvp.find((x) => x.id === session.eventSessionId);
        return {
          ...session,
          rsvp: q?.rsvp ?? 0,
          rsvpStatus: q?.rsvpStatus ?? 0,
          questionList: q?.questionList || [],
        };
      });

    if (mergedData.length === 0) {
      Swal.fire({
        title: "Error",
        text: "No sessions found for this event",
        icon: "error",
      });
      return;
    }

    s.questionData = mergedData;
    if (smartRsvp.some((i) => i.rsvpStatus === 1)) s.attendStatus = 1;
    else if (smartRsvp.some((i) => i.rsvpStatus === 2)) s.attendStatus = 2;
    else s.attendStatus = 0;

    const initialAnswers = {};
    const initialSessions = [];

    const initializeChildAnswers = (q, sessionId, maxGuestIndex) => {
      const apply = (childQ) => {
        if (childQ.guestAnswerList?.length) {
          childQ.guestAnswerList.forEach((guestAnswer) => {
            const parentIndex = guestAnswer.parentIndex;
            if (maxGuestIndex !== undefined) {
              if (
                parentIndex === null ||
                parentIndex === undefined ||
                parentIndex >= maxGuestIndex
              )
                return;
            }
            const scopedId =
              parentIndex !== null && parentIndex !== undefined
                ? `${childQ.id}-guest-${parentIndex}`
                : childQ.id;
            if (childQ.questionType === 9) {
              const guestCount = parseInt(guestAnswer.answer || "1");
              const details =
                guestAnswer.guestAttendanceDetail?.split(";") || [];
              initialAnswers[sessionId][scopedId] = Array.from(
                { length: guestCount },
                (_, i) => {
                  const [name, options] = details[i]?.split("~") || ["", ""];
                  return {
                    id: `${scopedId}-${i + 1}`,
                    name: name || "",
                    options: options
                      ? childQ.guestAttendanceOptionType === 1
                        ? options.split("-")
                        : [options]
                      : [],
                    optionId: "",
                  };
                },
              );
            } else {
              initialAnswers[sessionId][scopedId] = guestAnswer.answer || "";
            }
          });
        }
        initializeChildAnswers(childQ, sessionId, maxGuestIndex);
      };
      q.listAnswerChoices?.forEach((ans) => ans.child?.forEach(apply));
      q.child?.forEach(apply);
    };

    const initQuestion = (q, sessionId) => {
      if (q.questionType === 9) {
        const guestAnswerItem = q.guestAnswerList?.[0];
        const guestCount = parseInt(guestAnswerItem?.answer || "1");
        const details =
          guestAnswerItem?.guestAttendanceDetail?.split(";") || [];
        initialAnswers[sessionId][q.id] = Array.from(
          { length: guestCount },
          (_, i) => {
            const [name, optionText] = details[i]?.split("~") || ["", ""];
            const matchedChoice = q.listAnswerChoices?.find(
              (a) => a.choice === optionText,
            );
            return {
              id: `${q.id}-${i + 1}`,
              name: name || "",
              options: optionText
                ? q.guestAttendanceOptionType === 1
                  ? optionText.split("-")
                  : [optionText]
                : [],
              optionId: matchedChoice?.id || "",
            };
          },
        );
        initializeChildAnswers(q, sessionId, guestCount);
      } else {
        initialAnswers[sessionId][q.id] = q.guestAnswerList?.[0]?.answer || "";
        initializeChildAnswers(q, sessionId);
      }
    };

    const generalList =
      smartRsvp.find((q) => q.questionGeneralList?.length)
        ?.questionGeneralList || [];
    s.generalQuestions = generalList;
    initialAnswers[GENERAL_SESSION_ID] = { guestInvitation: 1 };
    generalList.forEach((q) => initQuestion(q, GENERAL_SESSION_ID));

    mergedData.forEach((session) => {
      const sessionId = session.eventSessionId;
      initialAnswers[sessionId] = { guestInvitation: session.rsvp || 1 };
      session.questionList.forEach((q) => initQuestion(q, sessionId));
      if (session.rsvpStatus === 1) initialSessions.push(sessionId);
    });

    s.answers = initialAnswers;
    s.selectedSessions = initialSessions;
  }

  function initPublicSessions() {
    const ev = s.data.dataEvent;
    const pubIds = ev.publicSessionLayout
      ? ev.publicSessionLayout.split(",")
      : [];
    const allowedSessions = s.isPublicInvitation
      ? (s.data.dataSession || []).filter((session) =>
          pubIds.includes(session.id.toString()),
        )
      : [];
    s.questionData = allowedSessions.map((session) => ({
      ...session,
      eventSessionId: session.id,
      questionList: session.questionList || [],
    }));
    s.answers = allowedSessions.reduce(
      (acc, session) => ({ ...acc, [session.id]: { guestInvitation: 1 } }),
      {},
    );
  }

  function unwrap(res) {
    return res?.data?.data ?? res?.data ?? null;
  }

  function bindButtons() {
    if (s._listenersBound) return;
    $("#btnAttend").addEventListener("click", () => {
      s.attendStatus = 1;
      if (
        s.questionData.length === 1 &&
        !s.selectedSessions.includes(s.questionData[0].eventSessionId)
      ) {
        handleSessionSelect(s.questionData[0].eventSessionId, true);
      }
      renderStatus();
    });
    $("#btnNotAttend").addEventListener("click", () => {
      s.attendStatus = 2;
      renderStatus();
    });
    $("#btnSubmitRsvp").addEventListener("click", onSubmitClick);
    $("#btnChatSupport").addEventListener("click", (event) => {
      const link = s.invitationUrl;
      if (!link || link.endsWith("#")) event.preventDefault();
    });
    s._listenersBound = true;
  }

  async function init({ data, pin, guest, paramUrl = "" }) {
    if (!prepareBryanDOM()) {
      console.error("[Bryan RSVP] Required HTML nodes missing");
      return;
    }
    s.data = { ...data, dataGuest: guest ?? null };
    s.pin = pin || "";
    s.paramUrl = paramUrl || "";
    s.eventId = data.dataEvent?.id || data.dataContent?.eventId || "";
    s.publicQuota = data.dataEvent?.publicQuota || 1;
    s.isPublicInvitation = [1, 2].includes(data.dataEvent?.eventAccess);
    s.guestData = guest || {};
    s.invitationUrl = document.getElementById("rsvpChatSupport")?.href || "#";
    s.closed = isClosed(data.dataEvent);
    s.ready = false;
    s.attendStatus = 0;
    s.selectedSessions = [];
    s.answers = {};
    s.questionData = [];
    s.generalQuestions = [];
    if (data.dataEvent?.rsvpSuccessMessage)
      s.titleResponseRSVP = data.dataEvent.rsvpSuccessMessage;
    if (data.dataEvent?.rsvpFailedMessage)
      s.failedSubmitMessage = data.dataEvent.rsvpFailedMessage;

    bindButtons();
    renderGuestTexts();

    try {
      if (s.pin) {
        if (!api?.getGuestSessionsByPin || !api?.getSmartRsvpData)
          throw new Error("TwinkleAPI belum siap");
        const [sessionRes, smartRes] = await Promise.all([
          api.getGuestSessionsByPin(s.pin, s.eventId),
          api.getSmartRsvpData(data.url, s.pin),
        ]);
        if (sessionRes?.ok === false || smartRes?.ok === false)
          throw new Error("API RSVP gagal");
        const rawSessions = unwrap(sessionRes);
        const smart = unwrap(smartRes);
        if (!Array.isArray(rawSessions) || !Array.isArray(smart))
          throw new Error("Response API RSVP tidak valid");
        const sessions = rawSessions.map((x) => ({
          ...x,
          eventSessionId: x.eventSessionId || x.id,
        }));
        initAnswersFromGuest(sessions, smart);
      } else if (s.isPublicInvitation) {
        initPublicSessions();
      } else {
        console.warn("[Bryan RSVP] PIN/private invitation not yet available");
      }
      s.ready = s.questionData.length > 0;
      if (
        s.attendStatus === 1 &&
        s.questionData.length === 1 &&
        !s.selectedSessions.includes(s.questionData[0].eventSessionId)
      ) {
        handleSessionSelect(s.questionData[0].eventSessionId, true);
      }
      renderStatus();
      console.info("[Bryan RSVP] Loaded", {
        ready: s.ready,
        sessions: s.questionData.length,
        closed: s.closed,
      });
    } catch (err) {
      s.ready = false;
      renderStatus();
      console.error("[Bryan RSVP] API load failed:", err);
    }
  }

  function boot() {
    const app = window.BryanApp?.state;
    // Tombol dapat dipilih bahkan sebelum API siap atau RSVP CLOSED.
    // Tidak menampilkan sesi palsu pada domain publik.
    if (!app?.dataEvent || !window.TwinkleAPI) {
      if (prepareBryanDOM()) {
        bindButtons();
        renderStatus();
      }
      return;
    }
    // 'bryan:data-ready' dapat terpanggil berulang; data disegarkan tiap event.
    init({
      data: {
        ...(app.data || {}),
        dataEvent: app.dataEvent,
        dataContent: app.dataContent || app.data?.dataContent || {},
        url: app.url || app.data?.url || app.slug || "",
      },
      pin: app.pin,
      guest: app.guest,
      paramUrl: app.urlTo || "",
    });
  }

  window.addEventListener("bryan:data-ready", boot);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();

  return {
    init,
    collectDataRSVP,
    state: s,
    loadRSVP: boot,
    buildPayload: collectDataRSVP,
  };
})();
