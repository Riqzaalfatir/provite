/**
 * TwinkleBook API client (fetch, tanpa axios). Endpoint sama dengan services/EventServices.ts
 * dan services/PMGServices.ts yang dipakai template Next.
 */
window.TwinkleAPI = (function () {
  const base = () => window.TWINKLE_CONFIG.API_BASE_URL;
  const TIMEOUT_MS = 50000; // sama dengan http-client.ts

  // Selalu resolve: { ok, status, data }. data null bila body kosong (mis. 204) atau bukan JSON.
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(base() + path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = null;
        }
      }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, status: 0, data: null, error: err };
    } finally {
      clearTimeout(timer);
    }
  }

  const q = (params) => new URLSearchParams(params).toString();

  return {
    getCurrentEvent: (url) =>
      request(`/api/Event/GetCurrentEvent?${q({ url })}`),
    getEventContentByLang: (eventId, lang) =>
      request(`/api/Event/GetEventContentByLanguage?${q({ eventId, lang })}`),
    getEventSessionRSVP: (eventId) =>
      request(`/api/Event/GetEventSessionRSVPNew?${q({ eventId })}`),

    // 200 = tamu ditemukan, 204 = PIN tidak terdaftar
    getCurrentGuest: (url, pin) =>
      request(`/api/Event/GetCurrentGuest?${q({ url, pin })}`),
    getGuestSessionsByPin: (pin, eventId) =>
      request(`/api/Event/GetGuestEventSessionByPinNew?${q({ pin, eventId })}`),
    getSmartRsvpData: (url, pin) =>
      request(`/api/Event/GetSmartRSVPData?${q({ url, pin })}`),
    getGroupByName: (name, eventId) =>
      request(`/web/api/Group/GetByNameEvent?${q({ name, eventId })}`),

    submitRSVP: (payload) =>
      request(`/api/Event/InputRSVP`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    submitOpenInvitation: (eventId, pin) =>
      request(`/api/Event/OpenInvitation`, {
        method: "POST",
        body: JSON.stringify({ eventId, pin: parseInt(pin, 10) }),
      }),

    getAllPMG: (eventId) =>
      request(`/api/Event/GetAllPersonalGuestMessages?${q({ eventId })}`),
    submitPMG: (payload) =>
      request(`/api/Event/SubmitPersonalGuestMessage`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  };
})();
