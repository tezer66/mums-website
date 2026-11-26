/*
  HarperHolistic member accounts, through Memberstack
  ===================================================
  Memberstack (memberstack.com) handles sign-up, sign-in, passwords and the paid
  plans, and takes payment with Stripe. The app ID and the plan/price IDs live in
  content/site.js ("memberstack").

  Everything a member creates on the site (their daily card and journal) is kept in their
  Memberstack "member JSON", so it follows them to any device.

  app.js only uses the functions returned at the bottom of this file.
*/
window.HHAuth = (function () {
  'use strict';

  var SITE = window.HH_SITE || {};
  var CFG = SITE.memberstack || {};

  // Device storage that never throws (private windows, blocked storage).
  var memory = {};
  var local = {
    get: function (k) {
      try { var v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
      return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null;
    },
    set: function (k, v) { memory[k] = v; try { localStorage.setItem(k, v); } catch (e) {} },
    remove: function (k) { delete memory[k]; try { localStorage.removeItem(k); } catch (e) {} }
  };
  function localKeys() {
    var out = Object.keys(memory);
    try { for (var i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) {}
    return out.filter(function (k, i, a) { return a.indexOf(k) === i; });
  }

  var ms = null;          // window.$memberstackDom
  var member = null;      // the signed-in Memberstack member
  var json = null;        // their member JSON
  var readyPromise = null;

  /* ---------- keeping member data in step with Memberstack ---------- */
  // Keys the app saves end with ":" + the member's email, e.g. "hh:journal:ann@x.com".
  // In the member JSON they are saved without the email, under "site".
  function emailOf() { return member && member.auth && member.auth.email ? member.auth.email.toLowerCase() : ''; }
  function memberKey(k) {
    var e = emailOf(), tail = ':' + e;
    return e && k.indexOf('hh:') === 0 && k.slice(-tail.length) === tail ? k.slice(0, -tail.length) : null;
  }
  function parse(v) { try { return JSON.parse(v); } catch (e) { return v; } }
  function text(v) { return typeof v === 'string' ? v : JSON.stringify(v); }

  var pushTimer = null, pushing = Promise.resolve();
  function pushSoon() { clearTimeout(pushTimer); pushTimer = setTimeout(push, 1200); }
  function push() {
    clearTimeout(pushTimer); pushTimer = null;
    if (!ms || !member || !json) return pushing;
    var body = JSON.parse(JSON.stringify(json));
    pushing = pushing.then(function () { return ms.updateMemberJSON({ json: body }); })
      .catch(function (e) { console.warn('[HarperHolistic] Could not save to your account yet', e); });
    return pushing;
  }
  window.addEventListener('pagehide', function () { if (pushTimer) push(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && pushTimer) push(); });

  // Copy the member's saved data onto this device (their account wins).
  function hydrate() {
    var e = emailOf(); if (!e) return;
    json = json && typeof json === 'object' ? json : {};
    json.site = json.site && typeof json.site === 'object' ? json.site : {};
    var changed = false;
    // Anything saved on this device but not yet in their account is sent up.
    localKeys().forEach(function (k) {
      var mk = memberKey(k);
      if (mk && !(mk in json.site)) { json.site[mk] = parse(local.get(k)); changed = true; }
    });
    Object.keys(json.site).forEach(function (mk) { local.set(mk + ':' + e, text(json.site[mk])); });
    if (changed) pushSoon();
  }

  // The storage app.js uses: device storage, mirrored to the member's account.
  var store = {
    get: local.get,
    set: function (k, v) {
      local.set(k, v);
      var mk = memberKey(k);
      if (mk && json) { json.site[mk] = parse(v); pushSoon(); }
    },
    remove: function (k) {
      local.remove(k);
      var mk = memberKey(k);
      if (mk && json && mk in json.site) { delete json.site[mk]; pushSoon(); }
    },
    getJSON: function (k, fallback) { try { var v = this.get(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    setJSON: function (k, v) { this.set(k, JSON.stringify(v)); }
  };

  /* ---------- Memberstack ---------- */
  function waitForMemberstack() {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function check() {
        if (window.$memberstackDom) return resolve(window.$memberstackDom);
        if (Date.now() - t0 > 10000) return resolve(null);
        setTimeout(check, 50);
      })();
    });
  }
  function loadMember() {
    return ms.getCurrentMember().then(function (r) {
      member = r && r.data ? r.data : null;
      if (!member) { json = null; return null; }
      return ms.getMemberJSON().then(function (j) { json = (j && j.data) || {}; }, function () { json = {}; })
        .then(function () { hydrate(); return member; });
    });
  }
  // "Keep me signed in" unticked: sign out when the browser is closed.
  var TAB_FLAG = 'hh:tab-session', SHORT_FLAG = 'hh:short-session';
  function tabAlive() { try { return sessionStorage.getItem(TAB_FLAG) === '1'; } catch (e) { return false; } }
  function markSession(keep) {
    if (keep) local.remove(SHORT_FLAG); else local.set(SHORT_FLAG, '1');
    try { sessionStorage.setItem(TAB_FLAG, '1'); } catch (e) {}
  }

  function ready() {
    if (readyPromise) return readyPromise;
    readyPromise = waitForMemberstack().then(function (dom) {
      ms = dom;
      if (!ms) { console.warn('[HarperHolistic] Memberstack did not load'); return null; }
      return loadMember().then(function (m) {
        if (m && local.get(SHORT_FLAG) === '1' && !tabAlive()) {
          return ms.logout().catch(function () {}).then(function () { member = null; json = null; local.remove(SHORT_FLAG); return null; });
        }
        if (m) { try { sessionStorage.setItem(TAB_FLAG, '1'); } catch (e) {} }
        return m;
      });
    }).catch(function (e) { console.warn('[HarperHolistic] Could not check sign-in', e); return null; });
    return readyPromise;
  }
  function refresh() { return ms ? loadMember().catch(function () { return member; }) : Promise.resolve(null); }

  function nicer(err, fallback) {
    var m = (err && (err.message || (err.data && err.data.message))) || '';
    if (/already|exists|taken/i.test(m)) return 'There is already an account for this email. Try signing in.';
    if (/invalid|incorrect|wrong|not found|credentials/i.test(m) && /password|email|credential|member/i.test(m)) return 'That email and password do not match an account. Please try again, or begin your journey by joining first.';
    return m || fallback;
  }
  function need() { if (!ms) throw new Error('Sign-in is not available right now. Please check your connection and try again.'); }

  /* ---------- plans ---------- */
  var ACTIVE = ['ACTIVE', 'TRIALING', 'PAST_DUE'];
  function planOf(m) {
    var plans = CFG.plans || {}, found = null;
    (m && m.planConnections || []).forEach(function (pc) {
      if (ACTIVE.indexOf(pc.status) < 0) return;
      Object.keys(plans).forEach(function (name) {
        if (plans[name].planId === pc.planId && (!found || name.indexOf('all-') === 0)) found = name;
      });
    });
    return found;
  }

  /* ---------- the functions app.js uses ---------- */
  function signUp(name, email, password, plan, keep) {
    name = String(name || '').trim(); email = String(email || '').trim().toLowerCase();
    if (!name) return Promise.reject(new Error('Please enter your first name.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Promise.reject(new Error('Please enter a valid email address.'));
    if (String(password || '').length < 8) return Promise.reject(new Error('Choose a password with at least 8 characters.'));
    return ready().then(function () {
      need();
      return ms.signupMemberEmailPassword({ email: email, password: password, customFields: { 'first-name': name } });
    }).then(function () {
      markSession(keep);
      return loadMember();
    }).then(function () { return current(); }, function (err) { throw new Error(nicer(err, 'We could not create your account. Please try again.')); });
  }

  function signIn(email, password, keep) {
    email = String(email || '').trim().toLowerCase();
    if (!email || !password) return Promise.reject(new Error('Please enter the email and password you chose when you joined.'));
    return ready().then(function () {
      need();
      return ms.loginMemberEmailPassword({ email: email, password: password });
    }).then(function () {
      markSession(keep);
      return loadMember();
    }).then(function () { return current(); }, function (err) { throw new Error(nicer(err, 'We could not sign you in. Please try again.')); });
  }

  function signOut() {
    var done = push();
    member = null; json = null; local.remove(SHORT_FLAG);
    return done.then(function () { return ms ? ms.logout() : null; }).catch(function () {});
  }

  function current() {
    if (!member) return null;
    var cf = member.customFields || {};
    var e = emailOf();
    return { name: cf['first-name'] || e.split('@')[0], email: e, plan: planOf(member), id: member.id };
  }

  // Send the member to Stripe checkout (through Memberstack) for a plan.
  function checkout(plan, opts) {
    opts = opts || {};
    var price = CFG.plans && CFG.plans[plan] && CFG.plans[plan].priceId;
    var base = location.origin + location.pathname;
    return ready().then(function () {
      need();
      if (!price) throw new Error('That plan is not available right now.');
      return push();
    }).then(function () {
      return ms.purchasePlansWithCheckout({
        priceId: price,
        successUrl: base + (opts.success || '#home-deck'),
        cancelUrl: base + (opts.cancel || '#join'),
        autoRedirect: true
      });
    }).catch(function (err) { throw new Error(nicer(err, 'We could not open the secure checkout. Please try again.')); });
  }

  // Stripe's page where members change plan, update their card or cancel.
  function manageBilling() {
    return ready().then(function () {
      need();
      return ms.launchStripeCustomerPortal({ returnUrl: location.href, autoRedirect: true });
    }).catch(function (err) { throw new Error(nicer(err, 'We could not open your subscription settings. Please try again.')); });
  }

  // Forgotten password: Memberstack emails a code, then the member chooses a new password.
  function sendReset(email) {
    return ready().then(function () { need(); return ms.sendMemberResetPasswordEmail({ email: String(email || '').trim().toLowerCase() }); })
      .catch(function (err) { throw new Error(nicer(err, 'We could not send the email. Check the address and try again.')); });
  }
  function resetPassword(code, newPassword) {
    if (String(newPassword || '').length < 8) return Promise.reject(new Error('Choose a password with at least 8 characters.'));
    return ready().then(function () { need(); return ms.resetMemberPassword({ token: String(code || '').trim(), newPassword: newPassword }); })
      .catch(function (err) { throw new Error(nicer(err, 'That code did not work. Check the email and try again.')); });
  }

  /* Monthly newsletter: kept in the member JSON ("newsletter": true) and, if Gillian has made a
     custom field called "newsletter" in Memberstack, there too, so she can export the list. */
  function setNewsletter(on) {
    if (!json) return Promise.resolve();
    json.newsletter = !!on;
    var p = push();
    if (ms && ms.updateMember) ms.updateMember({ customFields: { newsletter: on ? 'yes' : 'no' } }).catch(function () {});
    return p;
  }

  /* "Pay full price and give back": 20% of every payment from this member is donated. Kept in the
     member JSON ("giveBack": true) and in a Memberstack custom field "give-back" (yes/no), so Gillian
     can filter members and add up what to donate. */
  function setGiveBack(on) {
    if (!json) return Promise.resolve();
    json.giveBack = !!on;
    var p = push();
    if (ms && ms.updateMember) ms.updateMember({ customFields: { 'give-back': on ? 'yes' : 'no' } }).catch(function () {});
    return p;
  }

  // Permanently delete the signed-in member (required by Apple and Google for apps with accounts).
  function deleteAccount() {
    return ready().then(function () {
      need();
      return ms.deleteMember();
    }).then(function () {
      member = null; json = null; local.remove(SHORT_FLAG);
      return ms.logout ? ms.logout().catch(function () {}) : null;
    }).catch(function (err) { throw new Error(nicer(err, 'We could not delete your account. Please email Gill and she will do it for you.')); });
  }

  return { deleteAccount: deleteAccount, ready: ready, refresh: refresh, signUp: signUp, signIn: signIn, signOut: signOut, current: current,
           checkout: checkout, manageBilling: manageBilling, setNewsletter: setNewsletter, setGiveBack: setGiveBack, sendReset: sendReset, resetPassword: resetPassword,
           store: store };
})();
