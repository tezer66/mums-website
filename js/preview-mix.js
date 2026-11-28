/* Preview only (index.html?preview=1). Adds the big card artwork behind each top slide and the
   "Guided by experience" card row to About Gill. Nothing here runs on the normal site. */
(function () {
  var ARTS = ['images/cards/card-12.webp', 'images/cancer-care/card-01.webp', 'images/earth-magick/card-05.webp'];
  var GX = [['images/cards/card-01.webp', 'Boundaries', '44 cards'], ['images/cancer-care/card-15.webp', 'Cancer Care', '44 messages'],
    ['images/earth-magick/card-05.webp', 'Momma’s Earth Magick', '44 rituals'], ['images/cards/card-31.webp', 'Distant Reiki', 'Book a session with Gill'],
    ['images/affirmations/aff-02.webp', 'Affirmations', 'A new one every morning']];
  function run() {
    var bar = document.createElement('div'); bar.className = 'pv-bar';
    bar.innerHTML = 'PREVIEW · look ' + (/[?&]look=b\b/.test(location.search) ? 'B' : 'A') + ' · <a href="./?preview=1">look A</a> · <a href="./?preview=1&look=b">look B</a> · <a href="./">current site</a>';
    document.body.prepend(bar);
    if (/[?&]look=b\b/.test(location.search)) document.documentElement.classList.add('pv-b');
    var band = document.getElementById('hp-decks'), art = document.createElement('div'); art.className = 'band-art';
    ARTS.forEach(function (src, i) { var d = document.createElement('div'); d.style.backgroundImage = 'url(' + src + ')'; if (i === 0) d.className = 'on'; art.appendChild(d); });
    band.prepend(art);
    var slides = band.querySelectorAll('.deck-slide');
    function sync() { var k = 0; slides.forEach(function (s, i) { if (s.getAttribute('aria-hidden') !== 'true') k = i; }); art.querySelectorAll('div').forEach(function (d, i) { d.classList.toggle('on', i === k); }); }
    slides.forEach(function (s) { new MutationObserver(sync).observe(s, { attributes: true, attributeFilter: ['aria-hidden'] }); });
    sync();
    // chosen card: the band takes on that card's artwork, with a golden glow and sparkles
    var chosen = document.createElement('div'); chosen.className = 'chosen'; art.appendChild(chosen);
    var glow = document.createElement('div'); glow.className = 'pv-glow'; band.prepend(glow);
    function burst(face) {
      var br = band.getBoundingClientRect(), fr = face.getBoundingClientRect();
      var cx = fr.left + fr.width / 2 - br.left, cy = fr.top + fr.height / 2 - br.top;
      glow.style.setProperty('--gx', cx + 'px'); glow.style.setProperty('--gy', cy + 'px');
      band.classList.remove('pv-burst'); void band.offsetWidth; band.classList.add('pv-burst');
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      for (var i = 0; i < 56; i++) {
        var sp = document.createElement('span'); sp.className = 'pv-spark';
        var a = Math.random() * Math.PI * 2, r = 120 + Math.random() * Math.max(br.width, br.height) * .55;
        sp.style.left = cx + 'px'; sp.style.top = cy + 'px';
        sp.style.setProperty('--tx', Math.cos(a) * r + 'px'); sp.style.setProperty('--ty', Math.sin(a) * r + 'px');
        sp.style.setProperty('--d', (1.2 + Math.random() * 1.1) + 's'); sp.style.animationDelay = (Math.random() * .25) + 's';
        var z = 12 + Math.random() * 20; sp.style.width = sp.style.height = z + 'px';
        band.appendChild(sp); setTimeout(function (n) { n.remove(); }.bind(null, sp), 2800);
      }
    }
    band.querySelectorAll('.try-result').forEach(function (res) {
      new MutationObserver(function () {
        if (res.hidden) { band.classList.remove('pv-revealed', 'pv-burst'); return; }
        var img = res.querySelector('.try-face img'); if (!img) return;
        chosen.style.backgroundImage = 'url(' + img.src + ')';
        band.classList.add('pv-revealed');
        burst(res.querySelector('.try-face'));
      }).observe(res, { attributes: true, attributeFilter: ['hidden'] });
    });
    // moving to another deck clears the chosen card's background
    slides.forEach(function (s) { new MutationObserver(function () { if (s.getAttribute('aria-hidden') === 'true') band.classList.remove('pv-revealed'); }).observe(s, { attributes: true, attributeFilter: ['aria-hidden'] }); });
    var story = document.getElementById('aboutStory'); if (!story) return;
    var cta = story.closest('.hp-band');
    var sec = document.createElement('div'); sec.className = 'wrap gx';
    sec.innerHTML = '<h2 class="hp-h2" style="text-align:center;margin:0">Guided by experience,<br><em style="color:#e9c97e">created with love</em></h2>' +
      '<p style="text-align:center;max-width:620px;margin:.8rem auto 0;opacity:.85">15 years in wellness in Dubai &amp; Koh Samui: yoga, reiki, sound healing, retreats and full moon ceremonies. Every card began as a lesson Gill lived herself.</p><div class="gx-row"></div>';
    var row = sec.querySelector('.gx-row');
    GX.forEach(function (g, i) {
      var it = document.createElement('div'); it.className = 'gx-item' + (i === 0 ? ' on' : '');
      it.innerHTML = '<img src="' + g[0] + '" alt="" loading="lazy"><span></span>';
      var sp = it.querySelector('span'); sp.textContent = g[1]; var sm = document.createElement('small'); sm.textContent = g[2]; sp.appendChild(sm);
      function on() { row.querySelectorAll('.gx-item').forEach(function (x) { x.classList.toggle('on', x === it); }); }
      it.addEventListener('mouseenter', on); it.addEventListener('click', on);
      row.appendChild(it);
    });
    cta.querySelector('.wrap').before(sec);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
