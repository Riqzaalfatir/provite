(function () {
  const btn = document.getElementById("btnCopy");
  const numberEl = document.getElementById("giftNumber");
  if (!btn || !numberEl) return;

  const defaultLabel = btn.textContent.trim();
  let resetTimer;

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) {}
    }
    return fallbackCopy(text);
  }

  btn.addEventListener("click", async function () {
    // ambil angkanya saja (spasi/strip dibuang)
    const text = numberEl.textContent.replace(/[^\d]/g, "");
    const ok = await copyText(text);

    btn.textContent = ok ? "Copied!" : "Failed";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      btn.textContent = defaultLabel;
    }, 1500);
  });
})();