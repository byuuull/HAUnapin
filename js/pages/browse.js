/* Browse page: filters <-> state <-> URL, results grid with "load more" */
(function (HNY) {
  'use strict';

  const { store, ui, icon } = HNY;
  const { $, $$, esc } = ui;
  const PAGE = 6;

  const state = {
    q: '', statuses: ['lost', 'found'], cats: [], bldg: '', range: 'all', sort: 'newest', showReturned: false,
    shown: PAGE,
  };

  /* ---------- URL in / out ---------- */
  function readUrl() {
    const p = ui.params();
    state.q = p.get('q') || '';
    const st = p.get('status');
    state.statuses = st === 'lost' || st === 'found' ? [st] : ['lost', 'found'];
    state.cats = (p.get('cat') || '').split(',').filter((c) => store.category(c));
    state.bldg = store.building(p.get('bldg')) ? p.get('bldg') : '';
    state.range = ['24h', '7d'].includes(p.get('range')) ? p.get('range') : 'all';
    state.sort = p.get('sort') === 'oldest' ? 'oldest' : 'newest';
    state.showReturned = p.get('returned') === '1';
  }
  function writeUrl() {
    ui.setParams({
      q: state.q,
      status: state.statuses.length === 1 ? state.statuses[0] : '',
      cat: state.cats,
      bldg: state.bldg,
      range: state.range === 'all' ? '' : state.range,
      sort: state.sort === 'newest' ? '' : state.sort,
      returned: state.showReturned ? '1' : '',
    });
  }

  /* ---------- build filter controls ---------- */
  function buildControls() {
    const counts = store.countBy('cat');
    $('#catChecks').innerHTML = store.categories().map((c) => `
      <label class="check"><input type="checkbox" name="cat" value="${c.id}"> <span style="flex:1">${esc(c.label)}</span><span class="muted cat-count" data-count="${c.id}">${counts[c.id] || 0}</span></label>`).join('');
    const bl = store.buildings().slice().sort((a, b) => a.name.localeCompare(b.name));
    $('#fBldg').insertAdjacentHTML('beforeend', bl.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join(''));
  }

  // Category counts follow the other active filters, so the numbers match what you'd get
  function updateCounts() {
    const base = store.query({ q: state.q, statuses: state.statuses, bldg: state.bldg, range: state.range, showReturned: state.showReturned });
    const counts = store.countBy('cat', base);
    $$('[data-count]').forEach((el) => { el.textContent = String(counts[el.dataset.count] || 0); });
  }

  function syncControls() {
    const form = $('#filterForm');
    $$('input[name="status"]', form).forEach((i) => { i.checked = state.statuses.includes(i.value); });
    $$('input[name="cat"]', form).forEach((i) => { i.checked = state.cats.includes(i.value); });
    $('input[name="returned"]', form).checked = state.showReturned;
    $('#fBldg').value = state.bldg;
    $$('input[name="range"]', form).forEach((i) => { i.checked = i.value === state.range; });
    $('#sortSelect').value = state.sort;
    $('#searchInput').value = state.q;
    const quick = state.statuses.length === 2 ? 'all' : state.statuses[0];
    $$('#quickStatus [data-quick]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.quick === quick)));
    const active = (state.statuses.length < 2 ? 1 : 0) + state.cats.length + (state.bldg ? 1 : 0) + (state.range !== 'all' ? 1 : 0) + (state.showReturned ? 1 : 0);
    const badge = $('#activeCount');
    badge.hidden = !active;
    badge.textContent = `${active} active`;
    $('#openFilters').innerHTML = `${icon('filter')}Filters${active ? ` (${active})` : ''}`;
  }

  function readForm() {
    const form = $('#filterForm');
    const sts = $$('input[name="status"]:checked', form).map((i) => i.value);
    state.statuses = sts.length ? sts : ['lost', 'found'];
    state.cats = $$('input[name="cat"]:checked', form).map((i) => i.value);
    state.showReturned = $('input[name="returned"]', form).checked;
    state.bldg = $('#fBldg').value;
    state.range = ($('input[name="range"]:checked', form) || {}).value || 'all';
  }

  /* ---------- render ---------- */
  function render() {
    updateCounts();
    const results = store.query(state);
    const total = results.length;
    const shown = Math.min(state.shown, total);
    const label = state.q ? ` for “${esc(state.q)}”` : '';
    $('#resultCount').innerHTML = `Showing <b>${shown}</b> of <b>${total}</b> item${total === 1 ? '' : 's'}${label}`;
    if (!total) {
      $('#resultsGrid').innerHTML = `<div class="empty" style="grid-column:1/-1">${icon('search')}
        <h3>No items match these filters</h3>
        <p>Try removing a filter or searching a different word. If you lost something, report it so finders can reach you.</p>
        <div class="cluster" style="justify-content:center"><button type="button" class="btn btn-outline" data-clear>Clear all filters</button>
        <a class="btn btn-primary" href="report.html?type=lost">Report a lost item</a></div></div>`;
    } else {
      $('#resultsGrid').innerHTML = results.slice(0, shown).map((it) => ui.itemCard(it)).join('');
    }
    const more = $('#loadMore');
    more.hidden = total <= PAGE;
    $('#loadInfo').textContent = `Showing ${shown} of ${total} items`;
    $('#loadBar').style.width = `${total ? (shown / total) * 100 : 0}%`;
    $('#loadMoreBtn').hidden = shown >= total;
    syncControls();
    writeUrl();
  }

  function snapshot() {
    const st = store.stats();
    $('#snapOpen').textContent = String(st.open);
    $('#snapFound').textContent = String(st.found);
    $('#snapLost').textContent = String(st.lost);
    const week = store.query({ range: '7d' });
    const fresh = $('#snapFresh');
    if (fresh) fresh.textContent = week.length ? `${week.length} report${week.length === 1 ? '' : 's'} since ${ui.fmtDate(Date.now() - 7 * 864e5)}` : 'No new reports this week';
    $('#snapAreas').textContent = st.topAreas.map((b) => b.name.replace(/ Building.*$| \(.*\)$/, '')).join(', ') || '—';
  }

  function clearAll() {
    Object.assign(state, { q: '', statuses: ['lost', 'found'], cats: [], bldg: '', range: 'all', showReturned: false, shown: PAGE });
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    readUrl();
    buildControls();
    snapshot();
    render();

    const form = $('#filterForm');
    form.addEventListener('change', () => { readForm(); state.shown = PAGE; render(); });
    form.addEventListener('submit', (e) => e.preventDefault());
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear]')) { clearAll(); const s = $('#searchInput'); if (s && !sheetCtl.isOpen()) s.focus(); }
    });
    $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); state.q = $('#searchInput').value.trim(); state.shown = PAGE; render(); });
    $('#searchInput').addEventListener('search', () => { if (!$('#searchInput').value) { state.q = ''; render(); } });
    $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
    $('#quickStatus').addEventListener('click', (e) => {
      const b = e.target.closest('[data-quick]');
      if (!b) return;
      state.statuses = b.dataset.quick === 'all' ? ['lost', 'found'] : [b.dataset.quick];
      state.shown = PAGE;
      render();
    });
    $('#loadMoreBtn').addEventListener('click', () => {
      const firstNew = state.shown;
      state.shown += PAGE;
      render();
      const next = $$('#resultsGrid .item-card h3 a')[firstNew];
      if (next) next.focus({ preventScroll: false });
    });

    // Mobile: the same filter form moves into a bottom sheet
    const home = $('#filterHome');
    const sheetBody = $('#filterSheetBody');
    const openBtn = $('#openFilters');
    const sheetCtl = ui.sheet($('#filterSheet'), $('#filterSheetBackdrop'), {
      onClose: () => { home.appendChild(form); openBtn.setAttribute('aria-expanded', 'false'); },
      initialFocus: () => $('input', $('#filterSheet')),
    });
    openBtn.addEventListener('click', () => { sheetBody.appendChild(form); openBtn.setAttribute('aria-expanded', 'true'); sheetCtl.show(); });
    $('#sheetClear').addEventListener('click', clearAll);

    store.subscribe(() => { snapshot(); render(); });
  });
}(window.HNY));
