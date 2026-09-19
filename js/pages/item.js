/* Item detail page: item.html?id=… */
(function (HNY) {
  'use strict';

  const { store, ui, icon, CampusMap } = HNY;
  const { $, $$, esc } = ui;
  const HAU_EMAIL = /^[^\s@]+@hau\.edu\.ph$/i;

  function notFound(root) {
    document.title = 'Item not found | HAUnapin Natin ’Yan!';
    root.innerHTML = `<div class="empty" style="margin-block:var(--s-6)">${icon('search')}
      <h1 style="font-size:var(--fs-2xl)">We couldn’t find that item</h1>
      <p>It may have been removed, or the link is incomplete.</p>
      <div class="cluster" style="justify-content:center"><a class="btn btn-primary" href="browse.html">Browse all items</a></div></div>`;
  }

  const isMine = (it) => { const me = HNY.auth.current(); return Boolean(me && it.owner && it.owner === me.email); };

  function actionCard(it) {
    if (isMine(it)) {
      return `<section class="card card-pad" aria-labelledby="actTitle">
        <h2 class="card-title" id="actTitle">This is your report</h2>
        <p class="muted">${it.state === 'returned' ? 'It’s marked as returned. Nice work!' : 'Update it or mark it returned from your profile. Leads and claim requests show up under Messages.'}</p>
        <div class="stack" style="margin-top:var(--s-3)">
          <a class="btn btn-primary btn-lg btn-block" href="profile.html#${it.status === 'lost' ? 'reported' : 'found'}">${icon('user')}Manage in My Profile</a>
          <button type="button" class="btn btn-outline btn-lg btn-block" data-share>${icon('share')}Share this report</button>
        </div>
      </section>`;
    }
    if (it.state === 'returned') {
      return `<section class="card card-pad" aria-labelledby="actTitle">
        <h2 class="card-title" id="actTitle">Back with its owner</h2>
        <p class="muted">This item has been returned through the Security Office. Thank you to everyone who helped.</p>
        <a class="btn btn-outline btn-block" style="margin-top:var(--s-3)" href="browse.html">Browse other items</a>
      </section>`;
    }
    if (it.status === 'lost') {
      const qs = new URLSearchParams({ type: 'found', cat: it.cat, bldg: it.bldg, from: it.id });
      return `<section class="card card-pad" aria-labelledby="actTitle">
        <h2 class="card-title" id="actTitle">Have you seen this?</h2>
        <p class="muted">Help the owner get it back by sharing a lead, or report it if you found it.</p>
        <div class="stack" style="margin-top:var(--s-3)">
          <button type="button" class="btn btn-primary btn-lg btn-block" data-info>${icon('message')}I have information</button>
          <a class="btn btn-outline btn-lg btn-block" href="report.html?${qs}">${icon('search')}Report a possible match</a>
        </div>
        <div class="note" style="margin-top:var(--s-3)">${icon('shield')}<div><strong>Safety reminder</strong>Don’t share sensitive information publicly. Hand-overs happen at the Security Office.</div></div>
      </section>`;
    }
    const pending = it.state === 'claim-requested';
    return `<section class="card card-pad" aria-labelledby="actTitle">
      <h2 class="card-title" id="actTitle">Is this yours?</h2>
      <p class="muted">${pending ? 'Someone has already asked to claim this item. You can still send a request. The Security Office checks every claim.' : 'Request to claim it, then bring your HAU ID to the Security Office to prove it’s yours.'}</p>
      <div class="stack" style="margin-top:var(--s-3)">
        <button type="button" class="btn btn-primary btn-lg btn-block" data-claim>${icon('hand')}Request to claim</button>
        <button type="button" class="btn btn-outline btn-lg btn-block" data-share>${icon('share')}Share this report</button>
      </div>
      <div class="note" style="margin-top:var(--s-3)">${icon('shield')}<div><strong>How ownership is checked</strong>Describe something that isn’t in this listing, like a lock-screen photo, contents or a mark.</div></div>
    </section>`;
  }

  function gallery(it) {
    const pics = [it.photo, ...(it.gallery || [])].filter(Boolean);
    if (pics.length < 2) return '';
    const shown = pics.slice(0, 4);
    const extra = pics.length - shown.length;
    return `<div class="thumbs" role="group" aria-label="More photos">${shown.map((src, i) => `<button type="button" class="thumb-btn" data-photo="${esc(src)}" aria-pressed="${i === 0}" aria-label="Show photo ${i + 1} of ${pics.length}"><img src="${esc(src)}" alt="" loading="lazy">${i === shown.length - 1 && extra > 0 ? `<span>+${extra}</span>` : ''}</button>`).join('')}</div>`;
  }

  function similar(it) {
    const list = store.query({ cats: [it.cat] }).filter((x) => x.id !== it.id)
      // opposite status first (a lost report is most helped by found items), then newest
      .sort((a, b) => (b.status !== it.status) - (a.status !== it.status) || b.createdAt - a.createdAt)
      .slice(0, 3);
    if (!list.length) return '';
    return `<section class="card card-pad" aria-labelledby="simTitle">
      <h2 class="card-title" id="simTitle">${it.status === 'lost' ? 'Similar items' : 'Similar lost reports'}</h2>
      <div class="similar">${list.map((x) => ui.rowCard(x, { tag: 'a' })).join('')}</div>
    </section>`;
  }

  let detailMap = null;
  function render(it) {
    const root = $('#itemRoot');
    const b = store.building(it.bldg);
    const cat = store.category(it.cat);
    const kindWord = it.status === 'lost' ? 'Lost' : 'Found';
    document.title = `${it.title} | HAUnapin Natin ’Yan!`;
        root.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb">
        <a class="text-link" href="browse.html">${icon('arrowLeft')}Back to Browse</a>
        <ol class="list-reset" role="list">
          <li><a href="browse.html">Browse</a></li>
          <li><a href="browse.html?cat=${encodeURIComponent(it.cat)}">${esc(cat ? cat.short || cat.label : 'Other')}</a></li>
          <li><span aria-current="page">${esc(it.title)}</span></li>
        </ol>
      </nav>
      <div class="detail-head">
        <div>
          <div class="cluster">${ui.statusBadge(it)}${ui.stateBadge(it)}<span class="muted" style="font-size:var(--fs-sm)">Reported ${ui.timeAgo(it.createdAt)} · Ref ${esc(it.ref)}</span></div>
          <h1>${esc(it.title)}</h1>
        </div>
        <div class="cluster">
          <button type="button" class="icon-btn" data-save aria-pressed="${isSaved(it.id)}" aria-label="${isSaved(it.id) ? 'Remove from saved items' : 'Save this item'}">${icon('heart')}</button>
          <button type="button" class="icon-btn" data-share aria-label="Copy link to this report">${icon('share')}</button>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-main">
          <div class="detail-media" id="mainMedia">${ui.itemArt(it, `Photo of the ${it.title}`)}</div>
          ${gallery(it)}
          <section class="card card-pad" aria-labelledby="descTitle">
            <h2 class="card-title" id="descTitle">Item description</h2>
            <p style="white-space:pre-line">${esc(it.desc)}</p>
            <dl class="facts">
              <div class="fact"><span class="fact-icon">${icon('calendar')}</span><div><dt>Date ${kindWord.toLowerCase()}</dt><dd>${ui.fmtDate(it.happenedAt)}</dd></div></div>
              <div class="fact"><span class="fact-icon">${icon('clock')}</span><div><dt>Approx. time</dt><dd>${it.noTime ? 'Not sure' : ui.fmtTime(it.happenedAt)}</dd></div></div>
              <div class="fact"><span class="fact-icon">${icon(cat ? cat.icon : 'box')}</span><div><dt>Category</dt><dd>${esc(cat ? cat.label : 'Other')}</dd></div></div>
              <div class="fact"><span class="fact-icon">${icon('pin')}</span><div><dt>${it.status === 'lost' ? 'Last known location' : 'Where it was found'}</dt><dd>${esc(it.spot || 'No room details')}<br><span class="muted" style="font-weight:500">${esc(b ? b.name : 'Campus')}</span></dd></div></div>
            </dl>
          </section>
          <section class="card card-pad mini-map" aria-labelledby="locTitle">
            <div class="card-head">
              <h2 id="locTitle">Location details</h2>
              ${it.state === 'returned' ? '' : `<a class="text-link" href="map.html?item=${encodeURIComponent(it.id)}">View on campus map${icon('arrowRight')}</a>`}
            </div>
            <div class="map-shell" id="detailMap"></div>
            <p class="map-caption">${icon('info')}<span>The pin shows the area where the item was ${it.status === 'lost' ? 'last seen' : 'found'}.</span></p>
          </section>
        </div>
        <div class="detail-aside">
          ${actionCard(it)}
          <section class="card card-pad" aria-label="Reported by">
            <div class="reporter">${ui.avatar(it.avatar, it.reporter, 'avatar avatar-lg')}
              <div><small>Reported by</small><b>${esc(it.reporter || 'An Angelite')}</b><br><span class="verified">Verified student</span></div></div>
          </section>
          ${similar(it)}
        </div>
      </div>`;

    // Phones: the main action is pinned to the bottom of the screen
    let bar = $('#mobileAction');
    if (!bar) { bar = document.createElement('div'); bar.id = 'mobileAction'; bar.className = 'mobile-action'; document.body.appendChild(bar); }
    if (isMine(it)) bar.innerHTML = `<a class="btn btn-primary btn-lg" href="profile.html">${icon('user')}Manage in My Profile</a>`;
    else if (it.state === 'returned') bar.innerHTML = `<a class="btn btn-outline btn-lg" href="browse.html">Browse other items</a>`;
    else if (it.status === 'lost') bar.innerHTML = `<button type="button" class="btn btn-primary btn-lg" data-info>${icon('message')}I have information</button>`;
    else bar.innerHTML = `<button type="button" class="btn btn-primary btn-lg" data-claim>${icon('hand')}Request to claim</button>`;
    bar.onclick = (e) => { if (e.target.closest('[data-claim]')) openClaim(store.get(it.id)); if (e.target.closest('[data-info]')) openInfo(store.get(it.id)); };

    if (detailMap) detailMap.destroy();
    const map = CampusMap($('#detailMap'), {
      mode: 'detail', wheel: 'ctrl', legend: false, fullscreen: true,
      hint: 'Drag to move · Ctrl + scroll to zoom',
      label: `Campus map showing where the ${it.title} was ${it.status === 'lost' ? 'lost' : 'found'}`,
      initialScale: 2.4, initialCentre: { x: it.x, y: it.y - 30 },
    });
    map.setItems([{ ...it, place: b ? b.name : '' }]);
    map.setActive(it.id);
    map.selectBuilding(it.bldg, { zoom: false });
    detailMap = map;

  }

  function isSaved(id) {
    const me = HNY.auth.current();
    return Boolean(me && store.list('saved').some((x) => x.user === me.email && x.itemId === id));
  }
  function toggleSave(it, btn) {
    const me = HNY.auth.current();
    if (!me) { HNY.go(`login.html?next=${encodeURIComponent(`item.html?id=${it.id}`)}`); return; }
    const all = store.list('saved');
    const on = isSaved(it.id);
    store.setList('saved', on ? all.filter((x) => !(x.user === me.email && x.itemId === it.id)) : [{ id: `v${Date.now().toString(36)}`, user: me.email, itemId: it.id, at: Date.now() }, ...all]);
    btn.setAttribute('aria-pressed', String(!on));
    btn.setAttribute('aria-label', on ? 'Save this item' : 'Remove from saved items');
    ui.toast(on ? 'Removed from your saved items.' : 'Saved. Find it under Saved Items in your profile.');
  }

  function openInfo(it) {
    const me = HNY.auth.current();
    if (isMine(it)) { ui.toast('This is your own report. Manage it from My Profile.'); return; }
    const m = ui.modal({
      title: 'Share information',
      body: `<p class="muted" style="margin-bottom:var(--s-3)">Seen the <b>${esc(it.title)}</b>? Your message goes to the person who reported it.</p>
        <form id="infoForm" novalidate>
          <div class="field"><label class="label" for="iName">Your name <span class="req">Required</span></label><input class="input" id="iName" autocomplete="name" value="${esc(me ? me.name : '')}" aria-describedby="iNameErr"><p class="error" id="iNameErr"></p></div>
          <div class="field"><label class="label" for="iEmail">HAU email <span class="req">Required</span></label><input class="input" id="iEmail" type="email" inputmode="email" autocomplete="email" value="${esc(me ? me.email : '')}" placeholder="angelite@hau.edu.ph" aria-describedby="iEmailErr"><p class="error" id="iEmailErr"></p></div>
          <div class="field"><label class="label" for="iMsg">What did you see? <span class="req">Required</span></label><textarea class="textarea" id="iMsg" maxlength="400" placeholder="Where and when you saw it, and anything else that might help." aria-describedby="iMsgErr"></textarea><p class="error" id="iMsgErr"></p></div>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="submit" class="btn btn-primary">${icon('send')}Send</button></div>
        </form>`,
    });
    const form = $('#infoForm', m.root);
    const err = (id, msg) => { $(`#${id}Err`, m.root).textContent = msg; $(`#${id}`, m.root).setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
    form.addEventListener('input', (e) => { if (e.target.id) err(e.target.id, ''); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#iName', m.root).value.trim();
      const email = $('#iEmail', m.root).value.trim();
      const msg = $('#iMsg', m.root).value.trim();
      const ok = [err('iName', name.length >= 2 ? '' : 'Enter your name.'), err('iEmail', HAU_EMAIL.test(email) ? '' : 'Use your HAU email, ending in @hau.edu.ph.'), err('iMsg', msg.length >= 10 ? '' : 'Add a little more detail (at least 10 characters).')];
      if (ok.includes(false)) { $('[aria-invalid="true"]', m.root).focus(); return; }
      store.push('messages', { kind: 'info', itemId: it.id, name, email, message: msg, from: me ? me.email : '' });
      m.setBody(`<p>Thanks, ${esc(name.split(' ')[0])}. Your lead on <b>${esc(it.title)}</b> has been sent to the owner.</p><p class="hint" style="margin-top:var(--s-2)">Demo build: messages are saved in this browser only.</p><div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Done</button></div>`);
      const d = $('[data-close].btn-primary', m.root); if (d) d.focus();
    });
  }

  function openClaim(it) {
    if (isMine(it)) { ui.toast('You reported this item, so you can’t claim it.'); return; }
    if (it.state === 'returned') { ui.toast('This item has already been returned to its owner.'); return; }
    const m = ui.modal({
      title: 'Request to claim',
      body: `<p class="muted" style="margin-bottom:var(--s-3)">For: <b>${esc(it.title)}</b>. The Security Office uses these details to check that it’s yours.</p>
        <form id="claimForm" novalidate>
          <div class="field"><label class="label" for="cName">Full name <span class="req">Required</span></label>
            <input class="input" id="cName" autocomplete="name" value="${esc(HNY.auth.current() ? HNY.auth.current().name : '')}" aria-describedby="cNameErr"><p class="error" id="cNameErr"></p></div>
          <div class="field"><label class="label" for="cEmail">HAU email <span class="req">Required</span></label>
            <input class="input" id="cEmail" type="email" inputmode="email" autocomplete="email" placeholder="angelite@hau.edu.ph" value="${esc(HNY.auth.current() ? HNY.auth.current().email : '')}" aria-describedby="cEmailErr"><p class="error" id="cEmailErr"></p></div>
          <div class="field"><label class="label" for="cProof">Proof of ownership <span class="req">Required</span></label>
            <textarea class="textarea" id="cProof" maxlength="300" placeholder="Something only the owner would know, like contents, a mark, or the lock-screen photo." aria-describedby="cProofErr"></textarea><p class="error" id="cProofErr"></p></div>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="submit" class="btn btn-primary">Send request</button></div>
        </form>`,
    });
    const form = $('#claimForm', m.root);
    const err = (id, msg) => { $(`#${id}Err`, m.root).textContent = msg; $(`#${id}`, m.root).setAttribute('aria-invalid', msg ? 'true' : 'false'); return !msg; };
    form.addEventListener('input', (e) => { if (e.target.id) err(e.target.id, ''); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#cName', m.root).value.trim();
      const email = $('#cEmail', m.root).value.trim();
      const proof = $('#cProof', m.root).value.trim();
      const ok = [
        err('cName', name.length >= 2 ? '' : 'Enter your full name.'),
        err('cEmail', HAU_EMAIL.test(email) ? '' : 'Use your HAU email, ending in @hau.edu.ph.'),
        err('cProof', proof.length >= 10 ? '' : 'Add a detail that proves it’s yours (at least 10 characters).'),
      ];
      if (ok.includes(false)) { const bad = $('[aria-invalid="true"]', m.root); if (bad) bad.focus(); return; }
      const res = store.addClaim(it.id, { name, email, proof });
      if (!res.ok) { err('cProof', res.msg); $('#cProof', m.root).focus(); return; }
      m.setBody(`<p>Your claim for <b>${esc(it.title)}</b> is recorded.</p>
        <ol style="margin:var(--s-2) 0 0;padding-left:1.2em;color:var(--ink-2)">
          <li>Bring your HAU ID to the Security Office.</li>
          <li>Give your name and the reference <b>${esc(it.ref)}</b>.</li>
          <li>Staff check your proof, then hand the item over.</li></ol>
        <p class="hint" style="margin-top:var(--s-2)">Demo build: the request is saved in this browser only.</p>
        <div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Done</button></div>`);
      const done = $('[data-close].btn-primary', m.root);
      if (done) done.focus();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const id = ui.params().get('id');
    const it = id && store.get(id);
    if (!it) { notFound($('#itemRoot')); return; }
    render(it);
    $('#itemRoot').addEventListener('click', async (e) => {
      if (e.target.closest('[data-share]')) {
        const ok = await ui.copyText(window.location.href);
        ui.toast(ok ? 'Link copied. Share it with friends who might have seen it.' : 'Copy the address bar link to share this report.');
      }
      if (e.target.closest('[data-claim]')) openClaim(store.get(id));
      if (e.target.closest('[data-info]')) openInfo(store.get(id));
      const sv = e.target.closest('[data-save]');
      if (sv) toggleSave(store.get(id), sv);
      const th = e.target.closest('[data-photo]');
      if (th) {
        $('#mainMedia img').src = th.dataset.photo;
        $$('.thumb-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === th)));
      }
    });
    // Re-render when the item changes, but never underneath an open dialog (keeps focus return working)
    let pending = false;
    const refresh = () => {
      const fresh = store.get(id);
      if (!fresh) { notFound($('#itemRoot')); return; }
      if (fresh.state === it.state) return;
      if (document.querySelector('.modal-backdrop')) { pending = true; return; }
      const hadFocus = document.activeElement === document.body || $('#itemRoot').contains(document.activeElement) || $('#mobileAction')?.contains(document.activeElement);
      Object.assign(it, fresh); render(fresh);
      // The action card was rebuilt: put focus on its heading so keyboard users don't lose their place
      if (hadFocus) { const h = $('#actTitle'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    };
    store.subscribe(refresh);
    document.addEventListener('hny:modal-closed', () => { if (pending) { pending = false; refresh(); } });
  });
}(window.HNY));
