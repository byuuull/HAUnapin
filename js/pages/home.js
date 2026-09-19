/* Home page: hero numbers, quick search options, latest reports, map preview */
(function (HNY) {
  'use strict';

  const { store, ui, CampusMap } = HNY;
  const { $, esc } = ui;

  function fillSelects() {
    $('#qsCat').insertAdjacentHTML('beforeend', store.categories().map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join(''));
    const bl = store.buildings().slice().sort((a, b) => a.name.localeCompare(b.name));
    $('#qsBldg').insertAdjacentHTML('beforeend', bl.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join(''));
    ui.enhanceSelect($('#qsCat'));
    ui.enhanceSelect($('#qsBldg'));
  }

  function render() {
    const st = store.stats();
    $('#statReturned').textContent = String(st.returned);
    $('#statMore').textContent = `+${st.open}`;
    const latest = store.query({ sort: 'newest' });
    const top = latest[0];
    if (top) {
      $('#latestFloat').href = `item.html?id=${encodeURIComponent(top.id)}`;
      $('#latestFloatTitle').textContent = top.title;
    }
    $('#latestGrid').innerHTML = latest.slice(0, 3).map((it) => ui.itemCard(it, { variant: 'latest' })).join('')
      || '<p class="muted">No open reports right now.</p>';
    if (preview) preview.setItems(store.query({}).map(withPlace));
  }

  const withPlace = (it) => ({ ...it, place: ui.bShort(it.bldg) });

  let preview = null;
  document.addEventListener('DOMContentLoaded', () => {
    fillSelects();
    preview = CampusMap($('#previewMap'), { mode: 'preview', controls: false, legend: true, label: 'Preview of the campus map with open reports', fit: true, legendFence: false });
    // the whole preview opens the full map
    $('#previewMap').addEventListener('click', () => { HNY.go('map.html'); });
    render();
    store.subscribe(render);
  });
}(window.HNY));
