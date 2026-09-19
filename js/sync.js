/* ============================================================
   Keep the account and saved data the same on every page.

   On a web server every page shares one localStorage, so this does
   nothing there. When the site is opened straight from a folder
   (file://), Firefox and Firefox-based browsers give EVERY file its own
   storage: you'd log in on login.html, but profile.html wouldn't know,
   send you back to log in, and the two pages would bounce.

   Fix: when you move to another page of this site (link, form, or a
   redirect made with HNY.go), the site's data is handed to the next page
   in the tab's window.name, and the newer copy wins. When you leave the
   site the hand-off is wiped, so no other website can read it.
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  const PREFIX = 'hny_';
  const STAMP = 'hny__sync_at';
  const TAG = 'hny-state:';
  const PARAM = 'hnystate';

  // Plain navigation everywhere unless the file:// hand-off below takes over
  HNY.go = (url, { replace = false } = {}) => { if (replace) window.location.replace(url); else window.location.href = url; };

  let ls; let ss;
  try { ls = window.localStorage; ss = window.sessionStorage; ls.getItem(STAMP); } catch { return; }
  if (window.location.protocol !== 'file:') return;

  const proto = Object.getPrototypeOf(ls);
  const rawSet = proto.setItem;
  const rawRemove = proto.removeItem;
  const ours = (k) => typeof k === 'string' && k.startsWith(PREFIX) && k !== STAMP;
  const stamp = () => Number(ls.getItem(STAMP)) || 0;
  // Only real changes (made after the page has loaded) count as "newer". Set-up writes while a
  // page loads (sample data, map upgrades) must not make an out-of-date page look newer.
  let loading = true;
  document.addEventListener('DOMContentLoaded', () => { loading = false; });
  const touch = () => { if (!loading) rawSet.call(ls, STAMP, String(Date.now())); };

  // Every change to the site's data records when it happened
  proto.setItem = function (k, v) {
    const changed = (this === ls || this === ss) && ours(k) && this.getItem(k) !== String(v);
    rawSet.call(this, k, v);
    if (changed) touch();
  };
  proto.removeItem = function (k) {
    const changed = (this === ls || this === ss) && ours(k) && this.getItem(k) !== null;
    rawRemove.call(this, k);
    if (changed) touch();
  };

  const keysOf = (st) => { const out = []; for (let i = 0; i < st.length; i++) { const k = st.key(i); if (ours(k)) out.push(k); } return out; };
  function snapshot() {
    const l = {}; const s = {};
    keysOf(ls).forEach((k) => { l[k] = ls.getItem(k); });
    keysOf(ss).forEach((k) => { s[k] = ss.getItem(k); });
    return { at: stamp(), l, s };
  }
  // Take the handed-over copy only if it's newer than this page's own
  function adopt(snap) {
    // The page you just came from is what you were looking at, so it wins unless this page has a strictly newer change
    if (!snap || typeof snap !== 'object' || !snap.l || Number(snap.at) < stamp()) return false;
    keysOf(ls).forEach((k) => rawRemove.call(ls, k));
    keysOf(ss).forEach((k) => rawRemove.call(ss, k));
    Object.keys(snap.l).forEach((k) => { if (ours(k)) rawSet.call(ls, k, String(snap.l[k])); });
    Object.keys(snap.s || {}).forEach((k) => { if (ours(k)) rawSet.call(ss, k, String(snap.s[k])); });
    rawSet.call(ls, STAMP, String(snap.at));
    return true;
  }

  // 1. Hand-off from the previous page in this tab
  try {
    if (window.name.startsWith(TAG)) adopt(JSON.parse(window.name.slice(TAG.length)));
  } catch { /* damaged hand-off: ignore */ }
  window.name = '';
  // 2. Hand-off in the link (pages opened in a new tab)
  const url = new URL(window.location.href);
  if (url.searchParams.has(PARAM)) {
    try { adopt(JSON.parse(url.searchParams.get(PARAM))); } catch { /* ignore */ }
    url.searchParams.delete(PARAM);
    history.replaceState(history.state, '', url.toString());
  }

  const isSitePage = (href) => {
    try {
      const u = new URL(href, window.location.href);
      return u.protocol === 'file:' && /\.html?$/i.test(u.pathname);
    } catch { return false; }
  };

  let staying = false; // true only when moving to another page of this site
  let undo = 0;
  const handOff = () => {
    staying = true;
    try { window.name = TAG + JSON.stringify(snapshot()); } catch { /* storage too big: skip */ }
    // If no page change actually happens (cancelled click), don't leave the copy lying around
    clearTimeout(undo);
    undo = setTimeout(() => { staying = false; if (window.name.startsWith(TAG)) window.name = ''; }, 2500);
  };

  // Redirects made by the site's own scripts
  HNY.go = (target, { replace = false } = {}) => {
    if (isSitePage(target)) handOff();
    if (replace) window.location.replace(target); else window.location.href = target;
  };

  // Links: same tab -> window.name; new tab -> small copy in the link
  const onLink = (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || !isSitePage(a.href)) { staying = false; return; }
    const newTab = e.type === 'auxclick' || e.ctrlKey || e.metaKey || e.shiftKey || a.target === '_blank';
    if (newTab) {
      const json = JSON.stringify(snapshot());
      if (json.length < 100000) {
        const u = new URL(a.href);
        u.searchParams.set(PARAM, json);
        a.href = u.toString();
        setTimeout(() => a.setAttribute('href', href), 0);
      }
    } else handOff();
  };
  document.addEventListener('click', onLink, true);
  document.addEventListener('auxclick', onLink, true);
  // Forms that go to another page (e.g. the home page search)
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!e.defaultPrevented && f.getAttribute('action') && isSitePage(f.action)) handOff();
  });
  // Leaving any other way (typing an address, an outside link): wipe the hand-off
  window.addEventListener('pagehide', () => { if (!staying) window.name = ''; });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { staying = false; window.name = ''; } });
}(window.HNY));
