/**
 * Bryan & Vanessa - TwinkleBook Configuration
 * Fondasi untuk integrasi API dinamis.
 */

window.TWINKLE_CONFIG = {
  API_BASE_URL: "https://api.twinklebook.com",
  MEDIA_BASE_URL: "https://media.twinklebook.com/",

  // Slug project Bryan & Vanessa
  FALLBACK_SLUG: "bryanvanessa",

  DEFAULT_VIDEO: "assets/video/hero.mp4",

  PIN_COOKIE_MAX_AGE: 60 * 60 * 24 * 30,

  pinCookieName: function (slug) {
    return (
      "tb-pin-" +
      String(slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
    );
  },

  isValidPin: function (pin) {
    return typeof pin === "string" && /^\d{1,10}$/.test(pin.trim());
  },

  readPinCookie: function (slug) {
    try {
      const name = this.pinCookieName(slug) + "=";

      const entry = document.cookie.split("; ").find((c) => c.startsWith(name));

      if (!entry) return "";

      const value = decodeURIComponent(entry.substring(name.length)).trim();

      return this.isValidPin(value) ? value : "";
    } catch (error) {
      return "";
    }
  },

  writePinCookie: function (slug, pin) {
    if (!this.isValidPin(pin)) return;

    try {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";

      document.cookie =
        `${this.pinCookieName(slug)}=${pin.trim()}; ` +
        `Max-Age=${this.PIN_COOKIE_MAX_AGE}; ` +
        `Path=/; SameSite=Lax${secure}`;
    } catch (error) {
      console.warn("Cannot save guest PIN");
    }
  },

  clearPinCookie: function (slug) {
    document.cookie =
      `${this.pinCookieName(slug)}=; ` + "Max-Age=0; Path=/; SameSite=Lax";
  },

  getParams: function () {
    const params = new URLSearchParams(window.location.search);

    // Jangan mengambil slug dari pathname,
    // karena invitation.html dibuka melalui iframe.
    const slug = params.get("id") || params.get("url") || this.FALLBACK_SLUG;

    const urlPin = params.get("pin") || "";

    return {
      slug,
      urlPin,
      to: params.get("to") || "",
      group: params.get("group") || "",
    };
  },
};
