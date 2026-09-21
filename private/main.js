/* VSL chapters {s: seconds, title}. Filled from the transcript, 21 Sep. */
window.VSL_DURATION = 720; /* until the video reports its own length */
window.VSL_CHAPTERS = [{s:0,title:"Is this you?"},{s:17,title:"What we do"},{s:41,title:"Recruitment only, real callers"},{s:68,title:"Results so far"},{s:111,title:"The guarantee and the cost"},{s:151,title:"Why I built RecRev"},{s:203,title:"Three reasons you're here"},{s:267,title:"How we do it"},{s:313,title:"How we qualify every meeting"},{s:361,title:"Who this is for"},{s:392,title:"Client stories"},{s:485,title:"What you actually get"},{s:578,title:"Us vs an in-house hire"},{s:643,title:"Guaranteed results"},{s:666,title:"Book a call"}];
// RecRev site — progressive enhancements. No framework.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // click-to-play videos (YouTube privacy-enhanced or Wistia iframe)
  document.querySelectorAll('.video[data-provider]').forEach(function (el) {
    el.addEventListener('click', function () {
      var p = el.dataset.provider, id = el.dataset.id, src;
      if (p === 'youtube') src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      else if (p === 'wistia') src = 'https://fast.wistia.net/embed/iframe/' + id + '?autoPlay=true&videoFoam=true';
      if (!src) return;
      var f = document.createElement('iframe');
      f.src = src; f.allow = 'autoplay; fullscreen; picture-in-picture'; f.setAttribute('allowfullscreen', '');
      f.title = el.getAttribute('aria-label') || 'Video';
      el.innerHTML = ''; el.appendChild(f); el.classList.add('playing');
    }, { once: true });
    el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  // FAQ: one open at a time
  document.querySelectorAll('.qa').forEach(function (g) {
    g.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () { if (d.open) g.querySelectorAll('details').forEach(function (o) { if (o !== d) o.open = false; }); });
    });
  });

  // booking embed: hide fallback once the iframe loads
  document.querySelectorAll('.embed iframe').forEach(function (f) {
    f.addEventListener('load', function () { var fb = f.parentElement.querySelector('.fallback'); if (fb) fb.style.visibility = 'hidden'; });
  });
  // marquee (sub-pages): duplicate track for a seamless loop
  document.querySelectorAll('.marquee .track').forEach(function (t) { t.innerHTML += t.innerHTML; });

  /* ── VSL: autoplay muted on scroll-in, one tap for sound, pause off-screen ── */
  document.querySelectorAll('[data-vsl]').forEach(function (box) {
    var v = box.querySelector('video'), btn = box.querySelector('[data-sound]'), bar = box.querySelector('[data-bar]');
    if (!v) return;
    var started = false;
    function play() { var p = v.play(); if (p && p.catch) p.catch(function () { box.classList.add('paused'); }); }
    function start() { if (started) return; started = true; v.preload = 'auto'; play(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && e.intersectionRatio >= 0.45) { start(); if (started && v.paused && !box.classList.contains('user-paused')) play(); }
          else if (started && !v.paused) v.pause();
        });
      }, { threshold: [0, 0.45] }).observe(box);
    } else start();
    btn && btn.addEventListener('click', function (e) {
      e.stopPropagation(); v.muted = false; v.volume = 1; box.classList.add('sound-on');
      if (v.paused) play();
    });
    box.addEventListener('click', function () {
      if (!box.classList.contains('sound-on')) { v.muted = false; box.classList.add('sound-on'); if (v.paused) play(); return; }
      if (v.paused) { box.classList.remove('paused', 'user-paused'); play(); }
      else { v.pause(); box.classList.add('paused', 'user-paused'); }
    });
    v.addEventListener('play', function () { box.classList.remove('paused'); });
    v.addEventListener('timeupdate', function () { if (bar && v.duration) bar.style.width = (v.currentTime / v.duration * 100) + '%'; });

    /* 21 Sep (Sultan): real controls: play/pause, time, speed 1/1.25/1.5/2, full screen. Plus chapters. */
    var ctrl = box.querySelector('[data-ctrl]');
    function unmute() { if (!box.classList.contains('sound-on')) { v.muted = false; v.volume = 1; box.classList.add('sound-on'); } }
    function fmt(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
    if (ctrl) {
      var playB = ctrl.querySelector('[data-play]'), timeEl = ctrl.querySelector('[data-time]'), speedB = ctrl.querySelector('[data-speed]'), fullB = ctrl.querySelector('[data-full]');
      var speeds = [1, 1.25, 1.5, 2], si = 0;
      ctrl.addEventListener('click', function (e) { e.stopPropagation(); });
      playB.addEventListener('click', function () { if (v.paused) { box.classList.remove('paused', 'user-paused'); unmute(); start(); play(); } else { v.pause(); box.classList.add('paused', 'user-paused'); } });
      speedB.addEventListener('click', function () { si = (si + 1) % speeds.length; v.playbackRate = speeds[si]; speedB.textContent = speeds[si] + '×'; });
      fullB.addEventListener('click', function () {
        if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); return; }
        if (box.requestFullscreen) box.requestFullscreen(); else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
      });
      v.addEventListener('play', function () { playB.textContent = '❚❚'; });
      v.addEventListener('pause', function () { playB.textContent = '▶'; });
      v.addEventListener('timeupdate', function () { timeEl.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration); });
      v.addEventListener('loadedmetadata', function () { timeEl.textContent = '0:00 / ' + fmt(v.duration); });
    }
    /* 21 Sep (Kwame): chapters are segments on the progress bar, YouTube style. Hover shows the name, click seeks. */
    var chapters = window.VSL_CHAPTERS || [], barBox = box.querySelector('[data-bar-box]'), segs = [];
    function seekTo(t) { start(); unmute(); box.classList.remove('paused', 'user-paused'); v.currentTime = t; play(); }
    function buildSegs(dur) {
      if (!barBox || !chapters.length || !dur) return;
      if (segs.length) { /* real duration arrived: resize the last chapter */
        var last = segs[segs.length - 1]; last.e = dur; last.el.style.flex = String(Math.max(1, dur - last.s)) + ' 1 0'; return;
      }
      barBox.classList.add('seg');
      chapters.forEach(function (ch, i) {
        var d = document.createElement('div'); d.className = 's'; d.setAttribute('data-title', fmt(ch.s) + '  ' + ch.title);
        var sg = { el: d, s: ch.s, e: i + 1 < chapters.length ? chapters[i + 1].s : dur };
        d.style.flex = String(Math.max(1, sg.e - sg.s)) + ' 1 0';
        d.appendChild(document.createElement('i'));
        d.addEventListener('click', function (e) {
          e.stopPropagation();
          var r = d.getBoundingClientRect(); seekTo(sg.s + (sg.e - sg.s) * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
        });
        segs.push(sg); barBox.appendChild(d);
      });
    }
    if (barBox) {
      buildSegs(v.duration || window.VSL_DURATION || 0);
      v.addEventListener('loadedmetadata', function () { buildSegs(v.duration); });
      barBox.addEventListener('click', function (e) {
        e.stopPropagation();
        if (segs.length || !v.duration) return;
        var r = barBox.getBoundingClientRect(); seekTo(v.duration * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      });
      v.addEventListener('timeupdate', function () {
        if (!segs.length) return;
        segs.forEach(function (sg) { sg.el.firstChild.style.width = (Math.min(1, Math.max(0, (v.currentTime - sg.s) / (sg.e - sg.s))) * 100) + '%'; });
      });
    }
  });

  /* ── hero: the wash leans toward the pointer ── */
  var hero = document.querySelector('.hero');
  if (hero && !reduce) {
    var pt = false;
    hero.addEventListener('pointermove', function (e) {
      if (pt) return; pt = true;
      requestAnimationFrame(function () {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        pt = false;
      });
    });
  }
  /* nav tightens once you scroll */
  var sc = false;
  function navState() { document.body.classList.toggle('scrolled', (window.scrollY || 0) > 24); sc = false; }
  window.addEventListener('scroll', function () { if (!sc) { sc = true; requestAnimationFrame(navState); } }, { passive: true });
  navState();
  /* result numbers count up when they come into view */
  var countBox = document.querySelector('[data-count]');
  if (countBox && !reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; cio.disconnect();
        countBox.querySelectorAll('b').forEach(function (el) {
          var raw = el.textContent, m = raw.match(/(\D*)(\d[\d,]*)(.*)/); if (!m) return;
          var end = parseInt(m[2].replace(/,/g, ''), 10), t0 = null, dur = 1400;
          function tick(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur); k = 1 - Math.pow(1 - k, 3);
            el.textContent = m[1] + Math.round(end * k).toLocaleString('en-GB') + m[3]; if (k < 1) requestAnimationFrame(tick); }
          requestAnimationFrame(tick);
        });
      });
    }, { threshold: 0.4 });
    cio.observe(countBox);
  }

  /* ── reveal on scroll ── */
  if (!reduce && 'IntersectionObserver' in window) {
    /* 21 Sep (Kwame): reveals looked broken mid-scroll. Now: as soon as any part of a block is on screen it rises
       as one, anything on screen at load shows at once, and reaching the bottom reveals whatever is left. */
    var targets = document.querySelectorAll('.rv, .rv-stagger, .split');
    var pending = Array.prototype.slice.call(targets);
    function show(t) { t.classList.add('in'); io.unobserve(t); }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) show(e.target); });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    function sweep() {
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
      pending = pending.filter(function (t) {
        var r = t.getBoundingClientRect();
        if (atBottom || (r.top < window.innerHeight * 0.96 && r.bottom > 0)) { show(t); return false; }
        return true;
      });
    }
    pending.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) { t.style.transition = 'none'; t.classList.add('in'); }
      else io.observe(t);
    });
    pending = pending.filter(function (t) { return !t.classList.contains('in'); });
    var ticking = false;
    function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { sweep(); ticking = false; }); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', sweep);
    setTimeout(sweep, 300); setTimeout(sweep, 1200);
  } else {
    document.querySelectorAll('.rv, .rv-stagger, .split').forEach(function (t) { t.classList.add('in'); });
  }

  /* ── Typeform → booking hand-off ──
     Path 1 (in page): the Typeform's on-submit callback reveals the widget.
     Path 2 (redirect): the Typeform ending sends people to /?qualified=1&name=…&email=…&phone=…&company=…#book
     — Typeform "recall" fills those from the answers — and the widget opens prefilled. */
  var params = new URLSearchParams(location.search);
  var prefill = ['name', 'email', 'phone', 'company'].filter(function (k) { return params.get(k); });
  document.querySelectorAll('iframe[src*="recdash.com/bookings"]').forEach(function (f) {
    if (!prefill.length) return;
    var u = new URL(f.getAttribute('src'), location.href);
    prefill.forEach(function (k) { u.searchParams.set(k, params.get(k)); });
    f.setAttribute('src', u.toString());
  });
  if (params.get('qualified') === '1' || prefill.length) window.recrevQualified && setTimeout(window.recrevQualified, 0);
})();

// RecDash Bookings embed: size the iframe to its content (PR #260 contract)
window.addEventListener('message', function (e) {
  var d = e && e.data;
  if (!d || d.type !== 'recdash-booking-height' || !d.height) return;
  document.querySelectorAll('iframe[src*="recdash.com/bookings"]').forEach(function (f) {
    f.style.height = Math.max(520, Math.ceil(d.height) + 8) + 'px';
  });
});

/* Qualifier finished -> reveal the booking widget in its place, with a
   loading veil until the reloaded widget is ready (no flash of the old form). */
window.recrevQualified = function () {
  var q = document.querySelector('[data-qualify]');
  if (!q) return;
  q.classList.add('done');
  var e = q.querySelector('.embed');
  if (e) {
    e.classList.remove('hidden'); e.classList.add('loading');
    var fr = e.querySelector('iframe');
    if (fr) fr.addEventListener('load', function () { e.classList.remove('loading'); }, { once: true });
    setTimeout(function () { e.classList.remove('loading'); }, 6000);
  }
  q.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* 19 Sep: the qualifier is an Enquire form in an iframe. It reports its
   height, its outcome (qualified / price_qualified / unqualified) and, once the
   booking widget inside it is used, the booking itself. */
window.addEventListener('message', function (e) {
  var d = e && e.data;
  if (!d || typeof d !== 'object') return;
  var fr = document.querySelector('[data-enquire]');
  if (d.type === 'recdash-form-height' && fr && d.height) fr.style.height = Math.max(420, Math.ceil(d.height) + 4) + 'px';
  if (d.type === 'recdash-form-complete') {
    try { sessionStorage.setItem('recrev_q', d.outcome === 'price_qualified' ? 'price' : 'qualified'); } catch (x) {}
  }
});

/* Booking made inside the widget -> the site takes them to its own
   confirmation page: 1 for revenue-qualified, 2 for price-qualified. */
window.addEventListener('message', function (e) {
  var d = e && e.data;
  if (!d || d.type !== 'recdash-booking-complete') return;
  var q = ''; try { q = sessionStorage.getItem('recrev_q') || ''; } catch (x) {}
  var page = q === 'price' ? 'confirmation2' : 'confirmation1';
  location.href = location.protocol === 'file:' ? page + '.html' : '/private/' + page;
});

/* ── the qualifier: Typeform's eight screens, one at a time ──
   Enter / OK moves on, ↑↓ arrows step, A/B/C keys pick a choice. Not an owner
   or can't invest ends on the "we'll reach out" screen. Otherwise the RecDash
   widget opens prefilled, and /booked later sends A or B by revenue band. */
(function () {
  var form = document.querySelector('[data-qualify-form]');
  if (!form) return;
  var screens = Array.prototype.slice.call(form.querySelectorAll('.tq-s'));
  var ok = form.querySelector('[data-qnext]'), prev = form.querySelector('[data-qprev]'), skip = form.querySelector('[data-qskip]');
  var bar = form.querySelector('[data-qbar]'), hint = form.querySelector('[data-hint]');
  var order = ['owner', 'name', 'email', 'company', 'phone', 'revenue', 'invest'];
  var i = 0;
  screens.forEach(function (s) { if (!s.querySelector('.tq-err') && !s.classList.contains('tq-end')) { var er = document.createElement('p'); er.className = 'tq-err'; s.appendChild(er); } });
  function byName(n) { return form.querySelector('[data-q="' + n + '"]'); }
  function answer(n) { var s = byName(n); var r = s.querySelector('input[type=radio]:checked'); if (r) return r.value; var t = s.querySelector('input'); return t ? t.value.trim() : ''; }
  function show(k, back) {
    i = k; var s = screens[k];
    screens.forEach(function (x) { x.classList.remove('on', 'back'); });
    s.classList.add('on'); if (back) s.classList.add('back');
    bar.style.width = (((k + 1) / (order.length + 1)) * 100) + '%';
    prev.disabled = k === 0; skip.disabled = s.classList.contains('tq-end') || k >= order.length - 1;
    var isChoice = s.dataset.kind === 'choice', isEnd = s.classList.contains('tq-end');
    ok.hidden = isEnd; hint.hidden = isEnd; hint.innerHTML = isChoice ? 'or press <b>A</b> / <b>B</b>' : 'press <b>Enter ↵</b>';
    ok.innerHTML = (k >= order.length - 2) ? 'See available times <span>→</span>' : 'OK <span>✓</span>';
    var inp = s.querySelector('input:not([type=radio])'); if (inp) setTimeout(function () { inp.focus(); }, 60);
  }
  function fail(s, msg) { s.classList.add('error'); var er = s.querySelector('.tq-err'); if (er) er.textContent = msg; var inp = s.querySelector('input:not([type=radio])'); if (inp) { inp.classList.add('bad'); inp.focus(); } }
  function clear(s) { s.classList.remove('error'); var inp = s.querySelector('input:not([type=radio])'); if (inp) inp.classList.remove('bad'); }
  function valid(k) {
    var s = screens[k], n = s.dataset.q, v = answer(n);
    clear(s);
    if (s.dataset.kind === 'choice' && !v) { fail(s, 'Please pick an answer'); return false; }
    if (s.dataset.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { fail(s, 'Hmm, that email address doesn’t look right'); return false; }
    if (s.dataset.kind === 'tel' && v.replace(/\D/g, '').length < 8) { fail(s, 'Please add a phone number we can reach you on'); return false; }
    if ((s.dataset.kind === 'text') && !v) { fail(s, 'Please fill this in'); return false; }
    return true;
  }
  function end() { show(screens.length - 1); }
  function finish() {
    var p = { name: answer('name'), email: answer('email'), phone: answer('phone'), company: answer('company') };
    var band = answer('revenue');
    try { sessionStorage.setItem('recrev_q', band === '0-300k' ? 'price' : 'qualified'); } catch (e) {}
    document.querySelectorAll('iframe[src*="recdash.com/bookings"]').forEach(function (fr) {
      var u = new URL(fr.getAttribute('src'), location.href);
      Object.keys(p).forEach(function (k) { if (p[k]) u.searchParams.set(k, p[k]); });
      u.searchParams.set('revenue', band);
      fr.setAttribute('src', u.toString());
    });
    form.classList.add('done');
    window.recrevQualified && window.recrevQualified();
  }
  function next() {
    if (screens[i].classList.contains('tq-end')) return;
    if (!valid(i)) return;
    var n = screens[i].dataset.q;
    if (n === 'owner' && answer('owner') === 'No') return end();
    // Revenue is the fork (Kwame, 17 Sep): £300k and up is revenue-qualified and
    // goes straight to times. Under £300k gets the investment question first.
    if (n === 'revenue') return answer('revenue') === '0-300k' ? show(i + 1) : finish();
    if (n === 'invest') return answer('invest') === 'No' ? end() : finish();
    show(i + 1);
  }
  ok.addEventListener('click', next);
  prev.addEventListener('click', function () { if (i > 0) show(i - 1, true); });
  skip.addEventListener('click', function () { if (i < order.length - 1) next(); });
  form.addEventListener('change', function (e) { if (e.target && e.target.type === 'radio') setTimeout(next, 260); });
  form.addEventListener('keydown', function (e) {
    var s = screens[i];
    if (e.key === 'Enter') { e.preventDefault(); next(); return; }
    if (s.dataset.kind === 'choice' && /^[a-eA-E]$/.test(e.key)) {
      var idx = e.key.toUpperCase().charCodeAt(0) - 65, r = s.querySelectorAll('input[type=radio]')[idx];
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  show(0);
})();
