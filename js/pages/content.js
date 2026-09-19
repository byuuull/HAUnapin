/* Content pages: How It Works, About, Success Stories, Safety, Legal, Help Centre.
   Each block only runs when its container is on the page. */
(function (HNY) {
  'use strict';

  const { store, ui, icon, auth } = HNY;
  const { $, $$, esc } = ui;
  const { CONTACT, HAU, TEAM, STORIES, FAQ, HELP } = HNY.DATA;

  function setErr(root, id, msg) {
    const el = $(`#${id}Err`, root);
    if (el) el.textContent = msg;
    const f = $(`#${id}`, root);
    if (f) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  /* ---------- FAQ accordion (native details/summary) ---------- */
  function faq() {
    const box = $('#faqList');
    if (!box) return;
    box.innerHTML = FAQ.map((f, i) => `<details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary>${icon('search')}<span>${esc(f.q)}</span>${icon('chevronDown', 'icon chev')}</summary>
      <p>${esc(f.a)}</p></details>`).join('');
  }

  /* ---------- About ---------- */
  function about() {
    const team = $('#teamGrid');
    if (team) {
      team.innerHTML = TEAM.map((t) => `<figure class="team-card"><img src="${t.photo}" alt="Portrait of ${esc(t.name)}" loading="lazy"><figcaption>${esc(t.name)}</figcaption></figure>`).join('');
    }
    $$('[data-stat="returned"]').forEach((el) => { el.textContent = String(store.stats().returned); });
    const facts = $('#hauFacts');
    if (facts) {
      facts.textContent = `Founded in ${HAU.founded} by ${HAU.founders}, Holy Angel University is a Catholic university in Angeles City, Pampanga. Its motto is ${HAU.motto}. HAUnapin Natin ’Yan! is built for its students, staff and visitors.`;
    }
    const tl = $('#hauTimeline');
    if (tl) {
      tl.innerHTML = HAU.milestones.map((m) => {
        const img = m.img && HAU.images[m.img];
        return `<li class="milestone">${img ? `<span class="ms-img" data-hau-wrap><img src="${img.local}" data-remote="${img.remote}" alt="${esc(m.alt || '')}" loading="lazy"></span>` : ''}<b>${esc(m.year)}</b><p>${esc(m.text)}</p></li>`;
      }).join('');
    }
    const cl = $('#contactList');
    if (cl) {
      cl.innerHTML = `
        <li><span class="tile is-burgundy">${icon('pin')}</span><span><small>Hand-overs</small><b>${esc(CONTACT.securityOffice)}</b></span></li>
        <li><span class="tile is-gold">${icon('clock')}</span><span><small>Office hours</small><b>${esc(CONTACT.hours)}</b></span></li>
        <li><span class="tile is-rose">${icon('phone')}</span><span><small>HAU trunkline</small><b>${esc(CONTACT.trunkline)}, local ${esc(CONTACT.campusServicesLocal)} (Campus Services)</b></span></li>`;
    }
  }

  /* ---------- Message forms (About "Get in touch", Help "Send a message") ---------- */
  function messageForms() {
    $$('[data-message-form]').forEach((form) => {
      const kind = form.dataset.messageForm;
      const me = auth.current();
      const nameEl = $('[name="name"]', form);
      const emailEl = $('[name="email"]', form);
      if (me) { if (nameEl && !nameEl.value) nameEl.value = me.name; if (emailEl && !emailEl.value) emailEl.value = me.email; }
      form.addEventListener('input', (e) => { if (e.target.id) setErr(form, e.target.id, ''); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = (n) => { const el = $(`[name="${n}"]`, form); return el ? el.value.trim() : ''; };
        const id = (n) => { const el = $(`[name="${n}"]`, form); return el ? el.id : ''; };
        const checks = [setErr(form, id('name'), val('name').length >= 2 ? '' : 'Enter your name.')];
        if (emailEl) checks.push(setErr(form, id('email'), auth.HAU_EMAIL.test(val('email')) ? '' : 'Use your HAU email, ending in @hau.edu.ph.'));
        if ($('[name="studentNo"]', form)) checks.push(setErr(form, id('studentNo'), !val('studentNo') || /^\d{4}-?\d{5}$/.test(val('studentNo')) ? '' : 'Student numbers look like 2023-12345.'));
        if ($('input[name="subject"]', form)) checks.push(setErr(form, id('subject'), val('subject').length >= 3 ? '' : 'Add a short subject.'));
        checks.push(setErr(form, id('message'), val('message').length >= 10 ? '' : 'Write at least 10 characters.'));
        if (checks.includes(false)) { const bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }
        store.push('messages', { kind, name: val('name'), email: val('email') || (me && me.email) || '', studentNo: val('studentNo'), subject: val('subject'), message: val('message'), from: me ? me.email : '' });
        form.reset();
        if (me && nameEl) nameEl.value = me.name;
        if (me && emailEl) emailEl.value = me.email;
        ui.toast(me ? 'Message sent. You can see it under Messages in your profile.' : 'Message sent. We’ll reply to your HAU email.');
      });
    });
  }

  /* ---------- Stories ---------- */
  function storyCard(s) {
    return `<article class="story-card">
      <div class="story-media"><img src="${esc(s.photo || 'images/campus/students.jpg')}" alt="" loading="lazy"><span class="badge badge-solid-found">Returned</span></div>
      <h3>${esc(s.title)}</h3>
      <p class="muted">${esc(s.text)}</p>
      <blockquote><p>“${esc(s.quote)}”</p><footer>${ui.avatar(s.avatar, s.by, 'avatar avatar-xs')}<span>— ${esc(s.by)}${s.role ? `, ${esc(s.role)}` : ''}</span></footer></blockquote>
    </article>`;
  }
  function stories() {
    const track = $('#storyTrack');
    if (!track) return;
    const render = () => {
      const mine = store.list('stories').map((s) => ({ ...s, role: s.role || 'Shared on HAUnapin' }));
      track.innerHTML = [...mine, ...STORIES].map(storyCard).join('');
    };
    render();
    $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
      const card = $('.story-card', track);
      const step = card ? card.getBoundingClientRect().width + 24 : 320;
      track.scrollBy({ left: Number(b.dataset.scroll) * step, behavior: ui.prefersReducedMotion() ? 'auto' : 'smooth' });
    }));

    const form = $('#storyForm');
    const me = auth.current();
    const sel = $('#sItem');
    const mineItems = me ? store.all().filter((i) => i.owner === me.email && i.state === 'returned') : [];
    const options = mineItems.length ? mineItems : store.all().filter((i) => i.state === 'returned');
    sel.insertAdjacentHTML('beforeend', options.map((i) => `<option value="${esc(i.id)}">${esc(i.title)}${i.state === 'returned' ? ' (returned)' : ''}</option>`).join('') + '<option value="other">Something else</option>');
    if (!mineItems.length) sel.options[0].textContent = me ? 'Select a returned item…' : 'Select a returned item (log in to see your own)…';
    if (me) $('#sName').value = me.name;
    form.addEventListener('input', (e) => { if (e.target.id) setErr(form, e.target.id, ''); });
    form.addEventListener('change', (e) => { if (e.target.id) setErr(form, e.target.id, ''); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#sName').value.trim();
      const sn = $('#sStudent').value.trim();
      const itemId = sel.value;
      const text = $('#sStory').value.trim();
      const ok = [
        setErr(form, 'sName', name.length >= 2 ? '' : 'Enter your name.'),
        setErr(form, 'sStudent', !sn || /^\d{4}-?\d{5}$/.test(sn) ? '' : 'Student numbers look like 2023-12345.'),
        setErr(form, 'sItem', itemId ? '' : 'Choose the item that came back.'),
        setErr(form, 'sStory', text.length >= 20 ? '' : 'Tell us a little more (at least 20 characters).'),
      ];
      if (ok.includes(false)) { const bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); return; }
      const it = store.get(itemId);
      store.push('stories', {
        title: it ? it.title : 'A campus reunion', photo: it && it.photo && !it.photo.startsWith('data:') ? it.photo : (it && it.photo) || 'images/campus/students.jpg',
        text: it ? `Reported ${it.status} at ${ui.bShort(it.bldg)}${it.spot ? ` (${it.spot})` : ''}.` : 'Shared by an Angelite.',
        quote: text, by: auth.publicName(name), avatar: me ? me.avatar : '',
      });
      form.reset();
      if (me) $('#sName').value = me.name;
      render();
      track.scrollTo({ left: 0, behavior: 'auto' });
      ui.toast('Thanks for sharing! Your story is now at the start of Latest Happy Returns.');
    });
  }

  /* ---------- Safety ---------- */
  function safety() {
    const c = $('#safetyContacts');
    if (!c) return;
    $('#safetyOffice').textContent = `${CONTACT.securityOffice} is the main exchange point.`;
    c.innerHTML = `<div><dt>Campus security</dt><dd><a href="tel:+63456255748">${esc(CONTACT.trunkline)}</a>, local ${esc(CONTACT.campusServicesLocal)}</dd></div>
      <div><dt>Platform team</dt><dd><a href="help.html#contact">Send us a message</a></dd></div>`;
  }

  /* ---------- Legal: highlight the section in view ---------- */
  function legal() {
    const nav = $('.legal-nav');
    if (!nav || !('IntersectionObserver' in window)) return;
    const links = $$('a', nav);
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        const a = links.find((l) => l.getAttribute('href') === `#${en.target.id}`);
        if (a) a.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    $$('.legal-body [id]').forEach((s) => obs.observe(s));
  }

  /* ---------- Help Centre ---------- */
  const TOPICS = [
    { id: 'start', title: 'Getting Started', text: 'Learn how to use HAUnapin Natin ’Yan! for the first time.', icon: 'building', tone: 'is-gold' },
    { id: 'report', title: 'Reporting Items', text: 'Step-by-step guides on posting lost or found items.', icon: 'reset', tone: 'is-rose' },
    { id: 'claim', title: 'Claiming Items', text: 'Verifying ownership and collecting your item.', icon: 'box', tone: 'is-green' },
    { id: 'account', title: 'Account & Security', text: 'Manage your profile and stay safe in the community.', icon: 'user', tone: 'is-grey' },
  ];
  function help() {
    const cards = $('#helpCards');
    if (!cards) return;
    cards.innerHTML = TOPICS.map((t) => `<section class="card help-card" aria-labelledby="ht-${t.id}">
      <span class="tile ${t.tone}">${icon(t.icon)}</span>
      <h2 id="ht-${t.id}">${esc(t.title)}</h2><p>${esc(t.text)}</p>
      <ul class="list-reset" role="list">${HELP.filter((h) => h.topic === t.id).map((h) => `<li><a href="#a-${h.id}" data-open="${h.id}">${esc(h.title)}</a></li>`).join('')}</ul>
    </section>`).join('');
    const arts = $('#helpArticles');
    const all = [...HELP.map((h) => ({ ...h, kind: 'Guide' })), ...FAQ.map((f, i) => ({ id: `faq${i}`, title: f.q, body: f.a, kind: 'FAQ' }))];
    arts.innerHTML = `<h2 class="h-sans" id="artTitle">Guides &amp; FAQs</h2>` + all.map((a) => `<details class="faq-item is-light" id="a-${a.id}" data-text="${esc(`${a.title} ${a.body}`.toLowerCase())}">
      <summary>${icon('help')}<span>${esc(a.title)}</span><small class="kind">${a.kind}</small>${icon('chevronDown', 'icon chev')}</summary><p>${esc(a.body)}</p></details>`).join('')
      + '<p class="empty-line" id="helpEmpty" hidden>No articles match that search. Try different words, or send us a message below.</p>';
    cards.addEventListener('click', (e) => {
      const a = e.target.closest('[data-open]');
      if (!a) return;
      const d = $(`#a-${a.dataset.open}`);
      if (d) { d.open = true; setTimeout(() => $('summary', d).focus({ preventScroll: true }), 0); }
    });
    const q = $('#helpQ');
    const run = () => {
      const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let n = 0;
      $$('#helpArticles details').forEach((d) => {
        const hit = words.every((w) => d.dataset.text.includes(w));
        d.hidden = !hit;
        if (hit) n++;
        d.open = Boolean(words.length && hit && n <= 3);
      });
      $('#helpEmpty').hidden = n > 0;
      $('#helpCount').textContent = words.length ? `${n} article${n === 1 ? '' : 's'} found` : '';
    };
    q.addEventListener('input', run);
    $('#helpSearch').addEventListener('submit', (e) => { e.preventDefault(); run(); $('#artTitle').scrollIntoView({ behavior: ui.prefersReducedMotion() ? 'auto' : 'smooth' }); });
    const pre = ui.params().get('q');
    if (pre) { q.value = pre; run(); }
    $('#securityInfo').innerHTML = `
      <div><span class="tile is-white">${icon('pin')}</span><span><b>Security Office</b><small>${esc(CONTACT.securityOffice.replace('Security Office, ', ''))}</small></span></div>
      <div><span class="tile is-white">${icon('calendar')}</span><span><b>Operating hours</b><small>${esc(CONTACT.hours)}</small></span></div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    faq(); about(); messageForms(); stories(); safety(); legal(); help();
  });
}(window.HNY));
