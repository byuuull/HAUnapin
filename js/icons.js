/* ============================================================
   Icons: one small inline-SVG set (24×24, stroke-based) so the
   site needs no icon font or image requests.
   Usage: HNY.icon('search')  ->  '<svg class="icon" …>…</svg>'
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
    share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
    message: '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-8.5 8.5"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    building: '<path d="M4 21V5.5L12 3l8 2.5V21"/><path d="M4 21h16M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/>',
    route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
    hand: '<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11M10 10.5V5a1.5 1.5 0 0 1 3 0v5.5M13 10.5V6a1.5 1.5 0 0 1 3 0v6M16 11a1.5 1.5 0 0 1 3 0v3a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L4 15.5a1.5 1.5 0 0 1 2.2-2L7 14.5V11"/>',
    handshake: '<path d="m3 11 4-4 4 2 4-2 6 4-4 4"/><path d="m7 7 5 5a1.5 1.5 0 0 0 2.1 0l.4-.4M9 15l2 2M11 13l3 3M13 11l3 3"/><path d="m3 11 4 4"/>',
    box: '<path d="M3.5 8 12 4l8.5 4v8L12 20l-8.5-4V8Z"/><path d="M3.5 8 12 12l8.5-4M12 12v8"/>',
    edit: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M5 4h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 5.3 5.3l1.4-2.2L19 14.5V18a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z"/>',
    gate: '<path d="M3 21V8l9-5 9 5v13"/><path d="M7 21v-8h10v8M12 13v8"/>',
    parking: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3"/>',

    logout: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.6 3.3M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"/><path d="M9.9 10a3 3 0 0 0 4.2 4.2"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17h.01"/>',
    street: '<circle cx="12" cy="5" r="2.2"/><path d="M12 7.5v6M9 21l3-7.5 3 7.5M8.5 11h7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    send: '<path d="M21 3 3 10.5l7 3 3 7L21 3Z"/><path d="m10 13.5 4.5-4.5"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/>',
    facebook: '<path d="M14 3h3v4h-2.5a1 1 0 0 0-1 1v2.5H17l-.5 4h-3V21h-4v-6.5H7v-4h2.5V7.5A4.5 4.5 0 0 1 14 3Z"/>',
    xsocial: '<path d="M4 4l16 16M20 4 4 20"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M16.8 7.2h.01"/>',
    youtube: '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="m10.5 9.5 4 2.5-4 2.5v-5Z"/>',
    google: '<path d="M20.5 12.2c0-.6 0-1.1-.2-1.7H12v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.6-3.9 2.6-6.5Z"/><path d="M12 21c2.4 0 4.4-.8 5.9-2.2l-2.9-2.2c-.8.5-1.8.9-3 .9a5.3 5.3 0 0 1-5-3.6H4v2.3A9 9 0 0 0 12 21Z"/><path d="M7 13.9a5.3 5.3 0 0 1 0-3.6V8H4a9 9 0 0 0 0 8.2l3-2.3Z"/><path d="M12 6.6c1.3 0 2.5.5 3.4 1.3L18 5.4A9 9 0 0 0 4 8l3 2.3a5.3 5.3 0 0 1 5-3.7Z"/>',
    apple: '<path d="M15.5 3.5c-1 .1-2.2.8-2.9 1.6-.6.7-1.1 1.8-.9 2.9 1.1 0 2.2-.7 2.8-1.5.7-.8 1.1-1.9 1-3Z"/><path d="M19.5 16.5c-.5 1.2-.8 1.7-1.5 2.8-1 1.5-2.3 3.3-4 3.3-1.5 0-1.9-1-3.9-1s-2.5 1-4 1c-1.7 0-2.9-1.6-3.9-3.1C-.5 15.4 1.7 8.6 6 8.6c1.6 0 2.6 1 3.9 1s2.1-1 3.9-1c1.4 0 2.8.7 3.8 2a4.4 4.4 0 0 0 1.9 5.9Z"/>',

    /* Categories */
    'cat-electronics': '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    'cat-ids': '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 15.5c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4M14 13.5h3"/>',
    'cat-bags': '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    'cat-wallets': '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M16 13.5h.01"/>',
    'cat-clothing': '<path d="M8.5 4 4 6.5l1.8 4 2.2-1V20h8V9.5l2.2 1 1.8-4L15.5 4a3.5 3.5 0 0 1-7 0Z"/>',
    'cat-books': '<path d="M5 4.5h5.5A2.5 2.5 0 0 1 13 7v13a2 2 0 0 0-2-2H5V4.5Z"/><path d="M19 4.5h-3.5A2.5 2.5 0 0 0 13 7v13a2 2 0 0 1 2-2h4V4.5Z"/>',
    'cat-keys': '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2M14 9l2 2"/>',
    'cat-accessories': '<path d="M9 3h6v4.5a3 3 0 0 1 2 2.8V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8.7a3 3 0 0 1 2-2.8V3Z"/><path d="M7 13h10"/>',
    'cat-others': '<path d="M3.5 8 12 4l8.5 4v8L12 20l-8.5-4V8Z"/><path d="M3.5 8 12 12l8.5-4M12 12v8"/>',

    /* Social */
    facebook: '<path d="M14 3h3v4h-2.5a1 1 0 0 0-1 1v2.5H17l-.5 4h-3V21h-4v-6.5H7v-4h2.5V7.5A4.5 4.5 0 0 1 14 3Z"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8v.01"/>',
  };

  function icon(name, cls = 'icon', label = '') {
    const body = P[name] || P.box;
    const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`;
  }

  /* Brand mark: burgundy-rimmed magnifying glass, gold handle, pin holding a wallet */
  const LOGO = `<svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect width="48" height="48" rx="12" fill="#7A0C10"/>
    <path d="M30.5 30.5 38 38" stroke="#7A0C10" stroke-width="7.5" stroke-linecap="round"/>
    <path d="M30.5 30.5 38 38" stroke="#F4C542" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="21" cy="21" r="12.5" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1"/>
    <circle cx="21" cy="21" r="12.5" fill="none" stroke="#F6DCDC" stroke-width="3"/>
    <path d="M21 31s-6-5.2-6-9.6a6 6 0 0 1 12 0C27 25.8 21 31 21 31Z" fill="#7A0C10"/>
    <rect x="17.6" y="18.4" width="6.8" height="4.8" rx="1.1" fill="#FFFFFF"/>
    <path d="M17.6 20h6.8" stroke="#7A0C10" stroke-width="0.9"/>
    <path d="M14.5 15.5a8 8 0 0 1 4-3" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
  </svg>`;

  HNY.icon = icon;
  HNY.ICON_PATHS = P;
  HNY.LOGO = LOGO;
}(window.HNY));
