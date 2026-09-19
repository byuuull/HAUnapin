/* Report wizard: 4 steps, validated, with a pick-a-spot campus map */
(function (HNY) {
  'use strict';

  const { store, ui, icon, CampusMap } = HNY;
  const { $, $$, esc } = ui;
  const DRAFT_KEY = 'hny_report_draft';
  const HAU_EMAIL = /^[^\s@]+@hau\.edu\.ph$/i;
  const MAX_FILE = 5 * 1024 * 1024;
  const STEPS = ['Select category', 'Item details', 'Location & time', 'Review & submit'];

  const data = { status: 'lost', cat: '', title: '', desc: '', photo: null, photoName: '', bldg: '', x: null, y: null, spot: '', notes: '', date: '', time: '', name: '', email: '', from: '' };
  let step = 1;
  let map = null;

  const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayISO = () => localISO(new Date());
  const minISO = () => { const d = new Date(); d.setDate(d.getDate() - 90); return localISO(d); };

  /* ---------- draft (survives a refresh in this tab) ---------- */
  function saveDraft() { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, step })); } catch { /* storage full or blocked */ } }
  function loadDraft() { try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY)); } catch { return null; } }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } }

  /* ---------- helpers ---------- */
  function setErr(id, msg) {
    const el = $(`#${id}Err`) || $(`#${id}`);
    if (el) el.textContent = msg;
    const field = $(`#${id}`);
    if (field && field.matches('input, textarea, select')) field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  const word = () => (data.status === 'lost' ? 'lose' : 'find');

  function syncWords() {
    $$('[data-word]').forEach((el) => { el.textContent = word(); });
    $$('[data-word-past]').forEach((el) => { el.textContent = data.status === 'lost' ? 'lost' : 'found'; });
    $$('[data-word-date]').forEach((el) => { el.textContent = data.status === 'lost' ? 'Date lost' : 'Date found'; });
    $('#fSpot').placeholder = data.status === 'lost' ? 'e.g. 2nd floor, near Room 204' : 'e.g. Left on the bench by the stairs';
  }

  /* ---------- step 1: categories ---------- */
  function buildCats() {
    $('#catGrid').innerHTML = store.categories().map((c) => `
      <label class="cat-option"><input type="radio" name="cat" value="${c.id}"${data.cat === c.id ? ' checked' : ''}>
        <span class="box"><span class="ico">${icon(c.icon)}</span><b>${esc(c.short || c.label)}</b></span></label>`).join('');
  }

  /* ---------- step 2: photo ---------- */
  function showPhoto() {
    const box = $('#photoPreview');
    if (!data.photo) { box.hidden = true; box.innerHTML = ''; $('#dropzone').hidden = false; return; }
    $('#dropzone').hidden = true;
    box.hidden = false;
    box.innerHTML = `<img src="${data.photo}" alt="Preview of the uploaded photo"><div><b>${esc(data.photoName || 'Photo added')}</b><small>Resized for faster loading</small></div>
      <button type="button" class="icon-btn" id="removePhoto" aria-label="Remove photo">${icon('trash')}</button>`;
    $('#removePhoto').addEventListener('click', () => { data.photo = null; data.photoName = ''; $('#fPhoto').value = ''; showPhoto(); saveDraft(); $('#fPhoto').focus(); });
  }
  async function takeFile(file) {
    setErr('photo', '');
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setErr('photo', 'Use a JPG, PNG or WebP image.'); return; }
    if (file.size > MAX_FILE) { setErr('photo', 'That photo is over 5 MB. Choose a smaller one.'); return; }
    try {
      data.photo = await ui.compressImage(file);
      data.photoName = file.name;
      showPhoto();
      saveDraft();
    } catch { setErr('photo', 'We couldn’t read that image. Try another photo.'); }
  }

  /* ---------- step 3: map + building combobox ---------- */
  function pinStatus() {
    const b = store.building(data.bldg);
    $('#pinStatus').innerHTML = data.x != null && b
      ? `${icon('pin')}<span>Pinned near <b>${esc(b.name)}</b></span>`
      : `${icon('pin')}<span>No spot pinned yet.</span>`;
  }
  function ensureMap() {
    if (map) return;
    map = CampusMap($('#pickMap'), {
      mode: 'pick', wheel: 'ctrl', legend: false, fullscreen: false,
      hint: 'Tap the map to drop a pin',
      label: 'Campus map. Tap or click to place the item location pin.',
      initialScale: data.x != null ? 2.2 : undefined,
      initialCentre: data.x != null ? { x: data.x, y: data.y - 20 } : undefined,
      onPick: ({ x, y, building }) => {
        data.x = x; data.y = y; data.bldg = building.id;
        $('#fBldgSearch').value = building.name;
        map.selectBuilding(building.id, { zoom: false });
        setErr('pin', '');
        pinStatus();
        saveDraft();
      },
      onPickOutside: () => setErr('pin', 'Drop the pin inside the campus boundary.'),
    });
    if (data.x != null) { map.setPick(data.x, data.y, { emit: false }); map.selectBuilding(data.bldg, { zoom: false }); }
    else if (data.bldg) chooseBuilding(data.bldg, false);
  }
  function chooseBuilding(id, focusPin = true) {
    const b = store.building(id);
    if (!b) return;
    const c = map.buildingCentre(id);
    $('#fBldgSearch').value = b.name;
    map.setPick(c.x, c.y);           // emits onPick, which fills in data + status
    map.centreOn(c.x, c.y - 20, 2.2);
    if (focusPin) { const pin = $('#pickMap .pick-pin'); if (pin) setTimeout(() => pin.focus({ preventScroll: true }), 480); }
  }
  function initCombo() {
    const input = $('#fBldgSearch');
    const listEl = $('#fBldgOptions');
    let opts = [];
    let idx = -1;
    const close = () => { listEl.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); idx = -1; };
    function update() {
      const q = input.value.trim().toLowerCase();
      opts = (q ? HNY.searchBuildings(q) : store.buildings().slice().sort((a, b) => a.name.localeCompare(b.name)).map((b) => ({ b, office: '' }))).slice(0, 10);
      listEl.innerHTML = opts.length
        ? opts.map((o, i) => `<li role="option" id="fopt-${o.b.id}" data-id="${o.b.id}" aria-selected="${i === idx}">${icon('building')}<span>${esc(o.b.name)}${o.office ? `<br><span class="muted" style="font-size:var(--fs-xs)">${esc(o.office)}</span>` : ''}</span></li>`).join('')
        : '<li role="option" aria-disabled="true">No matching building</li>';
      listEl.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    const choose = (id) => { close(); chooseBuilding(id); };
    input.addEventListener('focus', update);
    input.addEventListener('input', () => { idx = -1; update(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); if (listEl.hidden) update(); idx = Math.min(opts.length - 1, idx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); const o = opts[idx >= 0 ? idx : 0]; if (o && !listEl.hidden) choose(o.b.id); return; }
      else if (e.key === 'Escape') { close(); return; }
      else return;
      $$('li', listEl).forEach((li, i) => li.setAttribute('aria-selected', String(i === idx)));
      if (opts[idx]) input.setAttribute('aria-activedescendant', `fopt-${opts[idx].b.id}`);
    });
    listEl.addEventListener('mousedown', (e) => e.preventDefault());
    listEl.addEventListener('click', (e) => { const li = e.target.closest('li[data-id]'); if (li) choose(li.dataset.id); });
    input.addEventListener('blur', () => setTimeout(close, 120));
  }

  /* ---------- step 4: review ---------- */
  function renderReview() {
    const b = store.building(data.bldg);
    const cat = store.category(data.cat);
    const vp = (HNY.DATA.VIEWPOINTS || []).find((v) => v.bldg === data.bldg);
    const dateTxt = data.date ? ui.fmtDate(new Date(`${data.date}T00:00`).getTime()) : '—';
    const timeTxt = data.time ? ui.fmtTime(new Date(`${data.date}T${data.time}`).getTime()) : 'Not sure';
    $('#reviewBox').innerHTML = `
      <div class="card card-pad review-card">
        <div class="review-media">${data.photo ? `<img src="${data.photo}" alt="Your item photo">` : `<div class="art${data.status === 'found' ? ' is-found' : ''}" aria-hidden="true">${icon(cat ? cat.icon : 'box')}</div>`}</div>
        <div>
          <div class="cluster">${ui.statusBadge({ status: data.status })}<span class="pill-tag">${esc(cat ? cat.label : '')}</span></div>
          <h3 class="review-title">${esc(data.title)}</h3>
          <p class="muted" style="margin-top:var(--s-1);white-space:pre-line">${esc(data.desc)}</p>
        </div>
      </div>
      <div class="card card-pad review-grid">
        <div>
          <h3 class="review-h">${icon('pin')}Location details</h3>
          <div class="review-box"><b>${esc(b ? b.name : '—')}</b>${data.spot ? `<small>${esc(data.spot)}</small>` : ''}${data.notes ? `<small>${esc(data.notes)}</small>` : ''}</div>
          ${vp ? `<img class="review-place" src="${vp.photo}" alt="${esc(vp.title)}">` : ''}
        </div>
        <div>
          <h3 class="review-h">${icon('calendar')}Date &amp; time</h3>
          <dl class="review-list">
            <div><dt>${data.status === 'lost' ? 'Date lost' : 'Date found'}</dt><dd>${esc(dateTxt)}</dd></div>
            <div><dt>Approx. time</dt><dd>${esc(timeTxt)}</dd></div>
          </dl>
          <h3 class="review-h" style="margin-top:var(--s-3)">${icon('lock')}Contact privacy</h3>
          <p class="privacy-note">“Your contact details are only shared once ownership is verified by the Security Office.”</p>
        </div>
      </div>`;
  }

  /* ---------- validation per step ---------- */
  function validate(n) {
    if (n === 1) return setErr('cat', data.cat ? '' : 'Choose a category to continue.');
    if (n === 2) {
      return [
        setErr('fTitle', data.title.trim().length >= 3 ? '' : 'Give the item a short name (at least 3 characters).'),
        setErr('fDesc', data.desc.trim().length >= 15 ? '' : 'Describe the item in at least 15 characters.'),
      ].every(Boolean);
    }
    if (n === 3) {
      const t = todayISO();
      return [
        setErr('pin', data.x != null && data.bldg ? '' : 'Choose a building or tap the map to pin the spot.'),
        setErr('fDate', !data.date ? 'Choose the date.' : data.date > t ? 'The date can’t be in the future.' : data.date < minISO() ? 'Reports can only cover the last 90 days. Found items are kept for 90 days.' : ''),
        setErr('fTime', data.date && data.time && new Date(`${data.date}T${data.time}`).getTime() > Date.now() ? 'That time hasn’t happened yet today.' : ''),
      ].every(Boolean);
    }
    if (n === 4) {
      return [
        setErr('fName', data.name.trim().length >= 2 ? '' : 'Enter your name.'),
        setErr('fEmail', HAU_EMAIL.test(data.email.trim()) ? '' : 'Use your HAU email, ending in @hau.edu.ph.'),
        setErr('fConfirm', $('#fConfirm').checked ? '' : 'Tick the box to confirm the details.'),
      ].every(Boolean);
    }
    return true;
  }
  function focusFirstError() {
    const bad = $('.wiz-step:not([hidden]) [aria-invalid="true"]') || ($('#catErr').textContent && $('#catGrid input'))
      || ($('#pinErr').textContent && $('#fBldgSearch')) || ($('#fConfirmErr').textContent && $('#fConfirm'));
    if (bad) bad.focus();
  }

  /* ---------- step switching ---------- */
  function show(n, { focus = true } = {}) {
    step = n;
    $$('.wiz-step').forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    $('#stepLabel').innerHTML = `Step ${n} of 4: <span>${STEPS[n - 1]}</span>`;
    $('#stepPct').textContent = `${n * 25}% complete`;
    $('#stepBar').style.width = `${n * 25}%`;
    $('.bar').setAttribute('aria-valuenow', String(n));
    const back = $('#backBtn');
    back.querySelector('span').textContent = n === 1 ? 'Cancel' : 'Go back';
    $('#nextBtn').querySelector('span').textContent = n === 4 ? 'Submit final report' : `Next step: ${STEPS[n]}`;
    back.querySelector('span').textContent = n === 1 ? 'Cancel' : n === 4 ? 'Edit details' : 'Go back';
    if (n === 3) requestAnimationFrame(ensureMap);
    if (n === 4) renderReview();
    if (focus) {
      const h = $(`.wiz-step[data-step="${n}"] h1`);
      $('#reportForm').scrollIntoView({ block: 'start', behavior: ui.prefersReducedMotion() ? 'auto' : 'smooth' });
      if (h) h.focus({ preventScroll: true });
    }
    saveDraft();
  }

  function submit() {
    const date = data.date;
    const happenedAt = new Date(`${date}T${data.time || '12:00'}`).getTime();
    const item = store.add({
      title: data.title.trim(), cat: data.cat, status: data.status, bldg: data.bldg, x: data.x, y: data.y,
      spot: data.spot.trim(), desc: data.desc.trim(), happenedAt, noTime: !data.time, photo: data.photo,
      reporter: `${data.name.trim().split(/\s+/)[0]} ${(data.name.trim().split(/\s+/)[1] || '').charAt(0)}${data.name.trim().split(/\s+/)[1] ? '.' : ''}`.trim(),
      contactEmail: data.email.trim(),
      notes: data.notes.trim(),
      owner: HNY.auth && HNY.auth.current() ? HNY.auth.current().email : null,
      avatar: HNY.auth && HNY.auth.current() ? HNY.auth.current().avatar || null : null,
      relatedTo: data.from || null,
    });
    clearDraft();
    $('#reportForm').hidden = true;
    const ok = $('#successView');
    ok.hidden = false;
    $('#successMsg').textContent = data.status === 'found'
      ? 'Thank you, Angelite. Please turn the item in at the Security Office so the owner can collect it.'
      : 'Your report is listed and pinned on the campus map. Check back for found items in the same area.';
    $('#successRef').textContent = `Reference: ${item.ref}`;
    $('#successView1').href = `item.html?id=${encodeURIComponent(item.id)}`;
    $('#successMap').href = `map.html?item=${encodeURIComponent(item.id)}`;
    window.scrollTo({ top: 0 });
    $('#successTitle').focus();
  }

  /* ---------- wire up ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const p = ui.params();
    const draft = loadDraft();
    if (draft && !p.has('type') && !p.has('bldg') && !p.has('from')) { Object.assign(data, draft); }
    if (p.get('type') === 'found' || p.get('type') === 'lost') data.status = p.get('type');
    if (store.category(p.get('cat'))) data.cat = p.get('cat');
    if (store.building(p.get('bldg'))) data.bldg = p.get('bldg');
    if (p.get('from') && store.get(p.get('from'))) {
      const src = store.get(p.get('from'));
      data.from = src.id;
      if (!data.title) data.title = src.title;
      if (!data.desc) data.desc = `Possibly the item in report ${src.ref}. `;
    }
    if (!data.date) data.date = todayISO();

    // fill fields
    $$('input[name="status"]').forEach((r) => { r.checked = r.value === data.status; });
    buildCats();
    $('#fTitle').value = data.title;
    $('#fDesc').value = data.desc;
    $('#descCount').textContent = String(data.desc.length);
    $('#fSpot').value = data.spot;
    $('#fNotes').value = data.notes;
    $('#fDate').value = data.date;
    $('#fDate').max = todayISO();
    $('#fDate').min = minISO();
    $('#fTime').value = data.time;
    const me = HNY.auth && HNY.auth.current();
    if (me) {
      data.name = data.name || me.name;
      data.email = data.email || me.email;
      $('#signedInAs').innerHTML = `${ui.avatar(me.avatar, me.name, 'avatar avatar-sm')}<span>Reporting as <b>${esc(me.name)}</b>. It’ll appear in <a href="profile.html">My Profile</a>.</span>`;
      $('#signedInAs').hidden = false;
    } else {
      $('#signedInAs').innerHTML = `${icon('user')}<span><a href="login.html?next=report.html">Log in</a> to track this report in your profile. You can still report without an account.</span>`;
      $('#signedInAs').hidden = false;
    }
    $('#fName').value = data.name;
    $('#fEmail').value = data.email;
    if (data.bldg && store.building(data.bldg)) $('#fBldgSearch').value = store.building(data.bldg).name;
    syncWords();
    showPhoto();
    pinStatus();
    initCombo();

    const form = $('#reportForm');
    form.addEventListener('input', (e) => {
      const t = e.target;
      if (t.name === 'status') { data.status = t.value; syncWords(); }
      if (t.name === 'cat') { data.cat = t.value; setErr('cat', ''); }
      const map2 = { fTitle: 'title', fDesc: 'desc', fSpot: 'spot', fNotes: 'notes', fDate: 'date', fTime: 'time', fName: 'name', fEmail: 'email' };
      if (map2[t.id]) { data[map2[t.id]] = t.value; if (t.getAttribute('aria-invalid') === 'true') setErr(t.id, ''); }
      if (t.id === 'fDesc') $('#descCount').textContent = String(t.value.length);
      if (t.id === 'fConfirm') setErr('fConfirm', '');
      saveDraft();
    });
    form.addEventListener('change', (e) => { if (e.target.id === 'fPhoto') takeFile(e.target.files[0]); if (e.target.id === 'fConfirm') setErr('fConfirm', ''); });

    const dz = $('#dropzone');
    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-over'); }));
    dz.addEventListener('drop', (e) => takeFile(e.dataTransfer.files[0]));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(step)) { focusFirstError(); return; }
      if (step < 4) show(step + 1); else submit();
    });
    $('#backBtn').addEventListener('click', (e) => {
      if (step > 1) { e.preventDefault(); show(step - 1); }
      else clearDraft();
    });

    show(Math.min(Math.max(Number(draft && !p.has('type') ? draft.step : 1) || 1, 1), 4), { focus: false });
  });
}(window.HNY));
