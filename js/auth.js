/*
  HarperHolistic member accounts: PREVIEW VERSION
  ===============================================
  This keeps accounts and card history in the visitor's own browser so the
  site can be tried before a membership service is chosen. It does NOT
  protect content and does not work across devices.

  Before going live, replace the body of signUp / signIn / signOut / current
  with calls to a real membership service (for example Memberstack, Outseta,
  Supabase Auth or a WordPress membership plugin) and save each member's
  draws on the server. app.js only uses the five functions exported below,
  so nothing else needs to change.
*/
window.HHAuth = (function () {
  'use strict';

  // Storage that never throws (private windows, blocked storage).
  var memory = {};
  var store = {
    get: function (k) {
      try { var v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
      return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null;
    },
    set: function (k, v) { memory[k] = v; try { localStorage.setItem(k, v); } catch (e) {} },
    remove: function (k) { delete memory[k]; try { localStorage.removeItem(k); } catch (e) {} },
    getJSON: function (k, fallback) { try { var v = this.get(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    setJSON: function (k, v) { this.set(k, JSON.stringify(v)); }
  };

  function hash(text) {
    try {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode('hh:' + text)).then(function (buf) {
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      }).catch(fallbackHash.bind(null, text));
    } catch (e) { return Promise.resolve(fallbackHash(text)); }
  }
  function fallbackHash(text) {
    var h = 5381; for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return 'f' + (h >>> 0).toString(16);
  }
  // Signed-in session: kept on the device only when "Keep me signed in" is ticked,
  // otherwise it ends when the browser is closed.
  var tabMemory = {};
  function setSession(email, keep) {
    clearSession();
    if (keep) store.set('hh:session', email);
    else { tabMemory.s = email; try { sessionStorage.setItem('hh:session', email); } catch (e) {} }
  }
  function getSession() {
    try { var v = sessionStorage.getItem('hh:session'); if (v) return v; } catch (e) {}
    return tabMemory.s || store.get('hh:session');
  }
  function clearSession() {
    delete tabMemory.s;
    try { sessionStorage.removeItem('hh:session'); } catch (e) {}
    store.remove('hh:session');
  }

  function users() { return store.getJSON('hh:users', {}); }
  function clean(email) { return String(email || '').trim().toLowerCase(); }

  function signUp(name, email, password, plan, keep) {
    name = String(name || '').trim(); email = clean(email);
    if (!name) return Promise.reject(new Error('Please enter your first name.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Promise.reject(new Error('Please enter a valid email address.'));
    if (String(password || '').length < 6) return Promise.reject(new Error('Choose a password with at least 6 characters.'));
    var all = users();
    if (all[email]) return Promise.reject(new Error('There is already an account for this email. Try signing in.'));
    return hash(password).then(function (h) {
      all[email] = { name: name, pass: h, plan: ['deck-monthly', 'all-monthly', 'deck-yearly', 'all-yearly'].indexOf(plan) >= 0 ? plan : 'all-yearly', joined: new Date().toISOString() };
      store.setJSON('hh:users', all);
      setSession(email, keep);
      return { name: name, email: email };
    });
  }

  function signIn(email, password, keep) {
    email = clean(email);
    var u = users()[email];
    if (!email || !password) return Promise.reject(new Error('Please enter the email and password you chose when you joined.'));
    if (!u || u.demo) return Promise.reject(new Error('We could not find an account for that email. Check the spelling, or become a member first.'));
    return hash(password).then(function (h) {
      if (h !== u.pass) throw new Error('That password does not match. Please try again.');
      setSession(email, keep);
      return { name: u.name, email: email };
    });
  }

  function signOut() { clearSession(); }

  function current() {
    var email = getSession();
    if (!email) return null;
    var u = users()[email];
    if (u && u.demo) { clearSession(); return null; }
    return u ? { name: u.name, email: email, plan: u.plan || 'all-yearly' } : null;
  }

  /*
    Member profile ("Tell Gillian about you") and Gillian's personal notes.
    PREVIEW: saved in this browser only, so Gillian cannot see them yet.
    LIVE: send the profile to the membership service's custom fields (or a form
    service that emails Gillian), and load notes she has written from there.
  */
  function getProfile(email) { return store.getJSON('hh:profile:' + email, null); }
  function saveProfile(email, profile) {
    profile.updated = new Date().toISOString();
    store.setJSON('hh:profile:' + email, profile);
    return Promise.resolve(profile);
  }
  function getNotes(email) { return Promise.resolve(store.getJSON('hh:notes:' + email, [])); }

  return { signUp: signUp, signIn: signIn, signOut: signOut, current: current, store: store,
           getProfile: getProfile, saveProfile: saveProfile, getNotes: getNotes };
})();
