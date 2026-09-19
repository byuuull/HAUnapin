/* ============================================================
   Accounts (demo): sign up, log in, reset password, profile.
   Everything lives in this browser's localStorage. Passwords are
   salted and hashed (SHA-256 where the browser allows it), never
   stored as plain text. A real launch would move this to a server.
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  const USERS = 'hny_users_v1';
  const SESSION = 'hny_session_v1';
  const HAU_EMAIL = /^[^\s@]+@hau\.edu\.ph$/i;
  const listeners = new Set();

  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
  const norm = (e) => String(e || '').trim().toLowerCase();

  async function hash(pw, salt) {
    const text = `${salt}:${pw}`;
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch { /* fall through (some browsers block subtle crypto on file://) */ }
    let h1 = 0x811c9dc5; let h2 = 0x01000193;
    for (let i = 0; i < text.length; i++) { h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619); h2 = Math.imul(h2 + text.charCodeAt(i), 2246822507); }
    return `f${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
  }

  const users = () => read(USERS, []);
  const saveUsers = (list) => write(USERS, list);
  const publicUser = (u) => (u ? { name: u.name, email: u.email, studentNo: u.studentNo || '', avatar: u.avatar || '', joined: u.joined, lastLogin: u.lastLogin || 0 } : null);

  /* Brute-force protection: 5 wrong passwords lock that email for 60 seconds */
  const LOCK = 'hny_lock_v1';
  const MAX_TRIES = 5;
  const LOCK_MS = 60 * 1000;
  const locks = () => read(LOCK, {});
  function lockedFor(email) {
    const l = locks()[email];
    return l && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0;
  }
  function failAttempt(email) {
    const all = locks();
    const l = all[email] || { fails: 0, until: 0 };
    if (l.until && l.until <= Date.now()) { l.fails = 0; l.until = 0; } // previous lock has expired
    l.fails += 1;
    if (l.fails >= MAX_TRIES) { l.until = Date.now() + LOCK_MS; l.fails = 0; }
    all[email] = l;
    write(LOCK, all);
    return l.until ? 0 : MAX_TRIES - l.fails;
  }
  const clearFails = (email) => { const all = locks(); delete all[email]; write(LOCK, all); };

  // One demo account so the profile page has something to show
  async function ensureDemo() {
    if (users().some((u) => u.email === 'maria.santos@hau.edu.ph')) return;
    const salt = 'demo-salt';
    const list = users();
    list.push({ name: 'Maria Santos', email: 'maria.santos@hau.edu.ph', studentNo: '2021-00452', avatar: 'images/people/mascot.jpg', salt, pass: await hash('angelite123', salt), joined: Date.now() });
    saveUsers(list);
  }

  // Session: localStorage when "Keep me logged in" is ticked, otherwise this tab only (sessionStorage)
  function readSession() {
    try { const t = JSON.parse(sessionStorage.getItem(SESSION)); if (t) return t; } catch { /* ignore */ }
    return read(SESSION, null);
  }
  function writeSession(obj, remember) {
    try { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); } catch { /* ignore */ }
    if (remember) write(SESSION, obj);
    else { try { sessionStorage.setItem(SESSION, JSON.stringify(obj)); } catch { write(SESSION, obj); } }
  }

  function current() {
    const s = readSession();
    if (!s) return null;
    const u = users().find((x) => x.email === s.email);
    return publicUser(u);
  }
  const emit = () => listeners.forEach((fn) => fn(current()));

  async function signUp({ name, email, studentNo, password }) {
    email = norm(email);
    if (!HAU_EMAIL.test(email)) return { ok: false, field: 'email', msg: 'Use your HAU email, ending in @hau.edu.ph.' };
    if (users().some((u) => u.email === email)) return { ok: false, field: 'email', msg: 'That email already has an account. Try logging in.' };
    const salt = Math.random().toString(36).slice(2, 10);
    const list = users();
    list.push({ name: name.trim(), email, studentNo: (studentNo || '').trim(), avatar: '', salt, pass: await hash(password, salt), joined: Date.now() });
    saveUsers(list);
    writeSession({ email, at: Date.now() }, true);
    emit();
    return { ok: true };
  }

  async function logIn(email, password, remember = true) {
    email = norm(email);
    const wait = lockedFor(email);
    if (wait) return { ok: false, msg: `Too many wrong passwords. Try again in ${wait} seconds, or reset your password.` };
    const list = users();
    const u = list.find((x) => x.email === email);
    if (!u || u.pass !== await hash(password, u.salt)) {
      const left = failAttempt(email);
      return { ok: false, msg: left ? `That email and password don’t match. ${left} ${left === 1 ? 'try' : 'tries'} left before a short lock.` : 'Too many wrong passwords. Try again in 60 seconds, or reset your password.' };
    }
    clearFails(email);
    u.lastLogin = u.thisLogin || 0;
    u.thisLogin = Date.now();
    saveUsers(list);
    write('hny_last_email', email);
    writeSession({ email, at: Date.now() }, remember);
    emit();
    return { ok: true };
  }

  function logOut() { try { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); } catch { /* ignore */ } emit(); }

  const exists = (email) => users().some((u) => u.email === norm(email));

  /* Password reset needs a one-time 6-digit code (a live site would email it; the demo shows it on screen).
     Codes last 10 minutes and allow 5 tries. */
  const RESET = 'hny_reset_v1';
  function requestReset(email) {
    if (!exists(email)) return null;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    try { sessionStorage.setItem(RESET, JSON.stringify({ email: norm(email), code, exp: Date.now() + 10 * 60000, tries: 0 })); } catch { /* ignore */ }
    return code;
  }
  async function resetPassword(email, code, password) {
    let r = null;
    try { r = JSON.parse(sessionStorage.getItem(RESET)); } catch { r = null; }
    if (!r || r.email !== norm(email) || Date.now() > r.exp) return { ok: false, field: 'code', msg: 'That code has expired. Go back and request a new one.' };
    if (r.tries >= 5) return { ok: false, field: 'code', msg: 'Too many tries. Request a new code.' };
    if (String(code).trim() !== r.code) {
      r.tries += 1;
      try { sessionStorage.setItem(RESET, JSON.stringify(r)); } catch { /* ignore */ }
      return { ok: false, field: 'code', msg: 'That code isn’t right. Check it and try again.' };
    }
    try { sessionStorage.removeItem(RESET); } catch { /* ignore */ }
    const list = users();
    const u = list.find((x) => x.email === norm(email));
    if (!u) return { ok: false };
    clearFails(u.email);
    u.salt = Math.random().toString(36).slice(2, 10);
    u.pass = await hash(password, u.salt);
    saveUsers(list);
    return { ok: true };
  }

  async function updateProfile(patch, currentPw, newPw) {
    const me = current();
    if (!me) return { ok: false, msg: 'Please log in again.' };
    const list = users();
    const u = list.find((x) => x.email === me.email);
    if (newPw) {
      if (u.pass !== await hash(currentPw || '', u.salt)) return { ok: false, field: 'current', msg: 'Your current password is wrong.' };
      u.salt = Math.random().toString(36).slice(2, 10);
      u.pass = await hash(newPw, u.salt);
    }
    if (patch.name) u.name = patch.name.trim();
    if (newPw) clearFails(u.email);
    if (patch.studentNo !== undefined) u.studentNo = patch.studentNo.trim();
    saveUsers(list);
    emit();
    return { ok: true };
  }

  window.addEventListener('storage', (e) => { if (e.key === SESSION || e.key === USERS) emit(); });

  HNY.auth = {
    HAU_EMAIL, current, signUp, logIn, logOut, exists, requestReset, resetPassword,
    lastEmail: () => read('hny_last_email', ''), updateProfile, ensureDemo,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // Name as shown on public reports: first name + last initial
    publicName(name) { const p = String(name || '').trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : (p[0] || 'An Angelite'); },
    initials(name) { return String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase(); },
  };
  ensureDemo();
}(window.HNY));
