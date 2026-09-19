/* ============================================================
   Campus map engine (vanilla SVG).
   - Draws the combined HAU campus from HNY.DATA
   - Pan / zoom / pinch with pointer events and transform math
   - Pins (lost / found), building hotspots, pick-a-spot mode
   - Never touches the store: pages pass items in and listen to events

   const map = HNY.CampusMap(shellEl, { mode: 'explore', onPin, onBuilding, onPick })
   ============================================================ */
window.HNY = window.HNY || {};

(function (HNY) {
  'use strict';

  const { icon } = HNY;
  const { BUILDINGS, CAMPUS } = HNY.DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const W = CAMPUS.width;
  const H = CAMPUS.height;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- static scenery (drawn once per map) ---------- */
  function center(b) {
    return b.shape === 'circle' ? { x: b.cx, y: b.cy } : { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }

  function buildingSVG(b) {
    const tone = b.tone ? ` tone-${b.tone}` : '';
    let shapes = '';
    if (b.shape === 'circle') {
      const { cx, cy, r, d } = b;
      shapes = `<rect class="front" x="${cx - r}" y="${cy}" width="${r * 2}" height="${d}"/>
        <ellipse class="front" cx="${cx}" cy="${cy + d}" rx="${r}" ry="${r * 0.55}"/>
        <ellipse class="roof" cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.55}"/>
        <ellipse class="side" cx="${cx}" cy="${cy}" rx="${r * 0.55}" ry="${r * 0.3}" opacity=".35"/>
        <path d="M${cx} ${cy - 26} v18 M${cx - 6} ${cy - 20} h12" stroke="#7A0C10" stroke-width="3" stroke-linecap="round"/>`;
    } else {
      const { x, y, w, h, d } = b;
      let wins = '';
      if (d >= 18) {
        const rows = Math.max(1, Math.floor((d - 6) / 9));
        const cols = Math.max(2, Math.floor((w - 8) / 14));
        const gap = (w - 8) / cols;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) wins += `<rect class="win" x="${(x + 6 + c * gap).toFixed(1)}" y="${y + h + 4 + r * 9}" width="${(gap - 5).toFixed(1)}" height="5" rx="1"/>`;
        }
      }
      shapes = `<rect class="front" x="${x}" y="${y + h}" width="${w}" height="${d}" rx="2"/>${wins}
        <rect class="roof" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`;
      if (b.courtyard) shapes += `<rect x="${x + w * 0.24}" y="${y + h * 0.25}" width="${w * 0.52}" height="${h * 0.5}" rx="3" fill="#BFE0EA" stroke="#9CC6D3"/>`;
      if (b.tone === 'blue') shapes += `<path d="M${x + 10} ${y + h / 2} H${x + w - 10}" stroke="#C9D7E3" stroke-width="2"/>`;
    }
    const c = center(b);
    const label = b.code.length > 6 ? b.code.split(' ')[0] : b.code;
    const ly = b.shape === 'circle' ? c.y + 10 : b.y + b.h - Math.min(12, b.h * 0.28);
    return `<g class="bldg is-hot${tone}" data-bldg="${b.id}" tabindex="-1" role="button" aria-label="${esc(b.name)}">
      ${shapes}
      <text class="bldg-label" x="${c.x}" y="${ly}">${esc(label)}</text>
    </g>`;
  }

  /* Grounds inside the perimeter fence only: lawns, drive lanes, walkways, plaza, trees, gates */
  function scenery() {
    const C = CAMPUS;
    const lawns = C.lawns.map((d) => `<path class="map-lawn" d="${d}"/>`).join('');
    const drives = C.drives.map((r) => `<path class="map-drive" d="${r.d}" stroke-width="${r.w}"/>`).join('')
      + C.drives.map((r) => `<path class="map-drive-line" d="${r.d}"/>`).join('');
    const walks = C.walks.map((w) => `<path class="map-walk" d="${w.d}" stroke-width="${w.w}"/>`).join('');
    const p = C.promenade;
    const promenade = `<path class="map-walk" stroke-width="10" d="M${p.cx - p.r} ${p.cy + 8} A${p.r} ${p.r} 0 1 1 ${p.cx + p.r} ${p.cy + 8}"/>`;
    const r = C.roundabout;
    const pool = C.pool;
    const trees = C.trees.map(([x, y], i) => `<circle class="map-tree" cx="${x}" cy="${y}" r="${5 + (i % 3) * 1.5}"/>`).join('');
    const gates = C.gates.map((g) => {
      const off = { down: [0, 20], up: [0, -12], left: [-8, 4], right: [8, 4] }[g.dir];
      const anchor = g.dir === 'left' ? 'end' : g.dir === 'right' ? 'start' : 'middle';
      const bar = g.dir === 'left' || g.dir === 'right' ? `M${g.x} ${g.y - 13} V${g.y + 13}` : `M${g.x - 15} ${g.y} H${g.x + 15}`;
      return `<g class="map-gate"><path d="${bar}"/><text x="${g.x + off[0]}" y="${g.y + off[1]}" text-anchor="${anchor}">${esc(g.label)}</text></g>`;
    }).join('');
    // Long landmark names wrap onto two lines so they stay inside their lawn
    const marks = C.landmarks.map((l) => {
      const words = l.label.split(' ');
      const lines = words.length > 2 ? [words.slice(0, 1).join(' '), words.slice(1).join(' ')] : [l.label];
      return `<text class="landmark-label" x="${l.x}" y="${l.y - (lines.length - 1) * 5}">${lines.map((t, i) => `<tspan x="${l.x}" dy="${i ? 11 : 0}">${esc(t)}</tspan>`).join('')}</text>`;
    }).join('');
    return `
      <rect class="map-ground" x="-2400" y="-1600" width="${W + 4800}" height="${H + 3200}"/>
      <path class="map-campus" d="${C.boundary}"/>
      ${lawns}
      ${drives}
      ${walks}
      ${promenade}
      <circle class="map-plaza" cx="${r.cx}" cy="${r.cy}" r="${r.r * 1.6}"/>
      <circle class="map-fountain" cx="${r.cx}" cy="${r.cy}" r="${r.r * 0.6}"/>
      <rect class="map-pool" x="${pool.x}" y="${pool.y}" width="${pool.w}" height="${pool.h}" rx="${pool.w / 2}"/>
      <circle class="map-fountain" cx="${pool.x + pool.w / 2}" cy="${pool.y + pool.h / 2}" r="6"/>
      <circle class="map-epiphany" cx="${C.landmarks[0].x}" cy="${C.landmarks[0].y - 18}" r="7"/>
      ${trees}
      <path class="map-fence" d="${C.boundary}"/>
      ${gates}
      ${marks}`;
  }

  const PIN_PATH = 'M0 0 C-4 -9 -14 -16 -14 -27 A14 14 0 1 1 14 -27 C14 -16 4 -9 0 0 Z';
  const GLYPH = {
    lost: '<path class="pin-glyph" d="M0 -34 V-26 M0 -20.5 V-20"/>',
    found: '<path class="pin-glyph" d="M-6 -27 L-1.5 -22.5 L6.5 -31"/>',
  };

  /* ---------- engine ---------- */
  function CampusMap(shell, options = {}) {
    const opts = {
      mode: 'explore',          // explore | pick | preview | detail
      wheel: 'always',          // always | ctrl | none
      controls: true,
      legend: true,
      hint: '',
      minScale: 1,
      maxScale: 5,
      label: 'Holy Angel University campus map',
      ...options,
    };
    const interactive = opts.mode !== 'preview';
    shell.classList.add('map-shell');
    shell.dataset.static = String(!interactive);

    shell.innerHTML = `
      <svg class="map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" ${interactive ? 'tabindex="0"' : ''}
        role="group" aria-roledescription="map" aria-label="${esc(opts.label)}${interactive ? '. Use arrow keys to move, plus and minus to zoom.' : ''}">
        <g class="vp">
          <g class="layer-scenery" aria-hidden="true">${scenery()}</g>
          <g class="layer-bldg">${[...BUILDINGS].sort((a, b) => (a.y ?? a.cy) - (b.y ?? b.cy)).map(buildingSVG).join('')}</g>
          <g class="layer-count" aria-hidden="true"></g>
          <g class="layer-pins"></g>
          <g class="layer-pick"></g>
        </g>
      </svg>
      ${opts.legend ? `<div class="map-legend" aria-hidden="true"><span><i class="lg-lost"></i>Lost</span><span><i class="lg-found"></i>Found</span>${opts.legendFence === false ? '' : '<span><i class="lg-fence"></i>Fence &amp; gates</span>'}</div>` : ''}
      ${opts.controls && interactive ? `<div class="map-controls">
        <button type="button" class="icon-btn" data-map="in" aria-label="Zoom in">${icon('plus')}</button>
        <button type="button" class="icon-btn" data-map="out" aria-label="Zoom out">${icon('minus')}</button>
        <button type="button" class="icon-btn" data-map="reset" aria-label="Re-centre map">${icon('target')}</button>
        ${document.fullscreenEnabled && opts.fullscreen !== false ? `<button type="button" class="icon-btn" data-map="full" aria-label="Full screen map" aria-pressed="false">${icon('expand')}</button>` : ''}
      </div>` : ''}
      ${opts.hint ? `<p class="map-hint" aria-hidden="true">${esc(opts.hint)}</p>` : ''}`;

    const svg = shell.querySelector('.map-svg');
    const vp = shell.querySelector('.vp');
    const pinLayer = shell.querySelector('.layer-pins');
    const pickLayer = shell.querySelector('.layer-pick');
    const countLayer = shell.querySelector('.layer-count');
    const campusPath = shell.querySelector('.map-campus');
    const hint = shell.querySelector('.map-hint');
    if (!interactive) shell.querySelectorAll('.bldg').forEach((g) => { g.removeAttribute('role'); g.classList.remove('is-hot'); });

    let view = { s: 1, tx: 0, ty: 0 };
    let home = { s: 1, tx: 0, ty: 0 };
    let items = [];
    let activeId = null;
    let selectedBldg = null;
    let pick = null;            // { x, y }
    let popup = null;           // { el, x, y }
    let anim = 0;

    /* -- geometry helpers -- */
    // visible window of the viewBox (accounts for letterboxing from "meet")
    function windowBox() {
      const r = svg.getBoundingClientRect();
      const m = Math.min(r.width / W, r.height / H) || 1;
      const vw = r.width / m;
      const vh = r.height / m;
      return { x0: (W - vw) / 2, y0: (H - vh) / 2, vw, vh, m, rect: r };
    }
    function toViewBox(clientX, clientY) {
      const pt = svg.createSVGPoint();
      pt.x = clientX; pt.y = clientY;
      const ctm = svg.getScreenCTM();
      return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
    }
    const toContent = (p) => ({ x: (p.x - view.tx) / view.s, y: (p.y - view.ty) / view.s });
    const toScreen = (x, y) => {
      const wb = windowBox();
      return { left: (x * view.s + view.tx - wb.x0) * wb.m, top: (y * view.s + view.ty - wb.y0) * wb.m };
    };

    function clampView(v) {
      const wb = windowBox();
      const s = clamp(v.s, opts.minScale, opts.maxScale);
      const slack = 40;
      const cw = W * s;
      const ch = H * s;
      const tx = cw >= wb.vw ? clamp(v.tx, wb.x0 + wb.vw - cw - slack, wb.x0 + slack) : wb.x0 + (wb.vw - cw) / 2;
      const ty = ch >= wb.vh ? clamp(v.ty, wb.y0 + wb.vh - ch - slack, wb.y0 + slack) : wb.y0 + (wb.vh - ch) / 2;
      return { s, tx, ty };
    }

    function apply() {
      vp.setAttribute('transform', `translate(${view.tx.toFixed(2)} ${view.ty.toFixed(2)}) scale(${view.s.toFixed(4)})`);
      // Pins and count badges keep the same on-screen size at every zoom level (about 38px tall)
      const m = windowBox().m;
      const k = clamp(38 / (41 * view.s * m), 0.3, 2.2);
      pinLayer.querySelectorAll('.pin').forEach((p) => p.setAttribute('transform', `translate(${p.dataset.x} ${p.dataset.y}) scale(${k.toFixed(3)})`));
      countLayer.querySelectorAll('.bldg-count').forEach((c) => c.setAttribute('transform', `translate(${c.dataset.x} ${c.dataset.y}) scale(${k.toFixed(3)})`));
      pickLayer.querySelectorAll('.pick-pin').forEach((p) => p.setAttribute('transform', `translate(${pick.x} ${pick.y}) scale(${k.toFixed(3)})`));
      placePopup();
    }

    function setView(v, animate = false) {
      const target = clampView(v);
      cancelAnimationFrame(anim);
      if (!animate || reduced()) { view = target; apply(); return; }
      const from = { ...view };
      const t0 = performance.now();
      const dur = 450;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = easeInOut(t);
        view = { s: from.s + (target.s - from.s) * e, tx: from.tx + (target.tx - from.tx) * e, ty: from.ty + (target.ty - from.ty) * e };
        apply();
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    // Centre a content point at a given scale
    function centreOn(x, y, s, animate = true) {
      const wb = windowBox();
      setView({ s, tx: wb.x0 + wb.vw / 2 - x * s, ty: wb.y0 + wb.vh / 2 - y * s }, animate);
    }
    function zoomAt(factor, px, py, animate = false) {
      const s1 = clamp(view.s * factor, opts.minScale, opts.maxScale);
      const k = s1 / view.s;
      setView({ s: s1, tx: px - (px - view.tx) * k, ty: py - (py - view.ty) * k }, animate);
    }
    function zoomCentre(factor) {
      const wb = windowBox();
      zoomAt(factor, wb.x0 + wb.vw / 2, wb.y0 + wb.vh / 2, true);
    }

    // Starting view: fill tall/narrow screens instead of leaving empty bands
    function computeHome() {
      const wb = windowBox();
      // Fit the campus outline on wide screens; on narrow phones zoom in so buildings stay readable
      const bbox = CAMPUS.bbox;
      const fit = Math.min(wb.vw / (bbox.x1 - bbox.x0), wb.vh / (bbox.y1 - bbox.y0));
      const phone = wb.rect.width < 600 && !opts.fit;
      const auto = phone ? Math.min(Math.max(wb.vw / W, wb.vh / H) * 0.98, 2.4) : fit;
      const s = clamp(opts.initialScale || auto, opts.minScale, opts.maxScale);
      const focus = opts.initialCentre || (phone ? { x: 560, y: 300 } : { x: (bbox.x0 + bbox.x1) / 2, y: (bbox.y0 + bbox.y1) / 2 });
      home = clampView({ s, tx: wb.x0 + wb.vw / 2 - focus.x * s, ty: wb.y0 + wb.vh / 2 - focus.y * s });
    }

    /* -- pins -- */
    function pinSVG(it) {
      const kind = it.status === 'lost' ? 'lost' : 'found';
      const focusable = interactive ? 'tabindex="0" role="button"' : 'aria-hidden="true"';
      const label = `${kind === 'lost' ? 'Lost' : 'Found'}: ${it.title}${it.place ? `, ${it.place}` : ''}`;
      return `<g class="pin is-${kind}${it.state === 'returned' ? ' is-returned' : ''}${it.id === activeId ? ' is-active' : ''}" data-id="${esc(it.id)}"
        data-x="${it.x}" data-y="${it.y}" ${focusable} aria-label="${esc(label)}">
        <circle class="pin-ring" cx="0" cy="-27" r="18" fill="transparent"/>
        <path class="pin-body" d="${PIN_PATH}"/>${GLYPH[kind]}
      </g>`;
    }
    function setItems(list) {
      items = list.slice();
      // Draw south-most last so nearer pins overlap farther ones naturally
      pinLayer.innerHTML = items.slice().sort((a, b) => a.y - b.y).map(pinSVG).join('');
      apply();
    }
    function setVisible(ids, mode = 'hide') {
      const set = ids instanceof Set ? ids : new Set(ids);
      pinLayer.querySelectorAll('.pin').forEach((p) => {
        const on = set.has(p.dataset.id);
        p.classList.toggle(mode === 'dim' ? 'is-dim' : 'is-hidden', !on);
        if (interactive) p.setAttribute('tabindex', on ? '0' : '-1');
      });
    }
    function setActive(id) {
      activeId = id;
      pinLayer.querySelectorAll('.pin').forEach((p) => p.classList.toggle('is-active', p.dataset.id === id));
      // bring the active pin to the front
      const el = id && pinLayer.querySelector(`.pin[data-id="${CSS.escape(id)}"]`);
      if (el) pinLayer.appendChild(el);
    }
    function focusItem(id, s = 2.4) {
      const it = items.find((i) => i.id === id);
      if (!it) return;
      setActive(id);
      centreOn(it.x, it.y - 20, Math.max(view.s, s));
    }

    /* -- buildings -- */
    function setCounts(counts) {
      countLayer.innerHTML = BUILDINGS.filter((b) => counts[b.id]).map((b) => {
        const x = b.shape === 'circle' ? b.cx + b.r * 0.75 : b.x + b.w - 4;
        const y = b.shape === 'circle' ? b.cy - b.r * 0.45 : b.y + 4;
        return `<g class="bldg-count" data-x="${x}" data-y="${y}"><circle r="10"/><text>${counts[b.id]}</text></g>`;
      }).join('');
      apply();
    }
    function selectBuilding(id, { zoom = true } = {}) {
      selectedBldg = id;
      shell.querySelectorAll('.bldg').forEach((g) => g.classList.toggle('is-selected', g.dataset.bldg === id));
      const b = BUILDINGS.find((x) => x.id === id);
      if (b && zoom) {
        const c = center(b);
        centreOn(c.x, c.y, Math.max(view.s, 2.2));
      }
    }
    function nearestBuilding(x, y) {
      let best = null;
      BUILDINGS.forEach((b) => {
        let d;
        if (b.shape === 'circle') d = Math.max(0, Math.hypot(x - b.cx, y - b.cy) - b.r);
        else {
          const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
          const dy = Math.max(b.y - y, 0, y - (b.y + b.h + b.d));
          d = Math.hypot(dx, dy);
        }
        if (!best || d < best.dist) best = { building: b, dist: d };
      });
      return best;
    }
    const insideCampus = (x, y) => {
      try { return campusPath.isPointInFill(new DOMPoint(x, y)); } catch { return x > 60 && x < 1150 && y > 140 && y < 662; }
    };

    /* -- pick mode -- */
    function setPick(x, y, { emit = true, centre = false } = {}) {
      pick = { x: Math.round(clamp(x, 0, W)), y: Math.round(clamp(y, 0, H)) };
      pickLayer.innerHTML = `<g class="pick-pin" tabindex="0" role="slider" aria-label="Item location pin. Use arrow keys to move it."
        aria-valuetext="${esc(nearestBuilding(pick.x, pick.y).building.name)}">
        <circle class="pick-pulse" cx="0" cy="0" r="16"/>
        <path class="pin-body" d="${PIN_PATH}"/><path class="pin-glyph" d="M0 -33 V-21 M-6 -27 H6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      </g>`;
      apply();
      if (centre) centreOn(pick.x, pick.y - 20, Math.max(view.s, 2));
      if (emit && opts.onPick) {
        const near = nearestBuilding(pick.x, pick.y);
        opts.onPick({ ...pick, building: near.building, inside: insideCampus(pick.x, pick.y) });
      }
    }
    function clearPick() { pick = null; pickLayer.innerHTML = ''; }

    /* -- popup (HTML card anchored to a map point) -- */
    function showPopup(html, x, y, { label = 'Details' } = {}) {
      hidePopup();
      const el = document.createElement('div');
      el.className = 'map-popup';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', label);
      el.innerHTML = `<button type="button" class="icon-btn popup-close" aria-label="Close">${icon('close')}</button>${html}`;
      shell.appendChild(el);
      popup = { el, x, y };
      el.querySelector('.popup-close').addEventListener('click', () => { hidePopup(); if (opts.onPopupClose) opts.onPopupClose(); svg.focus({ preventScroll: true }); });
      el.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); hidePopup(); if (opts.onPopupClose) opts.onPopupClose(); svg.focus({ preventScroll: true }); } });
      placePopup();
      return el;
    }
    function placePopup() {
      if (!popup) return;
      const { el, x, y } = popup;
      const p = toScreen(x, y);
      const sw = shell.clientWidth;
      const sh = shell.clientHeight;
      const pw = el.offsetWidth;
      const ph = el.offsetHeight;
      const pad = 12;
      let left = p.left - pw / 2;
      let top = p.top - ph - 46;                 // above the pin head
      if (top < pad) top = p.top + 14;            // not enough room: open below
      left = clamp(left, pad, Math.max(pad, sw - pw - pad));
      top = clamp(top, pad, Math.max(pad, sh - ph - pad));
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }
    function hidePopup() { if (popup) { popup.el.remove(); popup = null; } }

    /* -- pointer input: pan, pinch, click, drag pick pin -- */
    const pointers = new Map();
    let gesture = null;
    function hintGone() { if (hint) hint.classList.add('is-gone'); }

    if (interactive) {
      svg.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        cancelAnimationFrame(anim);
        svg.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const onPick = e.target.closest('.pick-pin');
        if (pointers.size === 1) {
          gesture = { type: onPick ? 'pick' : 'pan', startX: e.clientX, startY: e.clientY, moved: false, target: e.target, view: { ...view } };
        } else if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          gesture = { type: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), s: view.s, moved: true };
        }
      });
      svg.addEventListener('pointermove', (e) => {
        if (!pointers.has(e.pointerId) || !gesture) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (gesture.type === 'pinch' && pointers.size >= 2) {
          const [a, b] = [...pointers.values()];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const mid = toViewBox((a.x + b.x) / 2, (a.y + b.y) / 2);
          zoomAt((gesture.s * (dist / gesture.dist)) / view.s, mid.x, mid.y);
          hintGone();
          return;
        }
        const dx = e.clientX - gesture.startX;
        const dy = e.clientY - gesture.startY;
        if (!gesture.moved && Math.hypot(dx, dy) > 6) { gesture.moved = true; shell.classList.add('is-dragging'); hintGone(); }
        if (!gesture.moved) return;
        if (gesture.type === 'pick') {
          const c = toContent(toViewBox(e.clientX, e.clientY));
          setPick(c.x, c.y + 14, { emit: false });
        } else {
          const m = windowBox().m;
          setView({ s: gesture.view.s, tx: gesture.view.tx + dx / m, ty: gesture.view.ty + dy / m });
        }
      });
      const end = (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.delete(e.pointerId);
        shell.classList.remove('is-dragging');
        const g = gesture;
        if (pointers.size === 0) gesture = null;
        if (!g || e.type === 'pointercancel') return;
        if (g.type === 'pick' && g.moved && pick) { setPick(pick.x, pick.y); return; }
        if (g.moved || g.type === 'pinch') return;
        handleTap(g.target, e.clientX, e.clientY);
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);

      svg.addEventListener('wheel', (e) => {
        if (opts.wheel === 'none') return;
        if (opts.wheel === 'ctrl' && !(e.ctrlKey || e.metaKey)) {
          if (hint) { hint.textContent = 'Hold Ctrl and scroll to zoom the map'; hint.classList.remove('is-gone'); clearTimeout(hint._t); hint._t = setTimeout(hintGone, 1400); }
          return;
        }
        e.preventDefault();
        const p = toViewBox(e.clientX, e.clientY);
        zoomAt(Math.exp(-e.deltaY * 0.0022), p.x, p.y);
        hintGone();
      }, { passive: false });

      // Keyboard: arrows pan (or move the pick pin), +/- zoom, 0 re-centre, Enter opens a pin
      svg.addEventListener('keydown', (e) => {
        const pinEl = e.target.closest('.pin');
        const bEl = e.target.closest('.bldg');
        const pickEl = e.target.closest('.pick-pin');
        if ((e.key === 'Enter' || e.key === ' ') && (pinEl || bEl)) { e.preventDefault(); handleTap(e.target, null, null, true); return; }
        const step = e.shiftKey ? 120 : 50;
        const moves = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
        if (moves[e.key]) {
          e.preventDefault();
          if (pickEl && pick) {
            const [mx, my] = moves[e.key];
            setPick(pick.x - mx * (e.shiftKey ? 24 : 8), pick.y - my * (e.shiftKey ? 24 : 8));
            pickLayer.querySelector('.pick-pin').focus({ preventScroll: true });
            return;
          }
          const [mx, my] = moves[e.key];
          setView({ ...view, tx: view.tx + mx * step, ty: view.ty + my * step }, true);
          hintGone();
        } else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomCentre(1.4); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomCentre(1 / 1.4); }
        else if (e.key === '0') { e.preventDefault(); reset(); }
        else if (e.key === 'Escape') { hidePopup(); }
      });

      shell.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-map]');
        if (!btn) return;
        const act = btn.dataset.map;
        if (act === 'in') zoomCentre(1.4);
        if (act === 'out') zoomCentre(1 / 1.4);
        if (act === 'reset') reset();
        if (act === 'full') toggleFullscreen(btn);
        hintGone();
      });
    }

    function handleTap(target, clientX, clientY, viaKeyboard = false) {
      const pinEl = target.closest && target.closest('.pin');
      if (pinEl && opts.onPin) { opts.onPin(pinEl.dataset.id, { viaKeyboard }); return; }
      if (opts.mode === 'pick') {
        if (clientX == null) return;
        const c = toContent(toViewBox(clientX, clientY));
        if (!insideCampus(c.x, c.y)) { if (opts.onPickOutside) opts.onPickOutside(); return; }
        setPick(c.x, c.y);
        hintGone();
        return;
      }
      const bEl = target.closest && target.closest('.bldg');
      if (bEl && opts.onBuilding) { opts.onBuilding(bEl.dataset.bldg, { viaKeyboard }); return; }
      hidePopup();
      if (opts.onBackground) opts.onBackground();
    }

    function toggleFullscreen(btn) {
      if (document.fullscreenElement === shell) document.exitFullscreen();
      else if (shell.requestFullscreen) shell.requestFullscreen().catch(() => {});
      const sync = () => { btn.setAttribute('aria-pressed', String(document.fullscreenElement === shell)); requestAnimationFrame(() => setView(view)); };
      document.addEventListener('fullscreenchange', sync, { once: true });
    }

    function reset() { hidePopup(); setView(home, true); }

    // Keep things in place when the container resizes (rotate, sidebar, fullscreen)
    let firstFit = true;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (hint && coarse) hint.textContent = opts.mode === 'pick' ? 'Tap the map to drop a pin' : 'Drag to move \u00B7 pinch to zoom';
    const ro = new ResizeObserver(() => {
      if (!svg.getBoundingClientRect().width) return;
      shell.classList.toggle('is-compact', shell.clientHeight < 300);
      computeHome();
      if (firstFit) { view = { ...home }; apply(); firstFit = false; }
      else setView(view);
    });
    ro.observe(shell);

    return {
      el: shell,
      svg,
      destroy() { ro.disconnect(); cancelAnimationFrame(anim); },
      setItems,
      setVisible,
      setActive,
      setCounts,
      focusItem,
      selectBuilding,
      clearBuilding() { selectedBldg = null; shell.querySelectorAll('.bldg.is-selected').forEach((g) => g.classList.remove('is-selected')); },
      centreOnBuilding(id, s = 2.4) { const b = BUILDINGS.find((x) => x.id === id); if (b) { const c = center(b); centreOn(c.x, c.y, s); } },
      centreOn,
      setPick,
      clearPick,
      getPick: () => pick,
      nearestBuilding,
      insideCampus,
      showPopup,
      hidePopup,
      reset,
      get selectedBuilding() { return selectedBldg; },
      buildingCentre: (id) => { const b = BUILDINGS.find((x) => x.id === id); return b ? center(b) : null; },
    };
  }

  HNY.CampusMap = CampusMap;
}(window.HNY));
