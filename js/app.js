/* HarperHolistic: site behaviour (routing, daily draw, shuffle, reading, history, viewer) */
(function () {
  'use strict';

  /* Card decks. Each deck page is the same dashboard, filled from its own deck file.
     The key is the page's address: #dashboard and #earth-magick. */
  var BOUNDARIES = window.HH_DECK;
  BOUNDARIES.id = BOUNDARIES.id || 'boundaries';
  BOUNDARIES.ratio = BOUNDARIES.ratio || [4, 5];
  BOUNDARIES.hasGuidebook = true;
  var DECKS = { dashboard: BOUNDARIES };
  if (window.HH_EARTH_DECK) DECKS['earth-magick'] = window.HH_EARTH_DECK;
  if (window.HH_CANCER_DECK) DECKS['cancer-care'] = window.HH_CANCER_DECK;
  Object.keys(DECKS).forEach(function (route) {
    var d = DECKS[route];
    d.route = route;
    d.ratio = d.ratio || [4, 5];
    d.cards.forEach(function (c) { c.deck = d; });
  });
  var DECK = BOUNDARIES;   // the deck on screen
  function applyRatio(el, deck) {
    var r = deck.ratio;
    el.style.setProperty('--ar', r[0] + ' / ' + r[1]);
    el.style.setProperty('--arw', String(r[0] / r[1]));
    el.style.setProperty('--arh', String(r[1] / r[0]));
  }
  var SITE = window.HH_SITE;
  var Auth = window.HHAuth;
  var store = Auth.store;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------------- dates ---------------- */
  function pad(n) { return String(n).padStart(2, '0'); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  /* A "card day" starts at 5am on the member's own clock (their phone's or computer's
     time zone). Before 5am it is still the previous card day. */
  var DAY_START_HOUR = 5;
  function cardDay(now) {
    var d = new Date((now || new Date()).getTime() - DAY_START_HOUR * 3600e3);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  function daysAgo(n) { var d = cardDay(); d.setDate(d.getDate() - n); return d; }
  function nextCardTime() {
    var d = new Date(); var t = new Date(d); t.setHours(DAY_START_HOUR, 0, 0, 0);
    if (t <= d) t.setDate(t.getDate() + 1);
    return t;
  }
  function untilNext() {
    var ms = nextCardTime() - new Date(), h = Math.floor(ms / 3600e3), m = Math.ceil((ms % 3600e3) / 60e3);
    if (m === 60) { h++; m = 0; }
    return (h ? h + (h === 1 ? ' hour' : ' hours') : '') + (h && m ? ' ' : '') + (m || !h ? m + (m === 1 ? ' minute' : ' minutes') : '');
  }
  function dayIndex(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
  function longDate(d) { return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); }

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function cardByNumber(n) { for (var i = 0; i < DECK.cards.length; i++) if (DECK.cards[i].n === n) return DECK.cards[i]; return null; }
  function randomInt(max) {
    try { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % max; } catch (e) { return Math.floor(Math.random() * max); }
  }
  function cardLabel(card) { return 'Card ' + card.n + (card.title || card.message ? ': ' + (card.title || card.message) : ''); }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function paras(list) { return (list || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }

  /* A card face: the artwork if there is an image, otherwise the message set in the deck's frame. */
  function renderFace(card, lazy) {
    if (card.image) {
      var img = new Image();
      img.src = card.image;
      img.alt = cardLabel(card);
      img.className = 'face-img';
      img.decoding = 'async';
      img.draggable = false;
      if (lazy) img.loading = 'lazy';
      return img;
    }
    var el = document.createElement('div');
    el.className = 'face-text';
    el.style.backgroundImage = 'url("' + card.deck.blankFrame + '")';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', cardLabel(card));
    el.innerHTML =
      '<span class="ft-num">' + card.n + '</span>' +
      (card.message
        ? '<span class="ft-msg' + (card.message.length > 95 ? ' is-long' : '') + '">' + esc(card.message) + '</span>'
        : '<span class="ft-msg is-empty">Card message to be added</span>') +
      '<span class="ft-sec">' + esc(card.section || card.deck.name) + '</span>';
    return el;
  }


  /* ---------------- full-screen viewer ---------------- */
  var lb = $('#lightbox'), lbCard = $('#lbCard'), lastFocus = null;

  function openViewer(card) {
    lastFocus = document.activeElement;
    lbCard.innerHTML = '';
    lbCard.style.transform = '';
    applyRatio(lb, card.deck);
    lbCard.appendChild(renderFace(card));
    lb.hidden = false;
    document.body.classList.add('lb-open');
    // Real full screen where the phone allows it (Android, desktop). iPhone uses the overlay.
    try { if (lb.requestFullscreen) lb.requestFullscreen({ navigationUI: 'hide' }).catch(function () {}); } catch (e) {}
    $('#lbClose').focus({ preventScroll: true });
  }
  function closeViewer() {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    try { if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  (function wireViewer() {
    var startY = null, dy = 0;
    lb.addEventListener('pointerdown', function (e) { startY = e.clientY; dy = 0; });
    lb.addEventListener('pointermove', function (e) {
      if (startY === null) return;
      dy = Math.max(0, e.clientY - startY);
      lbCard.style.transform = 'translateY(' + dy + 'px)';
      lbCard.style.opacity = String(1 - Math.min(dy / 400, .6));
    });
    lb.addEventListener('pointerup', function () {
      if (startY === null) return;
      startY = null;
      lbCard.style.opacity = '';
      if (dy > 90 || dy < 8) closeViewer(); // swipe down, or a simple tap
      else lbCard.style.transform = '';
    });
    lb.addEventListener('pointercancel', function () { startY = null; lbCard.style.transform = ''; lbCard.style.opacity = ''; });
    $('#lbClose').addEventListener('click', function (e) { e.stopPropagation(); closeViewer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeViewer(); });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && !lb.hidden) closeViewer(); });
  })();

  /* ---------------- home ---------------- */
  function initHome() {
    var row = $('#showcase');
    row.innerHTML = '';
    BOUNDARIES.cards.filter(function (c) { return c.image; }).slice(0, 4).forEach(function (card) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'thumb-btn';
      b.setAttribute('aria-label', 'Enlarge ' + cardLabel(card));
      b.appendChild(renderFace(card));
      b.addEventListener('click', function () { openViewer(card); });
      row.appendChild(b);
    });
    $('#about').innerHTML = paras(SITE.about);
    // Homepage video: plays silently on a loop; the button turns sound on and off.
    var vid = $('#hpVideo'), snd = $('#hpSound');
    if (vid && snd) {
      if (reduceMotion) { vid.removeAttribute('autoplay'); vid.pause(); vid.controls = true; }
      snd.addEventListener('click', function () {
        vid.muted = !vid.muted;
        if (!vid.muted) { vid.currentTime = 0; var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }
        snd.setAttribute('aria-pressed', String(!vid.muted));
        snd.setAttribute('aria-label', vid.muted ? 'Turn sound on' : 'Turn sound off');
      });
    }
    // Share the card video to Instagram, Facebook, TikTok, WhatsApp... through the phone's share menu.
    var shareBtn = $('#shareVideo'), shareNote = $('#shareNote');
    if (shareBtn) shareBtn.addEventListener('click', function () {
      var url = 'media/harperholistic-share.mp4', name = 'HarperHolistic-cards.mp4';
      var text = 'Which card resonates with you today? Healing Inspiration Cards by Gillian Harper @harper.holistic www.harperholistic.com';
      var note = function (t) { shareNote.textContent = t; };
      var saveFile = function (blob) {
        try {
          var href = blob ? URL.createObjectURL(blob) : url;
          var a = document.createElement('a'); a.href = href; a.download = name;
          document.body.appendChild(a); a.click(); a.remove();
          if (blob) setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
          note('Video saved. Open Instagram, Facebook or TikTok and choose it from your photos or files. Tag @harper.holistic.');
        } catch (err) { note('Your browser blocked the download. Press and hold the video to save it instead.'); }
      };
      shareBtn.disabled = true; note('Getting the video ready…');
      fetch(url).then(function (r) { if (!r.ok) throw new Error(); return r.blob(); }).then(function (blob) {
        shareBtn.disabled = false;
        var file = null;
        try { file = new File([blob], name, { type: 'video/mp4' }); } catch (e) {}
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          note('');
          return navigator.share({ files: [file], title: 'HarperHolistic', text: text })
            .then(function () { note('Thank you for sharing \u2661'); })
            .catch(function (err) { if (!err || err.name !== 'AbortError') saveFile(blob); });
        }
        saveFile(blob);
      }).catch(function () { shareBtn.disabled = false; saveFile(null); });
    });

    // Quotes band: Gillian's own words, one at a time.
    var quotes = ['Your voice does not belong to those who told you to stay silent.', 'Boundaries are the clearest expression of Love you hold for yourself.',
      'Please take what resonates and leave what does not.', 'It’s never one incident that makes you say “No more!”, it happens after years of “keeping the peace”.',
      'These cards are for the days when your healing journey feels heavy. Keep going! You’ve got this x'].filter(Boolean);
    var qi = 0, qEl = $('#hpQuote');
    var showQ = function () { qEl.textContent = '“' + quotes[qi] + '”'; };
    if (qEl) {
      showQ();
      $('#hpPrev').addEventListener('click', function () { qi = (qi + quotes.length - 1) % quotes.length; showQ(); });
      $('#hpNext').addEventListener('click', function () { qi = (qi + 1) % quotes.length; showQ(); });
    }
    $('#aboutSignoff').textContent = SITE.aboutSignoff || '';
    $('#tagline').textContent = SITE.tagline ? '“' + SITE.tagline + '”' : '';
    document.querySelectorAll('a[href="#hp-decks"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); $('#hp-decks').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }); });
    var c = SITE.connect || {};
    $('#connectText').textContent = c.text || '';
    var ig = $('#igLink');
    $('#igText').textContent = 'Instagram @' + c.instagram;
    ig.href = 'https://www.instagram.com/' + encodeURIComponent(c.instagram) + '/';
    $('#emailText').textContent = c.email || '';
    $('#copyEmail').addEventListener('click', function () {
      var btn = this;
      var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); };
      var fallback = function () { var r = document.createRange(); r.selectNodeContents($('#emailText')); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); };
      try { navigator.clipboard.writeText(c.email).then(done, fallback); } catch (e) { fallback(); }
    });
  }

  /* ---------------- join / sign in ---------------- */
  function setTab(which) {
    var join = which !== 'signin';
    $('#tab-join').setAttribute('aria-selected', String(join));
    $('#tab-signin').setAttribute('aria-selected', String(!join));
    $('#joinForm').hidden = !join;
    $('#signinForm').hidden = join;
  }
  function initAuthForms() {
    $('#tab-join').addEventListener('click', function () { setTab('join'); });
    $('#tab-signin').addEventListener('click', function () { setTab('signin'); });
    document.querySelectorAll('[data-tab]').forEach(function (a) {
      a.addEventListener('click', function () {
        setTab(a.getAttribute('data-tab'));
        var plan = a.getAttribute('data-plan');
        if (plan && $('#plan-' + plan)) $('#plan-' + plan).checked = true;
      });
    });

    $('#joinForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      $('#joinError').textContent = '';
      var plan = (f.querySelector('input[name="plan"]:checked') || {}).value;
      if (f.password.value !== f.password2.value) { $('#joinError').textContent = 'The two passwords do not match. Please type them again.'; return; }
      Auth.signUp(f.name.value, f.email.value, f.password.value, plan, f.keep.checked)
        .then(function () { f.reset(); $('#plan-all-yearly').checked = true; go('about-you'); })
        .catch(function (err) { $('#joinError').textContent = err.message; });
    });
    $('#signinForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      $('#signinError').textContent = '';
      Auth.signIn(f.email.value, f.password.value, f.keep.checked)
        .then(function () { f.reset(); go('dashboard'); })
        .catch(function (err) { $('#signinError').textContent = err.message; });
    });

    $('#signOutBtn').addEventListener('click', function () { Auth.signOut(); go('home'); });
  }

  /* ---------------- "Tell Gillian about you" ---------------- */
  function chipGroup(holder, name, options, type) {
    holder.innerHTML = options.map(function (o, i) {
      var id = name + '-' + i;
      return '<label class="chip-opt" for="' + id + '"><input type="' + type + '" id="' + id + '" name="' + name + '" value="' + esc(o) + '"><span>' + esc(o) + '</span></label>';
    }).join('');
  }
  function initProfileForm() {
    var q = SITE.profileQuestions || {};
    chipGroup($('#pfStage'), 'stage', q.stages || [], 'radio');
    chipGroup($('#pfAreas'), 'areas', q.areas || [], 'checkbox');
    chipGroup($('#pfContact'), 'contact', q.contact || [], 'radio');
    $('#profileForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, u = Auth.current();
      if (!u) return go('join');
      if (!f.consent.checked) { $('#profileError').textContent = 'Please tick the box so Gillian has your permission to read your answers.'; return; }
      $('#profileError').textContent = '';
      var pick = function (n) { var el = f.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ''; };
      var profile = {
        callMe: f.callMe.value.trim(), birthday: f.birthday.value.trim(), location: f.location.value.trim(),
        stage: pick('stage'),
        areas: Array.prototype.map.call(f.querySelectorAll('input[name="areas"]:checked'), function (el) { return el.value; }),
        heart: f.heart.value.trim(), hope: f.hope.value.trim(), peace: f.peace.value.trim(),
        contact: pick('contact'), consent: true
      };
      Auth.saveProfile(u.email, profile).then(function () { go('dashboard'); });
    });
  }
  function fillProfileForm() {
    var u = Auth.current(); if (!u) return;
    var f = $('#profileForm'), p = Auth.getProfile(u.email);
    var isEdit = !!p;
    f.querySelector('.eyebrow').textContent = isEdit ? 'Your answers' : 'Welcome to HarperHolistic';
    f.querySelector('button[type="submit"]').textContent = isEdit ? 'Save changes' : 'Send to Gillian';
    $('#profileSkip').textContent = isEdit ? 'Back to my cards' : 'Skip for now';
    p = p || { callMe: u.name };
    f.callMe.value = p.callMe || ''; f.birthday.value = p.birthday || ''; f.location.value = p.location || '';
    f.heart.value = p.heart || ''; f.hope.value = p.hope || ''; f.peace.value = p.peace || '';
    f.consent.checked = !!p.consent;
    f.querySelectorAll('.chip-opt input').forEach(function (el) {
      el.checked = el.name === 'areas' ? (p.areas || []).indexOf(el.value) >= 0 : p[el.name] === el.value;
    });
    $('#profileError').textContent = '';
  }
  function renderNotes() {
    var holder = $('#notesList'), u = Auth.current();
    var profile = Auth.getProfile(u.email);
    $('#profileBtn').textContent = profile ? 'Edit your answers' : 'Tell Gillian about you';
    $('#profileBtn').hidden = !profile;
    Auth.getNotes(u.email).then(function (notes) {
      if (notes && notes.length) {
        holder.innerHTML = notes.map(function (n) {
          return '<article class="note"><p class="eyebrow">' + esc(n.date || '') + '</p><p>' + esc(n.text) + '</p><p class="note-from">Love, Gill x</p></article>';
        }).join('');
      } else if (profile) {
        holder.innerHTML = '<div class="note-empty"><p>Thank you for sharing a little of yourself. When Gillian writes to you personally, her note will appear here.</p></div>';
      } else {
        holder.innerHTML = '<div class="note-empty"><p>Gillian writes personal messages for members. Answer a few gentle questions so she can get to know you.</p><a href="#about-you" class="btn btn-gold btn-sm">Tell Gillian about you</a></div>';
      }
    });
  }

  /* ---------------- draws (one card per day, per member) ---------------- */
  // Each deck keeps its own daily card and history.
  function drawsKey(email) { return DECK.id === 'boundaries' ? 'hh:draws:' + email : 'hh:draws:' + DECK.id + ':' + email; }
  // draws: { "2026-11-17": [12, 30], ... } every card chosen that day, in order
  function getDraws(email) {
    var raw = store.getJSON(drawsKey(email), {}), out = {};
    Object.keys(raw).forEach(function (k) { out[k] = [].concat(raw[k]).filter(Boolean); });
    return out;
  }
  function saveDraw(email, date, n) {
    var draws = getDraws(email), key = dayKey(date);
    (draws[key] = draws[key] || []).push(n);
    var cutoff = dayKey(daysAgo(60));
    Object.keys(draws).forEach(function (k) { if (k < cutoff) delete draws[k]; });
    store.setJSON(drawsKey(email), draws);
  }
  function pickCardFor(email) {
    var draws = getDraws(email), recent = {};
    for (var i = 0; i <= 6; i++) (draws[dayKey(daysAgo(i))] || []).forEach(function (n) { recent[n] = true; });
    var pool = DECK.cards.filter(function (c) { return !recent[c.n]; });
    if (!pool.length) pool = DECK.cards;
    return pool[randomInt(pool.length)];
  }
  function cardsOn(date) {
    return (getDraws(user.email)[dayKey(date)] || []).map(cardByNumber).filter(Boolean);
  }

  /* ---------------- dashboard ---------------- */
  var user = null;
  var selected = null; // { card, date } being shown in the reading panel
  var busy = false;

  function greeting() {
    var h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function initDashboard(deck) {
    user = Auth.current();
    if (!user) return;
    if (busy && deck !== DECK) busy = false;
    DECK = deck || BOUNDARIES;
    var today = new Date();
    $('#dashDate').textContent = longDate(today);
    $('#dashGreeting').textContent = greeting() + ', ' + user.name;
    applyRatio($('[data-view="dashboard"]'), DECK);
    $('#deckName').textContent = DECK.name;
    document.querySelectorAll('.deck-switch a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + DECK.route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var n = DECK.cards.length, secs = (DECK.sections || []).length;
    $('#libSub').textContent = DECK.hasGuidebook
      ? 'The ' + n + ' Card Deck in its ' + (secs === 5 ? 'five' : secs) + ' sections. Tap a card to read its message in the guidebook.'
      : 'All ' + n + ' cards so far. Tap a card to read Gillian’s words for it.';
    $('#guidebookSection').hidden = !DECK.hasGuidebook;
    if (DECK.hasGuidebook) renderBookletSection();
    renderNotes();
    initJournal();
    renderDeckGrid();
    showToday(false);
  }

  // One card per card day: the first card chosen is the day's card.
  function todaysCard() {
    var list = cardsOn(cardDay());
    return list.length ? list[0] : null;
  }

  /* Decide what "today" looks like: the deck ready to shuffle, or today's reading. */
  function showToday(scroll) {
    var card = todaysCard();
    if (card) {
      $('#table').hidden = true;
      $('#drawHint').textContent = 'This is the card you chose today. Sit with it, and say the affirmation out loud.';
      showReading(card, cardDay(), scroll);
    } else {
      $('#reading').hidden = true;
      $('#table').hidden = false;
      $('#drawHint').textContent = 'Breathe slowly and ask in your heart: “What do I need to hear today?” Then tap the deck to shuffle.';
      selected = null;
      buildDeck();
      if (scroll) $('#drawTitle').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    renderHistory();
  }

  function showReading(card, date, scroll) {
    var isToday = date && dayKey(date) === dayKey(cardDay());
    selected = { card: card, date: date };

    $('#readingLabel').textContent = isToday
      ? 'Today’s card, ' + longDate(date)
      : date ? 'Your card from ' + longDate(date) : 'From the deck, card ' + card.n;

    var hasToday = !!todaysCard();
    var back = $('#backToday');
    back.hidden = isToday;
    back.textContent = hasToday ? 'Back to today' : "Choose today's card";
    $('#againBox').hidden = !isToday;
    if (isToday) $('#nextCardNote').textContent = 'Your next card will be ready at 5am, in ' + untilNext() + '.';
    $('#previewReset').hidden = !(isToday && SITE.previewTools);

    // every card pulled on that day, to switch between
    var pulls = [];
    var dp = $('#dayPulls');
    dp.innerHTML = '';
    dp.hidden = pulls.length < 2;
    pulls.forEach(function (c, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Card ' + (idx + 1) + ' pulled that day: ' + cardLabel(c));
      if (c.n === card.n) b.setAttribute('aria-current', 'true');
      b.appendChild(renderFace(c, true));
      b.addEventListener('click', function () { showReading(c, date, false); });
      dp.appendChild(b);
    });

    if (!isToday) $('#table').hidden = true;

    var holder = $('#readingCard');
    holder.innerHTML = '';
    holder.appendChild(renderFace(card));
    holder.setAttribute('aria-label', 'Enlarge ' + cardLabel(card));
    holder.onclick = function () { openViewer(card); };

    renderBookletEntry(card);
    // The journal button sits at the end of the guidebook message, below the affirmation.
    var jBtn = JOURNAL_BTN;
    $('#bookletEntry').appendChild(jBtn);
    jBtn.onclick = function () { journalForCard(card, date); };
    // The card they drew today is added to the journal automatically.
    if (isToday && !jEditing && typeof setJCard === 'function') { setJCard(card); $('#jfPrompt').textContent = JPROMPTS[0]; }

    var r = $('#reading');
    r.hidden = false;
    r.style.animation = 'none'; void r.offsetWidth; r.style.animation = '';
    renderHistory();
    if (scroll) r.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function renderBookletEntry(card) {
    if (card.words) return renderWordsEntry(card);
    var b = card.booklet || {};
    var html = '<div class="be-head"><p class="eyebrow">' + (card.section ? esc(card.section) + ', card ' : 'Card ') + card.n + '</p>';
    if (card.title) html += '<h3 class="be-title">' + esc(card.title) + '</h3>';
    if (card.message) html += '<p class="be-message">' + esc(card.message) + '</p>';
    html += '</div>';
    var any = false;
    if (b.meaning) { any = true; html += '<section class="be-section"><h4>What this means</h4><p>' + esc(b.meaning) + '</p></section>'; }
    if (b.looksLike) { any = true; html += '<section class="be-section"><h4>What this looks like</h4><p>' + esc(b.looksLike) + '</p></section>'; }
    if (b.affirmation) {
      any = true;
      html += '<section class="be-section be-aff"><h4>Affirmation</h4>' +
        (b.affirmationPrompt ? '<p class="be-prompt">' + esc(b.affirmationPrompt) + '</p>' : '') +
        '<p class="be-affirm">' + esc(b.affirmation) + '</p></section>';
    }
    if (!any) html += '<section class="be-section"><p class="muted">The guidebook message for this card will appear here soon.</p></section>';
    $('#bookletEntry').innerHTML = html;
  }

  // Mommas Earth Magick: the card's affirmation, then Gillian's fuller words.
  function renderWordsEntry(card) {
    var html = '<div class="be-head"><p class="eyebrow">' + (card.section ? esc(card.section) + ', card ' : 'Card ') + card.n + '</p>' +
      '<h3 class="be-title">' + esc(card.title) + '</h3></div>' +
      '<section class="be-section be-aff"><h4>' + esc(card.deck.entryHeading || 'Affirmation') + '</h4>' +
      '<p class="be-prompt">' + esc(card.deck.entryPrompt || 'Say it out loud with intention:') + '</p>' +
      '<p class="be-affirm be-lines">' + esc(card.message) + '</p>' +
      (card.deck.copyable ? '<button type="button" class="btn btn-gold btn-sm copy-msg">Copy message</button>' : '') +
      '</section>';
    if (card.words && card.words.length) {
      html += '<section class="be-section"><h4>Momma’s words</h4>' +
        card.words.map(function (w) { return '<p class="be-lines">' + esc(w) + '</p>'; }).join('') + '</section>';
    }
    $('#bookletEntry').innerHTML = html;
    var cb = $('#bookletEntry .copy-msg');
    if (cb) cb.addEventListener('click', function () {
      var text = card.message.replace(/\n/g, ' ');
      var done = function () { cb.textContent = 'Copied'; setTimeout(function () { cb.textContent = 'Copy message'; }, 1800); };
      var fallback = function () { var r = document.createRange(); r.selectNodeContents($('#bookletEntry .be-affirm')); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  }

  function renderHistory() {
    var draws = getDraws(user.email);
    var ol = $('#history');
    ol.innerHTML = '';
    for (var i = 6; i >= 0; i--) {
      (function (date) {
        var key = dayKey(date), list = draws[key] || [], card = list.length ? cardByNumber(list[0]) : null;
        var li = document.createElement('li');
        li.className = 'hist-item';
        var label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString(undefined, { weekday: 'short' });
        var dayHtml = '<span class="hist-day"><b>' + esc(label) + '</b>' + esc(date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })) + '</span>';
        if (card) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'hist-card';
          if (selected && selected.date && dayKey(selected.date) === key) btn.classList.add('is-active');
          btn.setAttribute('aria-label', 'View your card from ' + longDate(date));
          btn.appendChild(renderFace(card, true));
          btn.addEventListener('click', function () { showReading(card, date, true); });
          li.appendChild(btn);
        } else {
          var empty = document.createElement('div');
          empty.className = 'hist-empty';
          empty.textContent = i === 0 ? 'Waiting for you' : 'No card';
          li.appendChild(empty);
        }
        li.insertAdjacentHTML('beforeend', dayHtml);
        ol.appendChild(li);
      })(daysAgo(i));
    }
  }

  function renderDeckGrid() {
    var wrap = $('#deckGrid');
    if (wrap.dataset.deck === DECK.id) return;
    wrap.dataset.deck = DECK.id;
    wrap.innerHTML = '';
    var sections = DECK.sections && DECK.sections.length ? DECK.sections : [{ name: '', intro: [] }];
    var numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    sections.forEach(function (sec, si) {
      var cards = DECK.cards.filter(function (c) { return !sec.name || c.section === sec.name; });
      if (!cards.length) return;
      var block = document.createElement('section');
      block.className = 'deck-section';
      block.innerHTML =
        '<h3 class="deck-sec-title">' + (sections.length > 1 ? '<span>' + numerals[si] + '.</span> ' : '') + esc(sec.name) + ' <small>' + cards.length + (cards.length === 1 ? ' card' : ' cards') + '</small></h3>' +
        (sec.intro && sec.intro.length ? '<details class="fold"><summary>About this section</summary><div class="prose">' + paras(sec.intro) + '</div></details>' : '');
      var grid = document.createElement('div');
      grid.className = 'deck-grid';
      cards.forEach(function (card) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'deck-tile';
        b.setAttribute('aria-label', 'Read ' + cardLabel(card));
        b.appendChild(renderFace(card, true));
        b.addEventListener('click', function () { showReading(card, null, true); });
        grid.appendChild(b);
      });
      block.appendChild(grid);
      wrap.appendChild(block);
    });
  }

  function renderBookletSection() {
    $('#bookletIntro').innerHTML = paras(SITE.introduction);
    var h = SITE.howToUse || {};
    $('#howTo').innerHTML = '<p>' + esc(h.intro || '') + '</p><ul class="steps">' +
      (h.steps || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul><p>' + esc(h.outro || '') + '</p>';
    $('#bookletLink').href = SITE.bookletPdf || '#';
  }

  /* ---------------- My Journal ----------------
     PREVIEW: entries are saved in this browser for this member.
     LIVE: save them to the membership service so they follow the member to every device. */
  var JPROMPTS = [
    'What did today’s card stir up in you?',
    'Where in your life does this message apply right now?',
    'What boundary would you like to practise this week?',
    'What are you ready to let go of?',
    'What did your body tell you today?',
    'What truth have you been holding back?',
    'What would you say to your younger self today?',
    'Who drains your energy, and who restores it?',
    'What does peace look like for you right now?'
  ];
  var jEditing = null, jCard = null, jPromptIdx = 0, jWired = false;
  function jKey() { return 'hh:journal:' + user.email; }
  function jEntries() { return store.getJSON(jKey(), []); }
  function jSave(list) { store.setJSON(jKey(), list); }
  function findCard(deckId, n) {
    var d = null; Object.keys(DECKS).forEach(function (k) { if (DECKS[k].id === deckId) d = DECKS[k]; });
    if (!d) return null;
    for (var i = 0; i < d.cards.length; i++) if (d.cards[i].n === n) return d.cards[i];
    return null;
  }
  function entryDate(e) { return new Date(e.created).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function setJCard(card) {
    jCard = card ? { deck: card.deck.id, n: card.n } : null;
    $('#jfCard').hidden = !card;
    if (!card) return;
    var t = $('#jfThumb'); t.innerHTML = ''; t.appendChild(renderFace(card, true));
    $('#jfCardTitle').textContent = card.title || ('Card ' + card.n);
    $('#jfCardDeck').textContent = card.deck.name + ', card ' + card.n;
  }
  function showPrompt() { $('#jfPrompt').textContent = JPROMPTS[jPromptIdx % JPROMPTS.length]; }
  function resetJForm() {
    jEditing = null;
    $('#jfText').value = '';
    $('#jfSave').textContent = 'Save entry';
    $('#jfCancel').hidden = true;
    $('#jfError').textContent = '';
    $('#jfDate').textContent = longDate(new Date());
    var today = todaysCard();
    setJCard(today);
    jPromptIdx = dayIndex(new Date()) % JPROMPTS.length;
    showPrompt();
  }
  function journalForCard(card, date) {
    resetJForm();
    setJCard(card);
    $('#jfPrompt').textContent = JPROMPTS[0];
    $('#journal').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { $('#jfText').focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
  }
  function renderJournal() {
    var list = jEntries().slice().sort(function (a, b) { return b.created < a.created ? -1 : 1; });
    var q = ($('#jSearch').value || '').trim().toLowerCase();
    var shown = q ? list.filter(function (e) { return (e.text + ' ' + (e.prompt || '')).toLowerCase().indexOf(q) >= 0; }) : list;
    $('#jCount').textContent = list.length ? '(' + list.length + ')' : '';
    var holder = $('#journalList');
    if (!list.length) {
      holder.innerHTML = '<div class="note-empty"><p>Your first reflection will appear here. Try writing a few lines about today’s card.</p></div>';
      return;
    }
    if (!shown.length) { holder.innerHTML = '<p class="muted">No entries match “' + esc(q) + '”.</p>'; return; }
    holder.innerHTML = '';
    shown.forEach(function (e) {
      var card = e.card ? findCard(e.card.deck, e.card.n) : null;
      var art = document.createElement('article');
      art.className = 'jentry';
      art.innerHTML =
        '<div class="je-head"><p class="eyebrow">' + esc(entryDate(e)) + (e.edited ? ' (edited)' : '') + '</p>' +
        (card ? '<p class="je-card">' + esc(card.title || ('Card ' + card.n)) + ' <small>· ' + esc(card.deck.name) + '</small></p>' : '') + '</div>' +
        (e.prompt ? '<p class="je-prompt">' + esc(e.prompt) + '</p>' : '') +
        '<p class="je-text">' + esc(e.text) + '</p>' +
        '<div class="je-actions"><button type="button" class="linkbtn" data-act="edit">Edit</button>' +
        '<button type="button" class="linkbtn" data-act="del">Delete</button>' +
        '<span class="je-confirm" hidden>Delete this entry? <button type="button" class="linkbtn danger" data-act="yes">Yes, delete</button> <button type="button" class="linkbtn" data-act="no">Keep it</button></span></div>';
      if (card) { var th = document.createElement('span'); th.className = 'je-thumb'; th.appendChild(renderFace(card, true)); art.insertBefore(th, art.firstChild); }
      art.addEventListener('click', function (ev) {
        var b = ev.target.closest('button[data-act]'); if (!b) return;
        var act = b.dataset.act, conf = art.querySelector('.je-confirm');
        if (act === 'del') conf.hidden = false;
        else if (act === 'no') conf.hidden = true;
        else if (act === 'yes') { jSave(jEntries().filter(function (x) { return x.id !== e.id; })); if (jEditing === e.id) resetJForm(); renderJournal(); }
        else if (act === 'edit') {
          jEditing = e.id;
          $('#jfText').value = e.text;
          $('#jfPrompt').textContent = e.prompt || '';
          $('#jfDate').textContent = 'Editing your entry from ' + entryDate(e);
          setJCard(card);
          $('#jfSave').textContent = 'Save changes';
          $('#jfCancel').hidden = false;
          $('#journalForm').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          $('#jfText').focus({ preventScroll: true });
        }
      });
      holder.appendChild(art);
    });
  }
  function journalAsText() {
    var list = jEntries().slice().sort(function (a, b) { return a.created < b.created ? -1 : 1; });
    var out = 'My Journal · HarperHolistic\n' + (user.name ? user.name + '\n' : '') + '\n';
    list.forEach(function (e) {
      var card = e.card ? findCard(e.card.deck, e.card.n) : null;
      out += '────────────────────────\n' + entryDate(e) + '\n';
      if (card) out += 'Card: ' + (card.title || 'Card ' + card.n) + ' (' + card.deck.name + ', card ' + card.n + ')\n';
      if (e.prompt) out += 'Prompt: ' + e.prompt + '\n';
      out += '\n' + e.text + '\n\n';
    });
    return out;
  }
  function journalAsHTML(forPrint) {
    var list = jEntries().slice().sort(function (a, b) { return a.created < b.created ? -1 : 1; });
    var body = '<h1>My Journal</h1><p class="sub">HarperHolistic' + (user.name ? ' · ' + esc(user.name) : '') + ' · ' + list.length + (list.length === 1 ? ' entry' : ' entries') + '</p>';
    list.forEach(function (e) {
      var card = e.card ? findCard(e.card.deck, e.card.n) : null;
      body += '<div class="entry"><h2>' + esc(entryDate(e)) + '</h2>' +
        (card ? '<p class="card"><b>' + esc(card.title || 'Card ' + card.n) + '</b> · ' + esc(card.deck.name) + ', card ' + card.n + (card.message ? '<br><i>' + esc(card.message.replace(/\n/g, ' ')) + '</i>' : '') + '</p>' : '') +
        (e.prompt ? '<p class="prompt">' + esc(e.prompt) + '</p>' : '') +
        '<p class="text">' + esc(e.text).replace(/\n/g, '<br>') + '</p></div>';
    });
    if (forPrint) return body;
    return '<html><head><meta charset="utf-8"><title>My Journal</title><style>body{font-family:Georgia,serif;color:#2a1838;line-height:1.5}h1{color:#3f1659}h2{font-size:14pt;color:#3f1659;margin:18pt 0 4pt}.sub{color:#6f5a7c}.card{color:#4a1a6b}.prompt{color:#9c6f22;font-style:italic}.entry{border-top:1px solid #e3d2ea;padding-top:6pt}</style></head><body>' + body + '</body></html>';
  }
  function downloadFile(name, type, content) {
    try {
      var blob = new Blob(['﻿' + content], { type: type });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (err) { $('#jfError').textContent = 'Your browser blocked the download. Try Print or save as PDF instead.'; }
  }
  function fileStamp() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function initJournal() {
    resetJForm();
    renderJournal();
    if (jWired) return;
    jWired = true;
    $('#journalForm').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var text = $('#jfText').value.trim();
      if (!text) { $('#jfError').textContent = 'Write a few words before saving.'; return; }
      var list = jEntries(), now = new Date().toISOString(), prompt = $('#jfPrompt').textContent;
      if (jEditing) {
        list.forEach(function (x) { if (x.id === jEditing) { x.text = text; x.prompt = prompt; x.card = jCard; x.edited = now; } });
      } else {
        list.push({ id: 'j' + Date.now().toString(36) + randomInt(1e6).toString(36), created: now, text: text, prompt: prompt, card: jCard });
      }
      jSave(list);
      var msg = jEditing ? 'Changes saved' : 'Entry saved';
      resetJForm(); renderJournal();
      $('#jfSaved').textContent = msg;
      setTimeout(function () { $('#jfSaved').textContent = ''; }, 2500);
    });
    $('#jfCancel').addEventListener('click', resetJForm);
    $('#jfUnlink').addEventListener('click', function () { setJCard(null); });
    $('#jfNewPrompt').addEventListener('click', function () { jPromptIdx++; showPrompt(); });
    $('#jSearch').addEventListener('input', renderJournal);
    var needEntries = function () {
      if (jEntries().length) return true;
      $('#jfError').textContent = 'Save your first entry, then you can download or print your journal.';
      return false;
    };
    $('#jDownloadDoc').addEventListener('click', function () { if (needEntries()) downloadFile('My-Journal-' + fileStamp() + '.doc', 'application/msword', journalAsHTML(false)); });
    $('#jDownloadTxt').addEventListener('click', function () { if (needEntries()) downloadFile('My-Journal-' + fileStamp() + '.txt', 'text/plain;charset=utf-8', journalAsText()); });
    $('#jPrint').addEventListener('click', function () {
      if (!needEntries()) return;
      $('#journalPrint').innerHTML = journalAsHTML(true);
      document.body.classList.add('printing-journal');
      var done = function () { document.body.classList.remove('printing-journal'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      try { window.print(); } catch (err) {}
      setTimeout(done, 1500);
    });
  }

  /* ---------------- the deck: shuffle, fan, choose, flip ---------------- */
  var JOURNAL_BTN = $('#journalThisCard');   // moved under the guidebook message on each reading
  var DECK_SIZE = 12, FAN = 7;
  var stage = $('#stage');

  function buildDeck() {
    stage.innerHTML = '';
    busy = false;
    var btn = $('#shuffleBtn');
    btn.disabled = false;
    btn.hidden = false;
    stage.classList.add('deck-ready');
    for (var i = 0; i < DECK_SIZE; i++) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'dcard';
      el.tabIndex = -1;
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span class="flipper"><span class="face back"><img src="' + DECK.back + '" alt="" draggable="false"></span><span class="face front"></span></span>';
      el._base = 'translate(' + (-i * 0.35) + 'px,' + (-i * 0.7) + 'px)';
      el.style.transform = el._base;
      el.style.zIndex = String(i + 1);
      stage.appendChild(el);
    }
  }

  function animate(el, frames, opts) {
    if (!el.animate) { el.style.transform = frames[frames.length - 1].transform || el.style.transform; return Promise.resolve(); }
    return el.animate(frames, opts).finished.catch(function () {});
  }

  // One riffle: the deck splits into two halves that spring apart and fall back together, interleaving.
  function riffle(cards, round) {
    var half = cards.length / 2;
    return Promise.all(cards.map(function (el, i) {
      var left = round % 2 ? i % 2 === 0 : i < half;
      var dir = left ? -1 : 1;
      var lift = 6 + (i % 4) * 3;
      var order = left ? i : (i - half);
      return animate(el, [
        { transform: el._base },
        { transform: 'translate(' + (dir * 62) + '%,' + (-lift) + 'px) rotate(' + (dir * 9) + 'deg)', offset: .38 },
        { transform: 'translate(' + (dir * 30) + '%,' + (-lift / 2) + 'px) rotate(' + (dir * 4) + 'deg)', offset: .62 },
        { transform: el._base }
      ], { duration: 820, delay: Math.max(0, order) * 26, easing: 'cubic-bezier(.45,.05,.3,1)' });
    }));
  }

  // A quick cut: top half lifts away and drops back underneath.
  function cut(cards) {
    var top = cards.slice(cards.length / 2);
    return Promise.all(top.map(function (el, i) {
      return animate(el, [
        { transform: el._base },
        { transform: 'translate(0,-' + (85 + i) + '%) rotate(-2deg)', offset: .5 },
        { transform: el._base }
      ], { duration: 640, easing: 'cubic-bezier(.5,0,.3,1)' });
    }));
  }

  function fanOut(cards) {
    var fanCards = cards.slice(-FAN);
    var rest = cards.slice(0, cards.length - FAN);
    var w = fanCards[0].offsetWidth;
    var avail = stage.clientWidth - w * 1.12 - 16;   // room for the rotated outer cards
    var step = Math.min(w * 0.46, avail / (FAN - 1));
    rest.forEach(function (el) {
      animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).then(function () { el.style.visibility = 'hidden'; });
    });
    return Promise.all(fanCards.map(function (el, j) {
      var k = j - (FAN - 1) / 2;
      var t = 'translate(' + (k * step) + 'px,' + (Math.abs(k) * Math.abs(k) * 5 + 14) + 'px) rotate(' + (k * 7) + 'deg) scale(.82)';
      el._fan = t;
      return animate(el, [{ transform: el.style.transform }, { transform: t }], {
        duration: reduceMotion ? 1 : 560, delay: reduceMotion ? 0 : j * 75, easing: 'cubic-bezier(.2,.8,.2,1)'
      }).then(function () { el.style.transform = t; });
    })).then(function () { return fanCards; });
  }

  function shuffle() {
    if (busy) return;
    busy = true;
    var btn = $('#shuffleBtn');
    btn.disabled = true;
    stage.classList.remove('deck-ready');
    $('#drawHint').textContent = 'Shuffling…';
    var cards = Array.prototype.slice.call(stage.querySelectorAll('.dcard'));

    var seq = reduceMotion
      ? Promise.resolve()
      : riffle(cards, 0).then(function () { return riffle(cards, 1); })
          .then(function () { return cut(cards); })
          .then(function () { return riffle(cards, 2); });

    seq.then(function () { return fanOut(cards); }).then(function (fanCards) {
      btn.hidden = true;
      $('#drawHint').textContent = 'Choose the card that calls to you.';
      fanCards.forEach(function (el, j) {
        el.classList.add('pickable');
        el.tabIndex = 0;
        el.removeAttribute('aria-hidden');
        el.setAttribute('aria-label', 'Choose card ' + (j + 1) + ' of ' + FAN);
        el.addEventListener('click', function () { choose(el, fanCards); }, { once: true });
      });
      fanCards[Math.floor(FAN / 2)].focus({ preventScroll: true });
    });
  }

  function choose(el, fanCards) {
    if (!busy || el.dataset.chosen) return;
    el.dataset.chosen = '1';
    if (todaysCard()) { busy = false; showToday(true); return; } // already chosen today (e.g. in another tab)
    var card = pickCardFor(user.email);
    var today = cardDay();
    saveDraw(user.email, today, card.n);

    fanCards.forEach(function (c) {
      c.classList.remove('pickable');
      c.tabIndex = -1;
      if (c !== el) {
        animate(c, [{ transform: c.style.transform, opacity: 1 }, { transform: c.style.transform + ' translateY(60px)', opacity: 0 }],
          { duration: 420, easing: 'ease-in', fill: 'forwards' });
      }
    });

    el.querySelector('.front').appendChild(renderFace(card));
    el.style.zIndex = '50';
    $('#drawHint').textContent = 'Your card for today…';

    animate(el, [{ transform: el.style.transform }, { transform: 'translate(0,-6px) rotate(0deg) scale(1.08)' }],
      { duration: reduceMotion ? 1 : 520, easing: 'cubic-bezier(.2,.8,.2,1)' })
      .then(function () {
        el.style.transform = 'translate(0,-6px) rotate(0deg) scale(1.08)';
        el.querySelector('.flipper').classList.add('flipped');
        return wait(reduceMotion ? 50 : 1300);
      })
      .then(function () {
        busy = false;
        $('#table').hidden = true;
        $('#drawHint').textContent = 'This is the card you chose today. Sit with it, and say the affirmation out loud.';
        showReading(card, today, true);
      });
  }

  $('#shuffleBtn').addEventListener('click', shuffle);
  // Tapping the face-down deck shuffles it too (before the cards are fanned out).
  stage.addEventListener('click', function (e) {
    if (busy || $('#shuffleBtn').hidden || !e.target.closest('.dcard')) return;
    shuffle();
  });
  $('#backToday').addEventListener('click', function () { showToday(true); });
  // Preview-only: clear today's card for this deck so it can be shuffled again.
  $('#resetTodayBtn').addEventListener('click', function () {
    if (!SITE.previewTools || !user) return;
    var draws = getDraws(user.email);
    delete draws[dayKey(cardDay())];
    store.setJSON(drawsKey(user.email), draws);
    if (typeof setJCard === 'function' && !jEditing) setJCard(null);
    showToday(true);
  });
  // Keep the dashboard current if it is left open past 5am, or reopened later.
  var lastCardDay = dayKey(cardDay());
  function refreshIfNewDay() {
    var k = dayKey(cardDay());
    if (busy || !user || $('[data-view="dashboard"]').hidden) { lastCardDay = k; return; }
    // (applies to whichever deck is on screen)
    if (k !== lastCardDay) { lastCardDay = k; showToday(false); }
    else if (!$('#againBox').hidden) $('#nextCardNote').textContent = 'Your next card will be ready at 5am, in ' + untilNext() + '.';
  }
  setInterval(refreshIfNewDay, 60e3);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshIfNewDay(); });

  /* ---------------- routing ---------------- */
  var VIEWS = ['home', 'join', 'dashboard', 'about-you'];   // deck pages (DECKS) show the dashboard view
  function go(view) {
    if (location.hash === '#' + view) route(); else location.hash = view;
  }
  function route() {
    var v = (location.hash || '#home').slice(1);
    var member = Auth.current();
    var deck = DECKS[v] || null;
    if (deck) v = 'dashboard';
    if (VIEWS.indexOf(v) < 0) v = 'home';
    if ((v === 'dashboard' || v === 'about-you') && !member) v = 'join';
    if (v === 'join' && member) { v = 'dashboard'; deck = null; }
    document.body.classList.toggle('is-member', !!member);
    document.querySelectorAll('[data-view]').forEach(function (s) { s.hidden = s.getAttribute('data-view') !== v; });
    if (v === 'dashboard') initDashboard(deck || BOUNDARIES);
    if (v === 'about-you') fillProfileForm();
    window.scrollTo(0, 0);
  }

  (function wireDecksMenu() {
    var menu = $('#decksMenu');
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.open = false; });
    document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  })();

  $('#year').textContent = new Date().getFullYear();
  initHome();
  initAuthForms();
  initProfileForm();
  window.addEventListener('hashchange', route);
  route();
})();
