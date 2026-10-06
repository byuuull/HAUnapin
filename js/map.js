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
  const center = (b) => ({ x: b.ax, y: b.ay });

  /* A building: soft shadow, roof outline, number badge and short name */
  function buildingSVG(b) {
    const tone = b.tone ? ` tone-${b.tone}` : '';
    const { x, y, w, h } = b.box;
    let extra = '';
    if (b.tone === 'cream') extra = `<rect class="roof-detail" x="${x + w * 0.18}" y="${y + h * 0.17}" width="${w * 0.64}" height="${h * 0.59}" rx="14"/>`;
    if (b.tone === 'sfj') extra = `<circle class="roof-ring" cx="${b.ax}" cy="${b.ay}" r="${Math.min(w, h) * 0.34}"/>`;
    if (b.tone === 'court') extra = `<path class="roof-line" d="M${x + 14} ${y + h * 0.42} H${x + w - 14}"/>`;
    if (b.tone === 'chapel') extra = `<path class="chapel-cross" d="M${x + 58} ${y + 34} v26 M${x + 49} ${y + 43} h18"/>`;
    const label = b.code.length > 6 ? b.code.split(' ')[0] : b.code;
    const small = Math.min(w, h) < 90;
    const br = small ? 21 : 26;
    return `<g class="bldg is-hot${tone}" data-bldg="${b.id}" tabindex="-1" role="button" aria-label="${esc(b.name)}">
      <path class="shadow" d="${b.path}" transform="translate(6 9)"/>
      <path class="roof" d="${b.path}"/>
      ${extra}
      <g class="bldg-badge" transform="translate(${b.ax} ${b.ay})"><circle r="${br}"/><text>${b.num}</text></g>
      <text class="bldg-label" x="${b.ax}" y="${b.ay + br + 20}">${esc(label)}</text>
    </g>`;
  }

  /* Grounds: paved campus, lawns, drive lanes, roundabout, covered walkways, fence, gates, trees */
  function scenery() {
    const C = CAMPUS;
    const lawns = C.lawns.map((d) => `<path class="map-lawn" d="${d}"/>`).join('');
    const roads = C.roads.map((d) => `<path class="map-drive-edge" d="${d}"/>`).join('')
      + C.roads.map((d) => `<path class="map-drive" d="${d}"/>`).join('')
      + C.roads.map((d) => `<path class="map-drive-line" d="${d}"/>`).join('');
    const r = C.roundabout;
    const roundabout = `<circle class="map-drive-edge-c" cx="${r.cx}" cy="${r.cy}" r="124"/>
      <circle class="map-asphalt" cx="${r.cx}" cy="${r.cy}" r="114"/>
      <circle class="map-drive-line" cx="${r.cx}" cy="${r.cy}" r="89"/>
      <circle class="map-plaza" cx="${r.cx}" cy="${r.cy}" r="66"/>
      <circle class="map-fountain" cx="${r.cx}" cy="${r.cy}" r="44"/>
      <circle class="map-fountain-jet" cx="${r.cx}" cy="${r.cy}" r="15"/>`;
    const canopies = C.canopies.map(([x, y, w, h]) => {
      const seams = w > 300 ? `<path class="canopy-seam" d="M${x + w / 3} ${y} V${y + h} M${x + (2 * w) / 3} ${y} V${y + h}"/>` : '';
      return `<rect class="map-canopy-shadow" x="${x + 5}" y="${y + 8}" width="${w}" height="${h}" rx="8"/><rect class="map-canopy" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/><path class="canopy-ridge" d="M${x + 8} ${y + h / 2} H${x + w - 8}"/>${seams}`;
    }).join('');
    const trees = C.trees.map(([x, y], i) => {
      const rr = 15 + (i % 3) * 4;
      return `<circle class="map-tree-shadow" cx="${x + 4}" cy="${y + 6}" r="${rr}"/><circle class="map-tree${i % 2 ? ' alt' : ''}" cx="${x}" cy="${y}" r="${rr}"/>`;
    }).join('');
    const fence = C.fences.map((d) => `<path class="map-fence" d="${d}"/>`).join('')
      + C.posts.map(([x, y]) => `<rect class="map-post" x="${x - 15}" y="${y - 15}" width="30" height="30" rx="5"/>`).join('');
    const gates = C.gates.map((g) => {
      if (g.dir === 'left') return `<text class="map-gate-label" transform="translate(${g.x} ${g.y}) rotate(-90)" text-anchor="middle">${esc(g.label)}</text>`;
      return `<text class="map-gate-label" x="${g.x}" y="${g.y}" text-anchor="middle">${esc(g.label)}</text>`;
    }).join('');
    const outlines = (C.outlines || []).map((d) => `<path class="bldg-outline-shadow" d="${d}" transform="translate(6 9)"/><path class="bldg-outline" d="${d}"/>`).join('');
    const marks = C.landmarks.map((l) => `<text class="landmark-label" x="${l.x}" y="${l.y}">${esc(l.label)}</text>`).join('');
    return `
      <rect class="map-ground" x="-2400" y="-1600" width="${W + 4800}" height="${H + 3200}"/>
      <path class="map-campus" d="${C.boundary}"/>
      ${lawns}
      ${roads}
      ${roundabout}
      ${canopies}
      ${trees}
      ${outlines}
      ${fence}
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
          <g class="layer-bldg">${BUILDINGS.map(buildingSVG).join('')}</g>
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
      const focus = opts.initialCentre || (phone ? { x: 820, y: 640 } : { x: (bbox.x0 + bbox.x1) / 2, y: (bbox.y0 + bbox.y1) / 2 });
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
        const x = b.box.x + b.box.w - 6;
        const y = b.box.y + 6;
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
        const { x: bx, y: by, w: bw, h: bh } = b.box;
        const dx = Math.max(bx - x, 0, x - (bx + bw));
        const dy = Math.max(by - y, 0, y - (by + bh));
        // inside the box: prefer the building whose label anchor is closest (L and U shapes overlap boxes)
        const d = dx || dy ? Math.hypot(dx, dy) : -1 / (1 + Math.hypot(x - b.ax, y - b.ay));
        if (!best || d < best.dist) best = { building: b, dist: d };
      });
      return best;
    }
    const insideCampus = (x, y) => {
      try { return campusPath.isPointInFill(new DOMPoint(x, y)); } catch { return x > 50 && x < W - 50 && y > 30 && y < H - 30; }
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
