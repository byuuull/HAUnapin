/* My Profile: stats, my reports, saved items, messages, settings */
(function (HNY) {
  'use strict';

  const { store, ui, icon, auth } = HNY;
  const { $, $$, esc } = ui;
  const TABS = ['reported', 'found', 'saved', 'messages', 'settings'];
  let me = null;
  let sort = 'newest';

  const mine = () => store.all().filter((i) => i.owner === me.email);
  const savedIds = () => store.list('saved').filter((s) => s.user === me.email).map((s) => s.itemId);

  function stateLabel(it) {
    if (it.state === 'returned') return ['Returned', 'st-returned'];
    if (it.state === 'claim-requested') return ['Pending verification', 'st-pending'];
    return it.status === 'lost' ? ['Searching', 'st-searching'] : ['Waiting for owner', 'st-waiting'];
  }

  function reportCard(it, { manage = true } = {}) {
    const [label, cls] = stateLabel(it);
    const returned = it.state === 'returned';
    return `<article class="report-card${returned ? ' is-returned' : ''}" data-id="${esc(it.id)}">
      <div class="report-media">${ui.itemArt(it)}<span class="state-pill ${cls}">${returned ? icon('checkCircle') : ''}${label}</span><span class="age-pill">Reported ${ui.timeAgo(it.createdAt)}</span></div>
      <div class="report-body">
        <h2 class="report-title"><a href="item.html?id=${encodeURIComponent(it.id)}">${esc(it.title)}</a></h2>
        ${returned ? `<p class="muted small">Back with its owner. Reported ${ui.fmtDate(it.createdAt)}.</p>`
          : `<ul class="meta meta-inline list-reset"><li>${icon('calendar')}<span>${ui.fmtDate(it.happenedAt)}</span></li><li>${icon('clock')}<span>${it.noTime ? 'Time unknown' : ui.fmtTime(it.happenedAt)}</span></li></ul>
             <p class="loc-row">${icon('pin')}<span>${esc(ui.placeLine(it))}</span></p>`}
        ${manage ? `<div class="report-actions">
          <a class="btn btn-outline" href="item.html?id=${encodeURIComponent(it.id)}">View</a>
          ${returned ? '' : `<button type="button" class="btn btn-ghost" data-returned="${esc(it.id)}">${icon('checkCircle')}Mark returned</button>`}
          <button type="button" class="icon-btn" data-delete="${esc(it.id)}" aria-label="Delete report: ${esc(it.title)}">${icon('trash')}</button>
        </div>` : ''}
      </div>
    </article>`;
  }

  function addCard(type) {
    return `<a class="add-card" href="report.html?type=${type}"><span class="add-plus">${icon('plus')}</span><b>${type === 'lost' ? 'Lost something else?' : 'Found something?'}</b><small>${type === 'lost' ? 'Report another lost item to the campus community.' : 'Log it so the owner can find it.'}</small></a>`;
  }

  function sortList(list) { return list.sort((a, b) => (sort === 'oldest' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt)); }

  function panelHead(title, sub, withSort = true) {
    return `<div class="panel-head"><div><h1 class="h-sans" id="panelTitle">${title}</h1><p class="muted">${sub}</p></div>
      ${withSort ? `<label class="sort-pill"><span>Sort by</span><select class="select" id="pSort"><option value="newest"${sort === 'newest' ? ' selected' : ''}>Newest first</option><option value="oldest"${sort === 'oldest' ? ' selected' : ''}>Oldest first</option></select></label>` : ''}</div>`;
  }

  function renderTab(tab) {
    const panel = $('#tabPanel');
    $$('.profile-nav a').forEach((a) => { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (tab === 'reported' || tab === 'found') {
      const status = tab === 'reported' ? 'lost' : 'found';
      const list = sortList(mine().filter((i) => i.status === status));
      panel.innerHTML = panelHead(tab === 'reported' ? 'Active Reports' : 'My Found Items',
        tab === 'reported' ? 'Items you’ve reported lost, and where they’re up to.' : 'Items you turned in. Thank you for being honest!')
        + `<div class="report-grid">${list.map((i) => reportCard(i)).join('')}${addCard(status)}</div>`;
    } else if (tab === 'saved') {
      const ids = savedIds();
      const list = ids.map((id) => store.get(id)).filter(Boolean);
      if (list.length !== ids.length) store.setList('saved', store.list('saved').filter((x) => x.user !== me.email || store.get(x.itemId)));
      panel.innerHTML = panelHead('Saved Items', 'Reports you’ve bookmarked with the heart button.', false)
        + (list.length ? `<div class="grid grid-2">${list.map((i) => ui.itemCard(i)).join('')}</div>`
          : `<div class="empty">${icon('heart')}<h3>Nothing saved yet</h3><p>Tap the heart on any item to keep it here.</p><a class="btn btn-primary" href="browse.html">Browse items</a></div>`);
    } else if (tab === 'messages') {
      const myIds = new Set(mine().map((i) => i.id));
      const claims = store.claims().filter((c) => myIds.has(c.itemId) || c.email === me.email);
      const msgs = store.list('messages').filter((m) => m.from === me.email || m.email === me.email || (m.kind === 'info' && myIds.has(m.itemId)));
      const rows = [
        ...claims.map((c) => ({ at: c.at, icon: 'hand', title: myIds.has(c.itemId) ? `Claim request for “${(store.get(c.itemId) || {}).title || 'your item'}”` : `You asked to claim “${(store.get(c.itemId) || {}).title || 'an item'}”`, body: myIds.has(c.itemId) ? `${auth.publicName(c.name)} says: ${c.proof}` : 'Bring your HAU ID to the Security Office to finish the claim.', link: `item.html?id=${encodeURIComponent(c.itemId)}` })),
        ...msgs.map((m) => ({ at: m.at, icon: m.kind === 'info' ? 'message' : 'send', title: m.kind === 'info' ? (myIds.has(m.itemId) ? `New lead on “${(store.get(m.itemId) || {}).title || 'your item'}” from ${auth.publicName(m.name)}` : `You sent a lead on “${(store.get(m.itemId) || {}).title || 'an item'}”`) : `You sent: ${m.subject || 'a message'}`, body: m.message, link: m.itemId ? `item.html?id=${encodeURIComponent(m.itemId)}` : '' })),
      ].sort((a, b) => b.at - a.at);
      panel.innerHTML = panelHead('Messages', 'Claim requests, leads on your items and messages you’ve sent.', false)
        + (rows.length ? `<ul class="msg-list list-reset">${rows.map((r) => `<li class="msg"><span class="tile is-rose">${icon(r.icon)}</span><div><b>${esc(r.title)}</b><p>${esc(r.body)}</p><small>${ui.timeAgo(r.at)}${r.link ? ` · <a href="${r.link}">Open item</a>` : ''}</small></div></li>`).join('')}</ul>`
          : `<div class="empty">${icon('message')}<h3>No messages yet</h3><p>When someone asks to claim your item or sends a lead, it shows up here.</p></div>`);
    } else if (tab === 'settings') {
      panel.innerHTML = panelHead('Settings', 'Update your details or password.', false) + `
        <form class="card card-pad" id="settingsForm" novalidate>
          <div class="field-row">
            <div class="field"><label class="label" for="pName">Full name</label><input class="input" id="pName" value="${esc(me.name)}" autocomplete="name" aria-describedby="pNameErr"><p class="error" id="pNameErr"></p></div>
            <div class="field"><label class="label" for="pStudent">Student number</label><input class="input" id="pStudent" value="${esc(me.studentNo)}" placeholder="2023-12345" aria-describedby="pStudentErr"><p class="error" id="pStudentErr"></p></div>
          </div>
          <div class="field"><label class="label" for="pEmail">HAU email</label><input class="input" id="pEmail" value="${esc(me.email)}" readonly aria-describedby="pEmailHint"><p class="hint" id="pEmailHint">Your email is your login, so it can’t be changed here.</p></div>
          <h2 class="card-title" style="margin-top:var(--s-4)">Change password</h2>
          <div class="field-row">
            <div class="field"><label class="label" for="pCurrent">Current password</label><input class="input" id="pCurrent" type="password" autocomplete="current-password" aria-describedby="pCurrentErr"><p class="error" id="pCurrentErr"></p></div>
            <div class="field"><label class="label" for="pNew">New password</label><input class="input" id="pNew" type="password" autocomplete="new-password" aria-describedby="pNewErr"><p class="error" id="pNewErr"></p></div>
          </div>
          <div class="cluster" style="margin-top:var(--s-3)"><button class="btn btn-primary btn-lg" type="submit">Save changes</button></div>
        </form>
        <section class="card card-pad danger-zone" aria-labelledby="dzTitle">
          <h2 class="card-title" id="dzTitle">Demo data</h2>
          <p class="muted">Put the sample items back and clear the reports, messages and stories saved in this browser. Accounts stay.</p>
          <div class="cluster" style="margin-top:var(--s-2)"><button type="button" class="btn btn-outline" id="resetDemo">${icon('reset')}Reset demo data</button><button type="button" class="btn btn-ghost" data-logout>${icon('logout')}Log out</button></div>
        </section>`;
      wireSettings();
      ui.renderAccount();
    }
    const s = $('#pSort');
    if (s) s.addEventListener('change', () => { sort = s.value; renderTab(tab); });
  }

  function wireSettings() {
    const form = $('#settingsForm');
    const err = (id, msg) => { $(`#${id}Err`).textContent = msg; $(`#${id}`).setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#pName').value.trim();
      const sn = $('#pStudent').value.trim();
      const cur = $('#pCurrent').value;
      const nw = $('#pNew').value;
      const ok = [
        err('pName', name.length >= 2 ? '' : 'Enter your name.'),
        err('pStudent', !sn || /^\d{4}-?\d{5}$/.test(sn) ? '' : 'Student numbers look like 2023-12345.'),
        err('pNew', !nw || (nw.length >= 8 && /\d/.test(nw)) ? '' : 'Use at least 8 characters, including a number.'),
        err('pCurrent', !nw || cur ? '' : 'Enter your current password to change it.'),
      ];
      if (ok.includes(false)) { $('[aria-invalid="true"]', form).focus(); return; }
      const res = await auth.updateProfile({ name, studentNo: sn }, cur, nw);
      if (!res.ok) { err('pCurrent', res.msg); $('#pCurrent').focus(); return; }
      ui.toast(nw ? 'Details and password saved.' : 'Details saved.');
    });
    $('#resetDemo').addEventListener('click', () => {
      const m = ui.modal({ title: 'Reset demo data?', body: `<p class="muted">This puts the sample items back and clears reports, claims, messages and stories saved in this browser.</p><div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-primary" id="confirmReset">Reset</button></div>` });
      $('#confirmReset', m.root).addEventListener('click', () => { store.resetDemo(); m.close(); ui.toast('Demo data reset.'); });
    });
  }

  function renderSide() {
    me = auth.current();
    if (!me) { HNY.go('login.html?next=profile.html&guard=1', { replace: true }); return; }
    $('#profileCard').innerHTML = `${ui.avatar(me.avatar, me.name, 'avatar avatar-xl')}
      <p class="profile-name">${esc(me.name)}</p><p class="muted">${me.studentNo ? `Student ID: ${esc(me.studentNo)}` : esc(me.email)}</p><span class="verified">${icon('check')}Verified Angelite</span>${me.lastLogin ? `<p class="last-login">Last signed in ${ui.timeAgo(me.lastLogin)}</p>` : ''}`;
    const list = mine();
    const tiles = [
      { n: list.length, label: 'Items reported', cls: '' },
      { n: list.filter((i) => i.state === 'returned').length, label: 'Items recovered', cls: 'is-burgundy' },
      { n: list.filter((i) => i.status === 'lost' && i.state !== 'returned').length, label: 'Active searches', cls: 'is-gold' },
    ];
    $('#statTiles').innerHTML = tiles.map((t) => `<div class="stat-tile ${t.cls}"><strong>${String(t.n).padStart(2, '0')}</strong><span>${t.label}</span></div>`).join('');
    const myIds = new Set(list.map((i) => i.id));
    const n = store.claims().filter((c) => myIds.has(c.itemId)).length + store.list('messages').filter((m) => m.kind === 'info' && myIds.has(m.itemId)).length;
    const dot = $('#msgCount');
    dot.hidden = !n; dot.textContent = String(n);
  }

  const currentTab = () => { const h = location.hash.slice(1); return TABS.includes(h) ? h : 'reported'; };
  function route(focus) {
    renderSide();
    if (!me) return;
    renderTab(currentTab());
    if (focus) { const t = $('#panelTitle'); if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!ui.requireLogin()) return;
    route(false);
    if (ui.params().get('welcome')) ui.toast('Welcome to HAUnapin Natin ’Yan! Your account is ready.');
    window.addEventListener('hashchange', () => route(true));
    $('#tabPanel').addEventListener('click', (e) => {
      const ret = e.target.closest('[data-returned]');
      if (ret) {
        const it = store.get(ret.dataset.returned);
        const m = ui.modal({ title: 'Mark as returned?', body: `<p class="muted">Only do this once “${esc(it.title)}” is back with its owner. It’ll be taken off the map and marked returned in Browse.</p><div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-primary" id="confirmRet">${icon('checkCircle')}Mark returned</button></div>` });
        $('#confirmRet', m.root).addEventListener('click', () => { store.update(it.id, { state: 'returned' }); m.close(); ui.toast('Marked as returned. Great news!'); });
        return;
      }
      const del = e.target.closest('[data-delete]');
      if (del) {
        const it = store.get(del.dataset.delete);
        const m = ui.modal({ title: 'Delete this report?', body: `<p class="muted">“${esc(it.title)}” will be removed from Browse and the map. This can’t be undone.</p><div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-primary" id="confirmDel">${icon('trash')}Delete</button></div>` });
        $('#confirmDel', m.root).addEventListener('click', () => { store.remove(it.id); m.close(); ui.toast('Report deleted.'); });
      }
    });
    store.subscribe(() => route(false));
    auth.subscribe(() => route(false));
  });
}(window.HNY));
