/* Log in, sign up and forgot-password pages */
(function (HNY) {
  'use strict';

  const { auth, ui, icon } = HNY;
  const { $, $$ } = ui;

  function setErr(id, msg) {
    const el = $(`#${id}Err`);
    if (el) el.textContent = msg;
    const f = $(`#${id}`);
    if (f) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  const focusBad = (form) => { const bad = $('[aria-invalid="true"]', form); if (bad) bad.focus(); };
  function alertBox(id, msg) { const a = $(`#${id}`); a.textContent = msg; a.hidden = !msg; }

  // Only allow redirects back into this site
  function nextUrl() {
    const n = ui.params().get('next') || '';
    // Only pages on this site, and never back to the login/sign-up pages themselves (avoids loops)
    return /^[\w-]+\.html([?#].*)?$/.test(n) && !/^(login|signup|forgot)\.html/.test(n) ? n : 'profile.html';
  }

  function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/\d/.test(pw)) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/[^\w]/.test(pw) || pw.length >= 12) s++;
    return s;
  }

  function wirePasswordToggles() {
    $$('[data-pw]').forEach((b) => b.addEventListener('click', () => {
      const input = $(`#${b.dataset.pw}`);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(show));
      b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      b.innerHTML = icon(show ? 'eyeOff' : 'eye');
    }));
  }

  // Warn when Caps Lock is on while typing a password
  function wireCapsLock() {
    $$('.pw-wrap input').forEach((input) => {
      const hint = document.createElement('p');
      hint.className = 'caps-hint'; hint.id = `${input.id}Caps`; hint.hidden = true; hint.setAttribute('aria-live', 'polite');
      hint.innerHTML = `${icon('alert')}Caps Lock is on`;
      input.closest('.field').appendChild(hint);
      input.setAttribute('aria-describedby', `${input.getAttribute('aria-describedby') || ''} ${hint.id}`.trim());
      const check = (e) => { if (e.getModifierState) hint.hidden = !e.getModifierState('CapsLock'); };
      input.addEventListener('keydown', check);
      input.addEventListener('keyup', check);
      input.addEventListener('blur', () => { hint.hidden = true; });
    });
  }

  function wireSocial() {
    $$('[data-social]').forEach((b) => b.addEventListener('click', () => {
      ui.toast(`${b.dataset.social} sign-in needs a live server. In this demo, use your HAU email instead.`);
    }));
  }

  function clearOnInput(form) {
    form.addEventListener('input', (e) => { if (e.target.id) setErr(e.target.id, ''); });
  }

  /* ---------- login ---------- */
  function initLogin() {
    const form = $('#loginForm');
    if (!form) return;
    // Already logged in: never redirect away on our own (that caused the jump back to the home page).
    // Show who is logged in and let the person choose.
    const me = auth.current();
    if (me) {
      form.hidden = true;
      form.insertAdjacentHTML('beforebegin', `<div class="already-in" role="status"><p>You’re already logged in as <b>${ui.esc(me.name)}</b> (${ui.esc(me.email)}).</p>
        <div class="cluster"><button type="button" class="btn btn-primary btn-lg" id="continueBtn">Continue${icon('arrowRight')}</button>
        <button type="button" class="btn btn-outline btn-lg" id="switchBtn">Log out and use another account</button></div></div>`);
      $('#continueBtn').addEventListener('click', () => HNY.go(nextUrl()));
      $('#switchBtn').addEventListener('click', () => {
        auth.logOut();
        $('.already-in').remove();
        form.hidden = false;
        $('#lEmail').value = me.email;
        $('#lPass').focus();
      });
      return;
    }
    clearOnInput(form);
    if (!$('#lEmail').value) { const last = auth.lastEmail(); if (last) { $('#lEmail').value = last; } }
    const email = ui.params().get('email');
    if (email) $('#lEmail').value = email;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox('loginAlert', '');
      const em = $('#lEmail').value.trim();
      const pw = $('#lPass').value;
      const ok = [
        setErr('lEmail', auth.HAU_EMAIL.test(em) ? '' : 'Enter your HAU email, ending in @hau.edu.ph.'),
        setErr('lPass', pw ? '' : 'Enter your password.'),
      ].every(Boolean);
      if (!ok) { focusBad(form); return; }
      const btn = $('#loginForm button[type=submit]');
      btn.disabled = true; btn.setAttribute('aria-busy', 'true');
      const res = await auth.logIn(em, pw, $('#lRemember').checked);
      btn.disabled = false; btn.removeAttribute('aria-busy');
      if (!res.ok) { alertBox('loginAlert', res.msg); $('#lPass').value = ''; $('#lPass').focus(); return; }
      try { sessionStorage.setItem('hny_welcome', '1'); } catch { /* ignore */ }
      HNY.go(nextUrl());
    });
  }

  /* ---------- sign up ---------- */
  function initSignup() {
    const form = $('#signupForm');
    if (!form) return;
    if (auth.current()) { HNY.go('profile.html', { replace: true }); return; }
    clearOnInput(form);
    $('#uPass').addEventListener('input', (e) => {
      const s = strength(e.target.value);
      const bar = $('#pwBar');
      bar.style.width = `${s * 25}%`;
      bar.dataset.level = String(s);
      $('#pwHint').textContent = ['At least 8 characters, with a number.', 'Weak: add more characters or a number.', 'Okay: mix upper and lower case to make it stronger.', 'Good password.', 'Strong password.'][s];
    });
    form.addEventListener('change', (e) => { if (e.target.id === 'uAgree') setErr('uAgree', ''); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox('signupAlert', '');
      const name = $('#uName').value.trim();
      const em = $('#uEmail').value.trim();
      const sn = $('#uStudent').value.trim();
      const pw = $('#uPass').value;
      const pw2 = $('#uPass2').value;
      const ok = [
        setErr('uName', name.length >= 2 && /\s/.test(name) ? '' : 'Enter your first and last name.'),
        setErr('uEmail', auth.HAU_EMAIL.test(em) ? '' : 'Use your HAU email, ending in @hau.edu.ph.'),
        setErr('uStudent', !sn || /^\d{4}-?\d{5}$/.test(sn) ? '' : 'Student numbers look like 2023-12345.'),
        setErr('uPass', pw.length >= 8 && /\d/.test(pw) ? '' : 'Use at least 8 characters, including a number.'),
        setErr('uPass2', pw2 && pw2 === pw ? '' : 'The passwords don’t match.'),
        setErr('uAgree', $('#uAgree').checked ? '' : 'Please agree to the terms to continue.'),
      ].every(Boolean);
      if (!ok) { focusBad(form); return; }
      const res = await auth.signUp({ name, email: em, studentNo: sn, password: pw });
      if (!res.ok) { setErr('uEmail', res.msg); $('#uEmail').focus(); return; }
      HNY.go('profile.html?welcome=1');
    });
  }

  /* ---------- forgot password ---------- */
  function initForgot() {
    const form = $('#forgotForm');
    if (!form) return;
    clearOnInput(form);
    let email = '';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      alertBox('forgotAlert', '');
      if (!email) {
        const em = $('#fEmail').value.trim();
        if (!setErr('fEmail', auth.HAU_EMAIL.test(em) ? '' : 'Enter your HAU email, ending in @hau.edu.ph.')) { focusBad(form); return; }
        if (!auth.exists(em)) { alertBox('forgotAlert', 'We couldn’t find an account with that email. Check the spelling or sign up.'); $('#fEmail').focus(); return; }
        email = em;
        const code = auth.requestReset(em);
        $('#forgotStep1').hidden = true;
        $('#forgotStep2').hidden = false;
        $('#forgotOk').innerHTML = `We’ve sent a 6-digit code to <b>${ui.esc(em)}</b>. <span class="demo-code">Demo build: no email is sent, so your code is <b>${code}</b>. It expires in 10 minutes.</span>`;
        $('#forgotOk').focus();
        return;
      }
      const pw = $('#fNew').value;
      const ok = [
        setErr('fCode', /^\d{6}$/.test($('#fCode').value.trim()) ? '' : 'Enter the 6-digit code.'),
        setErr('fNew', pw.length >= 8 && /\d/.test(pw) ? '' : 'Use at least 8 characters, including a number.'),
        setErr('fNew2', $('#fNew2').value === pw && pw ? '' : 'The passwords don’t match.'),
      ].every(Boolean);
      if (!ok) { focusBad(form); return; }
      const res = await auth.resetPassword(email, $('#fCode').value, pw);
      if (!res.ok) { setErr('fCode', res.msg || 'Something went wrong. Try again.'); $('#fCode').focus(); return; }
      HNY.go(`login.html?email=${encodeURIComponent(email)}&reset=1`);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wirePasswordToggles();
    wireCapsLock();
    wireSocial();
    initLogin();
    initSignup();
    initForgot();
    if (ui.params().get('reset')) { const a = $('#loginAlert'); if (a) { a.textContent = 'Password updated. Log in with your new password.'; a.hidden = false; a.classList.add('is-ok'); } }
  });
}(window.HNY));
