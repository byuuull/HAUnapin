/* ============================================================
   UI layer: DOM helpers, formatters, card templates and shared
   chrome (mobile drawer, modal, bottom sheet, toast).
   No data mutations here: views read from HNY.store.
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  const { icon, store } = HNY;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- formatting ---------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function timeAgo(ts) {
    const diff = Math.max(0, Date.now() - ts);
    const m = Math.round(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d}d ago`;
    return fmtDate(ts);
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    let h = d.getHours();
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
  }
  const bName = (id) => (store.building(id) ? store.building(id).name : 'Campus');
  const bShort = (id) => {
    const b = store.building(id);
    if (!b) return 'Campus';
    return b.code.length <= 5 && /^[A-Z]+$/.test(b.code) ? `${b.code} Building` : b.name;
  };
  const catLabel = (id) => (store.category(id) ? store.category(id).label : 'Other');
  const catIcon = (id) => (store.category(id) ? store.category(id).icon : 'cat-others');
  const statusWord = (item) => (item.status === 'lost' ? 'Lost' : 'Found');
  const placeLine = (item) => `${item.spot ? `${item.spot}, ` : ''}${bShort(item.bldg)}`;

  /* ---------- small templates ---------- */
  function statusBadge(item, solid = false) {
    const kind = item.status === 'lost' ? 'lost' : 'found';
    const glyph = kind === 'lost' ? 'alert' : 'check';
    return `<span class="badge ${solid ? `badge-solid-${kind}` : `badge-${kind}`}">${icon(glyph)}${statusWord(item)}</span>`;
  }
  function stateBadge(item) {
    if (item.state === 'returned') return `<span class="badge badge-returned state-badge">${icon('checkCircle')}Returned</span>`;
    if (item.state === 'claim-requested') return `<span class="badge badge-claim state-badge">${icon('hand')}Claim pending</span>`;
    return '';
  }
  // Uploaded photo, or a category illustration (never a stock photo pretending to be the item)
  function itemArt(item, alt = '') {
    if (item.photo) return `<img src="${esc(item.photo)}" alt="${esc(alt || `Photo of ${item.title}`)}" loading="lazy">`;
    return `<div class="art${item.status === 'found' ? ' is-found' : ''}" role="img" aria-label="${esc(catLabel(item.cat))} illustration">${icon(catIcon(item.cat))}</div>`;
  }
  function thumb(item) {
    return `<span class="thumb${item.status === 'found' ? ' is-found' : ''}" aria-hidden="true">${item.photo ? `<img src="${esc(item.photo)}" alt="">` : icon(catIcon(item.cat))}</span>`;
  }

  function itemCard(item, { variant = 'full' } = {}) {
    const href = `item.html?id=${encodeURIComponent(item.id)}`;
    if (variant === 'latest') {
      return `<article class="item-card" data-id="${esc(item.id)}">
        <div class="item-media">${statusBadge(item, true)}${stateBadge(item)}${itemArt(item)}</div>
        <div class="item-body">
          <h3><a href="${href}">${esc(item.title)}</a></h3>
          <ul class="meta meta-inline list-reset">
            <li>${icon('calendar')}<span>${fmtDate(item.happenedAt)}</span></li>
            <li>${icon('clock')}<span>${fmtTime(item.happenedAt)}</span></li>
          </ul>
          <p class="loc-bar${item.status === 'found' ? ' is-found' : ''}">${icon('pin')}<span>${esc(placeLine(item))}</span></p>
        </div>
      </article>`;
    }
    return `<article class="item-card" data-id="${esc(item.id)}">
      <div class="item-media">${statusBadge(item, true)}${stateBadge(item)}${itemArt(item)}<span class="view-pill" aria-hidden="true">View Details</span></div>
      <div class="item-body">
        <p class="tag">${esc(catLabel(item.cat))}</p>
        <h3><a href="${href}">${esc(item.title)}</a></h3>
        <p class="item-desc">${esc(item.desc)}</p>
        <ul class="meta list-reset">
          <li>${icon('pin')}<span>${esc(placeLine(item))}</span></li>
          <li>${icon('calendar')}<span>${fmtDate(item.happenedAt)} · ${fmtTime(item.happenedAt)}</span></li>
        </ul>
      </div>
    </article>`;
  }

  function rowCard(item, { tag = 'button', active = false } = {}) {
    const inner = `${thumb(item)}<span>
        <span class="kind ${item.status === 'lost' ? 'is-lost' : 'is-found'}">${item.state === 'returned' ? 'Returned' : `${statusWord(item)} item`}</span>
        <strong>${esc(item.title)}</strong>
        <span class="sub">${esc(bShort(item.bldg))} · ${timeAgo(item.createdAt)}</span>
      </span>`;
    if (tag === 'a') return `<a class="row-card" href="item.html?id=${encodeURIComponent(item.id)}">${inner}</a>`;
    return `<button type="button" class="row-card${active ? ' is-active' : ''}" data-id="${esc(item.id)}" aria-pressed="${active}">${inner}</button>`;
  }

  function avatar(src, name, cls = 'avatar') {
    if (src) return `<img class="${cls}" src="${esc(src)}" alt="" loading="lazy">`;
    const ini = String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    return `<span class="${cls}" aria-hidden="true">${esc(ini)}</span>`;
  }

  /* ---------- official HAU images: local copy, then hau.edu.ph, then hide ---------- */
  function hauFallback(img) {
    if (img.dataset.remote && img.src.indexOf(img.dataset.remote) === -1) { img.src = img.dataset.remote; return; }
    const wrap = img.closest('[data-hau-wrap]');
    (wrap || img).hidden = true;
  }
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG' && e.target.dataset.remote) hauFallback(e.target); }, true);

  /* ---------- custom dropdown: always opens downward, scrolls when long ----------
     Keeps the native <select> (hidden) as the source of truth, so forms submit as normal.
     Keyboard: Enter/Space/Down open; Up/Down/Home/End move; Enter selects; Esc/Tab close; letters jump. */
  let cselectCount = 0;
  function enhanceSelect(sel) {
    if (!sel || sel.dataset.enhanced) return null;
    sel.dataset.enhanced = '1';
    const n = ++cselectCount;
    const label = document.querySelector(`label[for="${sel.id}"]`);
    const wrap = document.createElement('div');
    wrap.className = 'cselect';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.hidden = true; sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    if (label) sel.setAttribute('aria-label', label.textContent.trim());
    const btnId = `${sel.id}Btn`; const listId = `${sel.id}List`; const valId = `${sel.id}Val`;
    if (label) { label.id = label.id || `${sel.id}Label`; label.htmlFor = btnId; }
    wrap.insertAdjacentHTML('beforeend', `<button type="button" class="cselect-btn" id="${btnId}" aria-haspopup="listbox" aria-expanded="false" aria-controls="${listId}" aria-labelledby="${label ? label.id : ''} ${valId}"><span class="cselect-value" id="${valId}"></span>${icon('chevronDown')}</button>
      <ul class="cselect-list" id="${listId}" role="listbox" tabindex="-1" aria-labelledby="${label ? label.id : btnId}" hidden></ul>`);
    const btn = $('.cselect-btn', wrap); const list = $('.cselect-list', wrap); const val = $('.cselect-value', wrap);
    let active = 0;
    const opts = () => [...sel.options];
    function render() {
      list.innerHTML = opts().map((o, i) => `<li role="option" id="cs${n}-${i}" data-i="${i}" aria-selected="${o.selected}">${esc(o.text)}</li>`).join('');
      val.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
    }
    function setActive(i) {
      const items = $$('li', list);
      active = Math.max(0, Math.min(items.length - 1, i));
      items.forEach((li, k) => li.classList.toggle('is-active', k === active));
      list.setAttribute('aria-activedescendant', `cs${n}-${active}`);
      const li = items[active];
      if (li) { const top = li.offsetTop; const bottom = top + li.offsetHeight; if (top < list.scrollTop) list.scrollTop = top; else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight; }
    }
    function open() {
      render();
      list.hidden = false; wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      setActive(sel.selectedIndex);
      list.focus({ preventScroll: true });
      // Always below the field; bring the whole list into view if the page needs to scroll
      const r = list.getBoundingClientRect();
      if (r.bottom > window.innerHeight) window.scrollBy({ top: r.bottom - window.innerHeight + 16, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
    function close(focusBtn = true) {
      if (list.hidden) return;
      list.hidden = true; wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus({ preventScroll: true });
    }
    function choose(i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      render(); close();
    }
    btn.addEventListener('click', () => (list.hidden ? open() : close()));
    btn.addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); } });
    list.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) choose(Number(li.dataset.i)); });
    list.addEventListener('mousemove', (e) => { const li = e.target.closest('li[data-i]'); if (li && Number(li.dataset.i) !== active) setActive(Number(li.dataset.i)); });
    let typed = ''; let typedAt = 0;
    list.addEventListener('keydown', (e) => {
      const count = sel.options.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(count - 1); }
      else if (e.key === 'PageDown') { e.preventDefault(); setActive(active + 6); }
      else if (e.key === 'PageUp') { e.preventDefault(); setActive(active - 6); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { close(false); }
      else if (e.key.length === 1 && /\S/.test(e.key)) {
        const now = Date.now(); typed = now - typedAt > 700 ? e.key.toLowerCase() : typed + e.key.toLowerCase(); typedAt = now;
        const hit = opts().findIndex((o) => o.text.toLowerCase().startsWith(typed));
        if (hit >= 0) setActive(hit);
      }
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(false); });
    sel.addEventListener('change', render);
    render();
    return { refresh: render };
  }

  /* ---------- URL helpers ---------- */
  const params = () => new URLSearchParams(window.location.search);
  function setParams(obj) {
    const p = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null && !(Array.isArray(v) && !v.length)) p.set(k, Array.isArray(v) ? v.join(',') : v); });
    const qs = p.toString();
    history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }

  /* ---------- focus management ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trapFocus(container, e) {
    const els = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!els.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  let lockCount = 0;
  const lockScroll = (on) => { lockCount = Math.max(0, lockCount + (on ? 1 : -1)); document.documentElement.classList.toggle('is-locked', lockCount > 0); };

  /* ---------- overlay factory (drawer, sheet, modal share this) ---------- */
  function overlay({ panel, backdrop, onClose, initialFocus }) {
    let returnFocus = null;
    let open = false;
    function show() {
      if (open) return;
      open = true;
      returnFocus = document.activeElement;
      backdrop.hidden = false;
      panel.hidden = false;
      lockScroll(true);
      requestAnimationFrame(() => {
        backdrop.classList.add('is-open');
        panel.classList.add('is-open');
        const target = (initialFocus && initialFocus()) || $(FOCUSABLE, panel);
        if (target) target.focus({ preventScroll: true });
      });
    }
    function hide() {
      if (!open) return;
      open = false;
      backdrop.classList.remove('is-open');
      panel.classList.remove('is-open');
      lockScroll(false);
      setTimeout(() => { if (!open) { backdrop.hidden = true; if (panel !== backdrop) panel.hidden = true; } }, prefersReducedMotion() ? 0 : 300);
      if (onClose) onClose();
      if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    }
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) hide(); });
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); hide(); }
      if (e.key === 'Tab') trapFocus(panel, e);
    });
    return { show, hide, isOpen: () => open };
  }

  /* ---------- header: active link + mobile drawer ---------- */
  function initChrome() {
    const page = document.body.dataset.page === 'item' ? 'browse' : document.body.dataset.page;
    $$('[data-nav]').forEach((a) => { if (a.dataset.nav === page) a.setAttribute('aria-current', 'page'); });
    const btn = $('#menuBtn');
    const drawer = $('#drawer');
    const back = $('#drawerBackdrop');
    if (btn && drawer && back) {
      const ov = overlay({ panel: drawer, backdrop: back, onClose: () => btn.setAttribute('aria-expanded', 'false') });
      btn.addEventListener('click', () => { btn.setAttribute('aria-expanded', 'true'); ov.show(); });
      $$('[data-close-drawer]', drawer).forEach((el) => el.addEventListener('click', ov.hide));
      $$('a', drawer).forEach((a) => a.addEventListener('click', () => ov.hide()));
      window.addEventListener('resize', () => { if (window.innerWidth >= 1000 && ov.isOpen()) ov.hide(); });
    }
    const yr = $('#year');
    if (yr) yr.textContent = String(new Date().getFullYear());
    $$('img[data-remote]').forEach((img) => { if (img.complete && !img.naturalWidth) hauFallback(img); });
    ensureToastRegion(); // present before the first message so screen readers announce it
    // Just logged in: say so on the page you land on
    try {
      if (sessionStorage.getItem('hny_welcome')) {
        sessionStorage.removeItem('hny_welcome');
        const me = HNY.auth && HNY.auth.current();
        if (me) setTimeout(() => toast(`Welcome back, ${me.name.split(' ')[0]}! You’re logged in.`), 300);
      }
    } catch { /* ignore */ }
    renderAccount();
    if (HNY.auth) HNY.auth.subscribe(renderAccount);
    // One set of listeners for the account menu, however often it re-renders
    document.addEventListener('click', (e) => {
      const btn = $('#acctBtn'); const menu = $('#acctMenu');
      if (!btn || !menu) return;
      if (e.target.closest('#acctBtn')) {
        const open = menu.hidden;
        menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
        if (open) { const f = $('a', menu); if (f) f.focus(); }
      } else if (!menu.hidden && !e.target.closest('.acct')) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', (e) => {
      const btn = $('#acctBtn'); const menu = $('#acctMenu');
      if (!btn || !menu || menu.hidden || !e.target.closest('.acct')) return;
      const els = $$('a,button', menu); const i = els.indexOf(document.activeElement);
      if (e.key === 'Escape') { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length].focus(); }
    });
    document.addEventListener('focusout', (e) => {
      const menu = $('#acctMenu'); const btn = $('#acctBtn');
      if (!menu || menu.hidden || !e.target.closest('.acct')) return;
      if (!e.relatedTarget || !e.relatedTarget.closest('.acct')) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- account button (header) + drawer links ---------- */
  function renderAccount() {
    const slot = $('#accountSlot');
    const dslot = $('#drawerAccount');
    const me = HNY.auth && HNY.auth.current();
    const page = location.pathname.split('/').pop() || 'index.html';
    const onAuthPage = /^(login|signup|forgot)\.html/.test(page);
    const here = onAuthPage ? '' : encodeURIComponent(page + location.search);
    if (slot) {
      slot.innerHTML = me
        ? `<div class="acct">
            <button type="button" class="acct-btn" id="acctBtn" aria-expanded="false" aria-controls="acctMenu" aria-label="Account menu for ${esc(me.name)}">${avatar(me.avatar, me.name, 'acct-avatar')}</button>
            <div class="acct-menu" id="acctMenu" hidden>
              <p class="acct-who"><b>${esc(me.name)}</b><span>${esc(me.email)}</span></p>
              <a href="profile.html">${icon('user')}My Profile</a>
              <a href="profile.html#reported">${icon('box')}My Reported Items</a>
              <a href="profile.html#saved">${icon('heart')}Saved Items</a>
              <button type="button" data-logout>${icon('logout')}Log out</button>
            </div>
          </div>`
        : `<a class="acct-btn acct-login" href="login.html${here ? `?next=${here}` : ''}" aria-label="Log in">${icon('user')}<span>Log in</span></a>`;
    }
    if (dslot) {
      dslot.innerHTML = me
        ? `<a href="profile.html" class="drawer-acct">${avatar(me.avatar, me.name, 'acct-avatar')}<span><b>${esc(me.name)}</b><small>My Profile</small></span></a>
           <button type="button" class="btn btn-ghost btn-block" data-logout>${icon('logout')}Log out</button>`
        : `<a class="btn btn-outline btn-lg btn-block" href="login.html${here ? `?next=${here}` : ''}">${icon('user')}Log in</a>
           <a class="btn btn-ghost btn-block" href="signup.html">Create an account</a>`;
    }
    $$('[data-logout]').forEach((b) => { b.onclick = () => { HNY.auth.logOut(); toast('You’re logged out.'); if (document.body.dataset.auth === 'required') HNY.go('index.html'); }; });
  }

  /* Pages that need an account send people to log in first */
  function requireLogin() {
    const me = HNY.auth && HNY.auth.current();
    if (!me) { HNY.go(`login.html?next=${encodeURIComponent(location.pathname.split('/').pop() + location.search + location.hash)}&guard=1`, { replace: true }); return null; }
    return me;
  }

  /* ---------- modal ---------- */
  function modal({ title, body, labelledBy = 'modalTitle', onClose }) {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.hidden = true;
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="${labelledBy}">
      <button type="button" class="icon-btn modal-close" data-close aria-label="Close">${icon('close')}</button>
      <h2 id="${labelledBy}">${esc(title)}</h2>
      <div class="modal-body">${body}</div>
    </div>`;
    document.body.appendChild(back);
    const panel = $('.modal', back);
    const ov = overlay({ panel: back, backdrop: back, onClose: () => { if (onClose) onClose(); setTimeout(() => { back.remove(); document.dispatchEvent(new CustomEvent('hny:modal-closed')); }, 320); } });
    $$('[data-close]', back).forEach((el) => el.addEventListener('click', ov.hide));
    ov.show();
    return { root: panel, close: ov.hide, setBody(html) { $('.modal-body', panel).innerHTML = html; $$('[data-close]', panel).forEach((el) => el.addEventListener('click', ov.hide)); } };
  }

  /* ---------- bottom sheet (mobile) ---------- */
  function sheet(sheetEl, backdropEl, opts = {}) {
    const ov = overlay({ panel: sheetEl, backdrop: backdropEl, ...opts });
    $$('[data-close-sheet]', sheetEl).forEach((el) => el.addEventListener('click', ov.hide));
    window.addEventListener('resize', () => { if (window.innerWidth >= 900 && ov.isOpen()) ov.hide(); });
    return ov;
  }

  /* ---------- toast ---------- */
  function ensureToastRegion() {
    let region = $('#toastRegion');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toastRegion';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    return region;
  }
  function toast(text) {
    let region = ensureToastRegion();
    if (!region) {
      region = document.createElement('div');
      region.id = 'toastRegion';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon('checkCircle')}<span>${esc(text)}</span>`;
    region.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-shown'));
    setTimeout(() => { t.classList.remove('is-shown'); setTimeout(() => t.remove(), 300); }, 3200);
  }

  /* ---------- copy link (real clipboard, with a fallback) ---------- */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }

  /* ---------- photo: shrink before saving so localStorage doesn't fill up ---------- */
  function compressImage(file, max = 900, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('decode'));
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  HNY.ui = {
    $, $$, esc, timeAgo, fmtDate, fmtTime, bName, bShort, catLabel, catIcon, placeLine, statusWord,
    statusBadge, stateBadge, itemArt, itemCard, rowCard, thumb,
    avatar, requireLogin, renderAccount, hauFallback, enhanceSelect,
    params, setParams, trapFocus, overlay, initChrome, modal, sheet, toast, copyText, compressImage, prefersReducedMotion,
  };

  /* Header shadow once the page scrolls; sections fade up as they come into view */
  function initPolish() {
    const header = $('.site-header');
    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    const pages = ['home', 'how', 'about', 'stories', 'safety', 'legal', 'help'];
    if (!pages.includes(document.body.dataset.page) || !('IntersectionObserver' in window) || prefersReducedMotion()) return;
    const sections = $$('main section').slice(1); // the first section (hero) is already on screen
    const targets = [];
    sections.forEach((sec) => {
      const inner = sec.querySelector('.container') || sec;
      [...inner.children].forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--d', `${Math.min(i, 4) * 0.08}s`); targets.push(el); });
    });
    if (!targets.length) return;
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
    // Safety net: never leave content hidden (e.g. jumping straight to an anchor)
    setTimeout(() => targets.forEach((el) => el.classList.add('is-in')), 4000);
  }

  /* Page transitions: fade the page out before following an internal link */
  function initTransitions() {
    if (prefersReducedMotion() || ('onpagereveal' in window)) return; // native view transitions handle it
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / anchors
      e.preventDefault();
      document.documentElement.classList.add('is-leaving');
      setTimeout(() => { location.href = a.href; }, 200);
    });
    // Coming back with the Back button: undo the fade
    window.addEventListener('pageshow', () => document.documentElement.classList.remove('is-leaving'));
  }

  document.addEventListener('DOMContentLoaded', initChrome);
  document.addEventListener('DOMContentLoaded', initPolish);
  document.addEventListener('DOMContentLoaded', initTransitions);
}(window.HNY));
