(function () {
  const resetTimers = new WeakMap();

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0";

    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    let success = false;

    try {
      success = document.execCommand("copy");
    } catch (error) {
      console.error("[Gift] Fallback copy failed:", error);
    }

    textarea.remove();
    return success;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn("[Gift] Clipboard fallback activated");
      }
    }

    return fallbackCopy(text);
  }

  // Event delegation: mendukung kartu statis dan kartu dari API.
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("#btnCopy, [data-gift-copy]");

    if (!button) return;

    const card = button.closest("#giftCard, [data-gift-extra]");

    if (!card) return;

    const numberElement = card.querySelector("#giftNumber, [data-gift-number]");

    if (!numberElement) return;

    const number = numberElement.textContent.replace(/[^\d]/g, "");

    if (!number) return;

    const success = await copyText(number);

    button.textContent = success ? "Copied!" : "Failed";

    clearTimeout(resetTimers.get(button));

    resetTimers.set(
      button,
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1500),
    );
  });
})();
