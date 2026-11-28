/* Preview only (index.html?preview=1). Adds the big card artwork behind each top slide and the
   "Guided by experience" card row to About Gill. Nothing here runs on the normal site. */
(function () {
  var ARTS = ['images/cards/card-12.webp', 'images/cancer-care/card-01.webp', 'images/earth-magick/card-05.webp'];
  var GX = [['images/cards/card-01.webp', 'Boundaries', '44 cards'], ['images/cancer-care/card-15.webp', 'Cancer Care', '44 messages'],
    ['images/earth-magick/card-05.webp', 'Momma’s Earth Magick', '44 rituals'], ['images/cards/card-31.webp', 'Distant Reiki', 'Book a session with Gill'],
    ['images/affirmations/aff-02.webp', 'Affirmations', 'A new one every morning']];
  function run() {
    var bar = document.createElement('div'); bar.className = 'pv-bar';
    bar.innerHTML = 'PREVIEW of the new homepage parts · <a href="./">see the current site</a>';
    document.body.prepend(bar);
    document.querySelectorAll('#hp-decks .deck-slide').forEach(function (s, i) {
      if (!ARTS[i]) return; var d = document.createElement('div'); d.className = 'slide-art'; d.style.backgroundImage = 'url(' + ARTS[i] + ')'; s.prepend(d);
    });
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
