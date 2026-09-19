/* Campus Map page: filters + list (left panel / mobile sheet) synced with the map */
(function (HNY) {
  'use strict';

  const { store, ui, icon, CampusMap } = HNY;
  const { $, $$, esc } = ui;

  const state = { status: 'all', cats: new Set(), bldg: '', activeId: null, view: 'map', vp: 0 };
  const VPS = HNY.DATA.VIEWPOINTS;
  let map;
  let all = [];

  const withPlace = (it) => ({ ...it, place: `${it.spot ? `${it.spot}, ` : ''}${ui.bShort(it.bldg)}` });

  function visibleItems() {
    return all.filter((it) => (state.status === 'all' || it.status === state.status)
      && (!state.cats.size || state.cats.has(it.cat)));
  }
  function listItems() {
    return visibleItems().filter((it) => !state.bldg || it.bldg === state.bldg);
  }

  /* ---------- panel ---------- */
  function renderChips() {
    const counts = store.countBy('cat', all.filter((it) => state.status === 'all' || it.status === state.status));
    $('#catChips').innerHTML = store.categories().filter((c) => counts[c.id] || state.cats.has(c.id)).map((c) => `
      <button type="button" class="chip" data-cat="${c.id}" aria-pressed="${state.cats.has(c.id)}">${esc(c.short || c.label)} <span class="count">${counts[c.id] || 0}</span></button>`).join('');
    $$('#statusChips [data-status]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === state.status)));
  }

  function renderList() {
    const list = listItems();
    const b = state.bldg && store.building(state.bldg);
    $('#bldgFilter').innerHTML = b ? `<div class="panel-filter-chip"><span>Items in ${esc(b.name)}</span>
      <button type="button" class="icon-btn" data-clear-bldg aria-label="Show items in every building">${icon('close')}</button></div>` : '';
    $('#listTitle').textContent = `${list.length} pinned item${list.length === 1 ? '' : 's'}`;
    $('#pinList').innerHTML = list.length
      ? list.map((it) => ui.rowCard(it, { active: it.id === state.activeId })).join('')
      : `<div class="empty" style="padding:var(--s-3)"><h3>Nothing pinned here</h3><p>Try another filter or building.</p></div>`;
    $('#openListLabel').textContent = `Items & filters ${list.length}`;
  }

  function renderMap() {
    const vis = visibleItems();
    map.setVisible(vis.map((i) => i.id));
    const counts = {};
    vis.forEach((i) => { counts[i.bldg] = (counts[i.bldg] || 0) + 1; });
    map.setCounts(counts);
  }

  function renderAll() { renderChips(); renderList(); renderMap(); if (state.view === 'street') renderStreet(); syncUrl(); }

  /* ---------- Street View: real campus photos with item hotspots ---------- */
  function setView(view, { focus = false } = {}) {
    state.view = view;
    $$('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    const street = $('#street');
    street.hidden = view !== 'street';
    $('#campusMap').hidden = view === 'street';
    $('#panelFootText').textContent = view === 'street'
      ? 'Street View shows real campus photos. Pins mark open reports in that building.'
      : 'Pins show where an item was reported. Building positions are schematic, so use the room notes for the exact spot.';
    map.hidePopup();
    if (view === 'street') {
      const at = VPS.findIndex((v) => v.bldg === state.bldg);
      if (at >= 0) state.vp = at;
      goViewpoint(state.vp, { focus });
    } else {
      syncUrl();
      if (focus) $('#campusMap .map-svg').focus();
    }
  }
  function goViewpoint(i, { focus = false } = {}) {
    state.vp = (i + VPS.length) % VPS.length;
    const vp = VPS[state.vp];
    state.bldg = vp.bldg;
    state.activeId = null;
    renderChips(); renderList(); renderMap(); renderStreet(); syncUrl();
    if (focus) $('#street').focus();
  }
  function renderStreet() {
    const vp = VPS[state.vp];
    const items = visibleItems().filter((it) => it.bldg === vp.bldg);
    const spots = vp.hotspots;
    $('#street').innerHTML = `
      <figure class="street-photo"><img src="${vp.photo}" alt="${esc(vp.title)}: ${esc(vp.sub)}"></figure>
      <p class="street-loc"><span class="dot" aria-hidden="true"></span>Current location: <b>${esc(vp.title)}</b></p>
      ${items.map((it, k) => { const [x, y] = spots[k % spots.length]; const off = Math.floor(k / spots.length) * 4; return `<button type="button" class="street-pin ${it.status === 'lost' ? 'is-lost' : 'is-found'}${it.id === state.activeId ? ' is-active' : ''}" style="left:${x + off}%;top:${y - off}%" data-street-item="${esc(it.id)}" aria-label="${esc(ui.statusWord(it))} item: ${esc(it.title)}">${icon('pin')}</button>`; }).join('')}
      ${items.length ? '' : `<p class="street-empty">${icon('info')}No open reports in ${esc(ui.bShort(vp.bldg))} with these filters.</p>`}
      <button type="button" class="street-nav prev" data-vp-step="-1" aria-label="Previous location">${icon('chevronLeft')}</button>
      <button type="button" class="street-nav next" data-vp-step="1" aria-label="Next location">${icon('chevronRight')}</button>
      <div class="street-bottom">
        <div class="street-chips" role="group" aria-label="Street View locations">${VPS.map((v, k) => `<button type="button" data-vp="${k}" aria-pressed="${k === state.vp}">${esc(v.title)}</button>`).join('')}</div>
      </div>
      <button type="button" class="street-mini" data-back-map aria-label="Back to the map at ${esc(ui.bShort(vp.bldg))}"><img src="images/campus/map-3d.jpg" alt=""><span>${esc(ui.bShort(vp.bldg))}</span></button>
      <p class="street-caption">${esc(vp.sub)}</p>
      <div class="street-popup" id="streetPopup" hidden></div>`;
  }
  function openStreetItem(id, btn) {
    const it = all.find((i) => i.id === id);
    if (!it) return;
    state.activeId = id;
    $$('.street-pin').forEach((p) => p.classList.toggle('is-active', p.dataset.streetItem === id));
    renderList();
    const pop = $('#streetPopup');
    pop.innerHTML = `<button type="button" class="icon-btn popup-close" data-close-street aria-label="Close">${icon('close')}</button>${itemPopupHTML(it)}`;
    pop.hidden = false;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', it.title);
    pop._return = btn;
    $('a', pop).focus({ preventScroll: true });
    syncUrl();
  }
  function closeStreetPopup() {
    const pop = $('#streetPopup');
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    state.activeId = null;
    renderList();
    if (pop._return && pop._return.isConnected) pop._return.focus();
  }

  function syncUrl() {
    ui.setParams({ status: state.status === 'all' ? '' : state.status, cat: [...state.cats], bldg: state.bldg, item: state.activeId || '', view: state.view === 'street' ? 'street' : '', vp: state.view === 'street' ? VPS[state.vp].id : '' });
  }

  /* ---------- selection sync ---------- */
  function itemPopupHTML(it) {
    return `${ui.statusBadge(it)}
      <div class="popup-row">
        ${ui.thumb(it)}
        <div><h3>${esc(it.title)}</h3>
          <p class="sub">${icon('pin')}${esc(ui.bShort(it.bldg))}</p>
          <p class="sub">Reported ${ui.timeAgo(it.createdAt)}</p></div>
      </div>
      <a class="btn btn-dark btn-block" href="item.html?id=${encodeURIComponent(it.id)}">View item details</a>`;
  }

  function selectItem(id, { fromList = false } = {}) {
    const it = all.find((i) => i.id === id);
    if (!it) return;
    state.activeId = id;
    renderList();
    syncUrl();
    const row = $(`#pinList [data-id="${CSS.escape(id)}"]`);
    if (row && !fromList) row.scrollIntoView({ block: 'nearest', behavior: ui.prefersReducedMotion() ? 'auto' : 'smooth' });
    if (fromList) {
      map.focusItem(id);
      setTimeout(() => openPopup(it, fromList), ui.prefersReducedMotion() ? 0 : 470);
    } else {
      map.setActive(id);
      openPopup(it);
    }
  }
  function openPopup(it, focusIt = false) {
    const el = map.showPopup(itemPopupHTML(it), it.x, it.y, { label: it.title });
    if (focusIt) { const link = $('a', el); if (link) link.focus({ preventScroll: true }); }
  }

  function selectBuilding(id, { fromSearch = false } = {}) {
    const b = store.building(id);
    if (!b) return;
    state.bldg = id;
    state.activeId = null;
    map.setActive(null);
    map.selectBuilding(id);
    renderAll();
    const items = listItems();
    const c = map.buildingCentre(id);
    const offices = b.offices.slice(0, 3).map((o) => `<li>${esc(o)}</li>`).join('');
    const html = `<h3 class="popup-bldg">${esc(b.name)}</h3>
      <p class="popup-sub">${items.length ? `${items.length} open report${items.length === 1 ? '' : 's'} here` : 'No open reports here'}</p>
      ${offices ? `<ul class="popup-sub" style="margin:var(--s-1) 0 0;padding-left:1.1em">${offices}</ul>` : ''}
      ${items.length ? `<div class="popup-list">${items.slice(0, 3).map((it) => ui.rowCard(it, { tag: 'a' })).join('')}</div>` : ''}
      <a class="btn btn-primary btn-block" href="report.html?bldg=${encodeURIComponent(id)}">${icon('plus')}Report an item here</a>`;
    setTimeout(() => {
      const el = map.showPopup(html, c.x, c.y, { label: b.name });
      if (fromSearch) { const f = $('a, button:not(.popup-close)', el); if (f) f.focus({ preventScroll: true }); }
    }, ui.prefersReducedMotion() ? 0 : 470);
  }

  function clearBuilding() {
    state.bldg = '';
    map.clearBuilding();
    map.hidePopup();
    renderAll();
  }

  /* ---------- building search (combobox) ---------- */
  function initSearch() {
    const input = $('#bldgSearch');
    const listEl = $('#bldgOptions');
    let opts = [];
    let idx = -1;
    const close = () => { listEl.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); idx = -1; };
    function update() {
      const q = input.value.trim().toLowerCase();
      if (!q) { close(); return; }
      const counts = store.countBy('bldg', visibleItems());
      opts = HNY.searchBuildings(q).slice(0, 8);
      listEl.innerHTML = opts.length
        ? opts.map((o, i) => `<li role="option" id="bopt-${o.b.id}" data-id="${o.b.id}" aria-selected="${i === idx}">${icon('building')}<span>${esc(o.b.name)}${o.office ? `<br><span class="muted" style="font-size:var(--fs-xs)">${esc(o.office)}</span>` : ''}</span><small aria-label="${counts[o.b.id] || 0} open reports">${counts[o.b.id] || 0}</small></li>`).join('')
        : '<li role="option" aria-disabled="true">No matching building</li>';
      listEl.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    function choose(id) { const b = store.building(id); if (!b) return; input.value = b.name; close(); closeSheetIfOpen(); selectBuilding(id, { fromSearch: true }); }
    input.addEventListener('input', () => { idx = -1; update(); });
    input.addEventListener('keydown', (e) => {
      if (listEl.hidden && e.key !== 'ArrowDown') return;
      if (e.key === 'ArrowDown') { e.preventDefault(); if (listEl.hidden) update(); idx = Math.min(opts.length - 1, idx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (opts[idx >= 0 ? idx : 0]) choose(opts[idx >= 0 ? idx : 0].b.id); return; }
      else if (e.key === 'Escape') { close(); return; }
      else return;
      $$('li', listEl).forEach((li, i) => li.setAttribute('aria-selected', String(i === idx)));
      if (opts[idx]) input.setAttribute('aria-activedescendant', `bopt-${opts[idx].b.id}`);
    });
    listEl.addEventListener('mousedown', (e) => e.preventDefault()); // keep focus in the input
    listEl.addEventListener('click', (e) => { const li = e.target.closest('li[data-id]'); if (li) choose(li.dataset.id); });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }

  /* ---------- mobile sheet ---------- */
  let sheetCtl = null;
  function closeSheetIfOpen() { if (sheetCtl && sheetCtl.isOpen()) sheetCtl.hide(); }

  document.addEventListener('DOMContentLoaded', () => {
    const p = ui.params();
    if (['lost', 'found'].includes(p.get('status'))) state.status = p.get('status');
    (p.get('cat') || '').split(',').filter((c) => store.category(c)).forEach((c) => state.cats.add(c));

    all = store.query({ statuses: ['lost', 'found'] }).map(withPlace);
    map = CampusMap($('#campusMap'), {
      mode: 'explore',
      hint: 'Drag to move · scroll or pinch to zoom',
      label: 'Interactive HAU campus map with lost and found pins',
      onPin: (id) => selectItem(id),
      onBuilding: (id) => selectBuilding(id),
      onBackground: () => { state.activeId = null; map.setActive(null); renderList(); syncUrl(); },
      onPopupClose: () => { state.activeId = null; map.setActive(null); renderList(); syncUrl(); },
    });
    map.setItems(all);
    renderAll();
    initSearch();

    // Official HAU campus map (local copy from get-hau-images, else hau.edu.ph)
    $('#panelContent').addEventListener('click', (e) => {
      if (!e.target.closest('#officialMap')) return;
      const img = HNY.DATA.HAU.images.campusMap;
      const m = ui.modal({ title: 'HAU official campus map', body: `<figure class="official-map" data-hau-wrap><img src="${img.local}" data-remote="${img.remote}" alt="Holy Angel University campus map, 2022, from hau.edu.ph"></figure>
        <p class="hint" style="margin-top:var(--s-2)">Source: <a href="https://www.hau.edu.ph/about/campus-map" target="_blank" rel="noopener">hau.edu.ph/about/campus-map</a>. If the map doesn’t show, you’re offline. Run get-hau-images to keep a copy.</p>` });
      m.root.classList.add('modal-wide');
    });

    // Display view (Map / Street)
    document.addEventListener('click', (e) => {
      const v = e.target.closest('[data-view]');
      if (v) { setView(v.dataset.view, { focus: true }); return; }
      if (e.target.closest('[data-back-map]')) { setView('map'); selectBuilding(state.bldg); return; }
      const st = e.target.closest('[data-vp-step]');
      if (st) { goViewpoint(state.vp + Number(st.dataset.vpStep)); $(`[data-vp-step="${st.dataset.vpStep}"]`).focus(); return; }
      const vb = e.target.closest('[data-vp]');
      if (vb) { goViewpoint(Number(vb.dataset.vp)); $(`[data-vp="${vb.dataset.vp}"]`).focus(); return; }
      const sp = e.target.closest('[data-street-item]');
      if (sp) { openStreetItem(sp.dataset.streetItem, sp); return; }
      if (e.target.closest('[data-close-street]')) closeStreetPopup();
    });
    $('#street').setAttribute('tabindex', '-1');
    $('#street').setAttribute('aria-label', 'Street View');
    $('#street').setAttribute('role', 'region');
    $('#street').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeStreetPopup(); return; }
      if (e.target.closest('input, textarea, .street-popup')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goViewpoint(state.vp - 1, { focus: true }); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goViewpoint(state.vp + 1, { focus: true }); }
    });

    // Panel interactions (delegated, so they keep working inside the mobile sheet)
    $('#panelContent').addEventListener('click', (e) => {
      const st = e.target.closest('[data-status]');
      if (st) { state.status = st.dataset.status; map.hidePopup(); renderAll(); return; }
      const cat = e.target.closest('[data-cat]');
      if (cat) { const c = cat.dataset.cat; if (state.cats.has(c)) state.cats.delete(c); else state.cats.add(c); map.hidePopup(); renderAll(); return; }
      if (e.target.closest('[data-clear-bldg]')) { clearBuilding(); $('#bldgSearch').value = ''; return; }
      const row = e.target.closest('.row-card[data-id]');
      if (row) {
        closeSheetIfOpen();
        if (state.view === 'street') {
          const b = $(`.street-pin[data-street-item="${CSS.escape(row.dataset.id)}"]`);
          if (b) { openStreetItem(row.dataset.id, b); return; }
          setView('map');
        }
        selectItem(row.dataset.id, { fromList: true });
      }
    });

    const panelHome = $('#panelHome');
    const content = $('#panelContent');
    const openBtn = $('#openList');
    sheetCtl = ui.sheet($('#listSheet'), $('#listSheetBackdrop'), {
      onClose: () => { panelHome.appendChild(content); openBtn.setAttribute('aria-expanded', 'false'); },
      initialFocus: () => $('#bldgSearch'),
    });
    openBtn.addEventListener('click', () => { $('#listSheetBody').appendChild(content); openBtn.setAttribute('aria-expanded', 'true'); sheetCtl.show(); });

    // Deep links: map.html?item=ID or ?bldg=ID
    const itemId = p.get('item');
    const bldg = p.get('bldg');
    if (p.get('view') === 'street') {
      const k = VPS.findIndex((v) => v.id === p.get('vp'));
      state.vp = k >= 0 ? k : 0;
      state.bldg = VPS[state.vp].bldg;
      setView('street');
    } else if (itemId && all.some((i) => i.id === itemId)) setTimeout(() => selectItem(itemId, { fromList: true }), 120);
    else if (store.building(bldg)) setTimeout(() => selectBuilding(bldg), 120);

    store.subscribe(() => { all = store.query({ statuses: ['lost', 'found'] }).map(withPlace); map.setItems(all); renderAll(); });
  });
}(window.HNY));
