/* =========================================================
   Prasiddhi Mainali — portfolio behaviour
   ========================================================= */
(function () {
  'use strict';

  const BASE = 1440, BASE_H = 1024;          // the design canvas
  const NAV_H = 67.34;                       // design nav height (px on the 1440 canvas)
  const stage   = document.getElementById('stage');
  const wrap    = document.getElementById('stage-wrap');
  const isDesk  = () => window.innerWidth >= 768;
  const visW    = () => document.documentElement.clientWidth || window.innerWidth;
  // ZOOM < 1 zooms the whole desktop layout out a little (0.9 = 10% smaller). 1 = fill the window width exactly.
  const ZOOM    = Math.min(1, typeof window.PORTFOLIO_ZOOM === 'number' ? window.PORTFOLIO_ZOOM : 0.9);
  const scaleOf = () => (isDesk() ? (visW() / BASE) * ZOOM : 1);

  /* ---------- keep the 1440 canvas (and the fixed nav) proportional ---------- */
  function fitStage() {
    const s = scaleOf();
    document.documentElement.style.setProperty('--scale', s);
    // the scaled design is centred; the fixed navbar labels use the same offset
    const offx = isDesk() ? Math.max(0, (visW() - BASE * s) / 2) : 0;
    document.documentElement.style.setProperty('--offx', offx + 'px');
    // fixed background: "cover" scale so it always fills the window, anchored top-left
    document.documentElement.style.setProperty('--bgscale', Math.max(visW() / BASE, window.innerHeight / BASE_H));
    if (!stage || !wrap) return;
    if (!isDesk()) { wrap.style.height = ''; stage.style.transform = ''; stage.style.marginLeft = ''; return; }
    stage.style.marginLeft = offx + 'px';
    stage.style.transform = 'scale(' + s + ')';
    wrap.style.height = stage.offsetHeight * s + 'px';
  }
  fitStage();
  window.addEventListener('resize', fitStage);
  window.addEventListener('load', fitStage);

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------------- preloader ---------------- */
    (function preload() {
      const pre = document.getElementById('preloader');
      if (!pre) return;
      const bar = pre.querySelector('.pl-bar i');
      const imgs = [...document.images];
      let loaded = 0;
      const tick = () => {
        loaded++;
        if (bar) bar.style.width = Math.min(100, (loaded / imgs.length) * 100) + '%';
      };
      imgs.forEach(img => {
        if (img.complete) tick();
        else { img.addEventListener('load', tick); img.addEventListener('error', tick); }
      });
      const finish = () => {
        if (bar) bar.style.width = '100%';
        setTimeout(() => { pre.classList.add('done'); fitStage(); }, 350);
      };
      window.addEventListener('load', finish);
      setTimeout(finish, 6000);            // never trap the visitor
    })();

    /* ---------------- nav: active section (the bar itself never changes) ---------------- */
    const navLinks = [...document.querySelectorAll('#topnav .navlinks a')];
    const pages = [...document.querySelectorAll('.page')];

    function syncNav() {
      const s = scaleOf();
      const mid = window.scrollY + window.innerHeight * 0.4;
      let current = pages[0];
      pages.forEach(p => { if (p.offsetTop * s <= mid) current = p; });
      navLinks.forEach(a => {
        const on = a.getAttribute('href') === '#' + current.id;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }

    /* ---------------- smooth anchors (scale-aware, clears the nav) ---------------- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const s = scaleOf();
        const navH = isDesk() ? NAV_H * s : 0;   // mobile sections start under the fixed bar
        const top = isDesk()
          ? target.offsetTop * s - navH + 1
          : target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        closeMobileMenu();
      });
    });

    /* ---------------- falling cherry blossom petals ---------------- */
    (function petalFall() {
      const host = document.getElementById('petalfall');
      // desktop background is a still image (matches the design) -> no moving petals there
      if (!host || window.innerWidth >= 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const srcs = ['assets/blossom.png', 'assets/flower.png', 'assets/cherry.png'];
      function drop() {
        if (document.hidden) return;
        const img = document.createElement('img');
        img.src = srcs[Math.floor(Math.random() * srcs.length)];
        const size = 14 + Math.random() * 22;
        img.style.width = size + 'px';
        img.style.left = Math.random() * 100 + 'vw';
        img.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
        img.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
        const dur = 9 + Math.random() * 8;
        img.style.animation = `fall ${dur}s linear forwards`;
        img.style.opacity = 0.3 + Math.random() * 0.35;
        host.appendChild(img);
        setTimeout(() => img.remove(), dur * 1000 + 400);
      }
      for (let i = 0; i < 6; i++) setTimeout(drop, i * 900);
      setInterval(drop, 1700);
    })();

    /* ---------------- music player (real audio, mockup fallback) ---------------- */
    (function playerAll() {
      const audio = document.getElementById('track');
      let hasAudio = false;
      if (audio) {
        audio.addEventListener('loadedmetadata', () => { hasAudio = true; });
        audio.addEventListener('canplay', () => { hasAudio = true; });
        audio.load();
      }
      // desktop player (.music-wrap) and mobile player (.m-music) share the same audio element
      document.querySelectorAll('.music-wrap, .m-music').forEach(initPlayer);

      function initPlayer(root) {
        const playBtn  = root.querySelector('.music-play');
        const fill     = root.querySelector('.music-progress .fill');
        const knob     = root.querySelector('.music-progress .knob');
        const track    = root.querySelector('.music-progress');
        const curEl    = root.querySelector('.music-times span:first-child');
        const remEl    = root.querySelector('.music-times span:last-child');
        const shuffle  = root.querySelector('.music-btns button[title="shuffle"]');
        const repeat   = root.querySelector('.music-btns button[title="repeat"]');
        if (!playBtn) return;

        const PAUSE = '\u275A\u275A', PLAY = '\u25B6';
        const fmt = t => {
          if (!isFinite(t) || t < 0) return '0:00';
          return Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
        };
        const setPct = p => {
          p = Math.max(0, Math.min(100, p));
          if (fill) fill.style.width = p + '%';
          if (knob) knob.style.left  = p + '%';
        };

        let timer = null, pct = 15;
        const startFake = () => { stopFake(); timer = setInterval(() => { pct = pct >= 100 ? 0 : pct + 0.4; setPct(pct); }, 300); };
        const stopFake  = () => { clearInterval(timer); timer = null; };

        if (audio) {
          audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;
            setPct((audio.currentTime / audio.duration) * 100);
            if (curEl) curEl.textContent = fmt(audio.currentTime);
            if (remEl) remEl.textContent = '-' + fmt(audio.duration - audio.currentTime);
          });
          audio.addEventListener('ended', () => { playBtn.textContent = PLAY; });
        }
        setPct(pct); startFake();

        let on = false;   // the picture shows a pause icon from the start, so state is tracked here, not from the icon
        if (audio) audio.addEventListener('ended', () => { on = false; });
        audio && audio.addEventListener('pause', () => { if (hasAudio && audio.ended) on = false; });
        playBtn.addEventListener('click', () => {
          if (on) {                       // tap while playing -> pause
            if (hasAudio && audio) audio.pause(); else stopFake();
            on = false; playBtn.textContent = PLAY;
            return;
          }
          on = true; playBtn.textContent = PAUSE;   // tap while paused -> play
          if (!audio) { startFake(); return; }
          // try the real track first (works even when the browser did not preload it);
          // if there is no track.mp3 / it can't play, fall back to the animated mockup
          const pr = audio.play();
          if (pr && pr.then) pr.then(() => { hasAudio = true; stopFake(); }).catch(() => { hasAudio = false; startFake(); });
        });
        if (track) track.addEventListener('click', e => {
          const r = track.getBoundingClientRect();
          const p = ((e.clientX - r.left) / r.width) * 100;
          if (hasAudio && audio && audio.duration) audio.currentTime = (p / 100) * audio.duration;
          else { pct = p; setPct(p); }
        });
        [shuffle, repeat].forEach(b => b && b.addEventListener('click', () => {
          b.classList.toggle('active');
          if (b === repeat && audio) audio.loop = b.classList.contains('active');
        }));
      }
    })();

    /* ---------------- 3D tilt ---------------- */
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const rx = (((e.clientY - r.top) / r.height) - 0.5) * -11;
        const ry = (((e.clientX - r.left) / r.width) - 0.5) * 11;
        el.style.transform = `perspective(850px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* ---------------- magnetic buttons ---------------- */
    document.querySelectorAll('.magnet').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.28;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* ---------------- cursor sparkles ---------------- */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const chars = ['\u2726', '\u2727', '\u2661', '\u2740'];
      let last = 0;
      document.addEventListener('mousemove', e => {
        const now = Date.now();
        if (now - last < 100) return;
        last = now;
        const s = document.createElement('span');
        s.className = 'sparkle';
        s.textContent = chars[(Math.random() * chars.length) | 0];
        s.style.left = e.clientX + 'px';
        s.style.top  = e.clientY + 'px';
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 800);
      });
    }

    /* ---------------- reveal on scroll ---------------- */
    const io = new IntersectionObserver(es => {
      es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal-el').forEach(el => io.observe(el));

    /* ---------------- animated counters ---------------- */
    document.querySelectorAll('b[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const cio = new IntersectionObserver(es => {
        es.forEach(en => {
          if (!en.isIntersecting) return;
          cio.unobserve(el);
          const dur = 1400, t0 = performance.now();
          (function step(now) {
            const k = Math.min(1, (now - t0) / dur);
            const eased = 1 - Math.pow(1 - k, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (k < 1) requestAnimationFrame(step);
          })(t0);
        });
      }, { threshold: 0.3 });
      cio.observe(el);
    });

    /* ---------------- persistent project likes ---------------- */
    document.querySelectorAll('.like-btn').forEach(btn => {
      const key = 'liked:' + btn.dataset.project;
      let liked = false;
      try { liked = localStorage.getItem(key) === '1'; } catch (e) {}
      const paint = () => { btn.classList.toggle('liked', liked); btn.innerHTML = liked ? '&#9829;' : '&#9825;'; };
      paint();
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        liked = !liked;
        try { localStorage.setItem(key, liked ? '1' : '0'); } catch (e) {}
        paint();
      });
    });

    /* ---------------- mobile menu ---------------- */
    const mbtn = document.getElementById('mbtn');
    const mmenu = document.getElementById('mmenu');
    const mscrim = document.getElementById('mscrim');
    function closeMobileMenu() {
      mbtn && mbtn.classList.remove('open');
      mmenu && mmenu.classList.remove('open');
      mscrim && mscrim.classList.remove('open');
    }
    window.closeMobileMenu = closeMobileMenu;
    if (mbtn) mbtn.addEventListener('click', () => {
      mbtn.classList.toggle('open');
      mmenu.classList.toggle('open');
      mscrim.classList.toggle('open');
    });
    if (mscrim) mscrim.addEventListener('click', closeMobileMenu);

    /* ---------------- back to top ---------------- */
    const btt = document.createElement('button');
    btt.className = 'back-to-top';
    btt.innerHTML = '&uarr;';
    btt.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btt);
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    /* ---------------- keyboard section navigation ---------------- */
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea')) return;
      if (e.key !== 'PageDown' && e.key !== 'PageUp') return;
      e.preventDefault();
      const s = scaleOf();
      const navH = isDesk() ? NAV_H * s : 0;
      const tops = pages.map(p => p.offsetTop * s - navH + 1);
      const here = window.scrollY;
      const next = e.key === 'PageDown'
        ? tops.find(t => t > here + 10)
        : [...tops].reverse().find(t => t < here - 10);
      window.scrollTo({ top: Math.max(0, next != null ? next : here), behavior: 'smooth' });
    });

    /* ---------------- working contact form ---------------- */
    const form = document.getElementById('contactForm');
    if (form) {
      const status  = document.getElementById('formStatus');
      const sendBtn = document.getElementById('sendBtn');
      const toastEl = document.getElementById('sentToast');

      form.addEventListener('submit', async e => {
        e.preventDefault();
        status.textContent = ''; status.className = 'mt-2 mb-0 small';

        let valid = true;
        form.querySelectorAll('[required]').forEach(f => {
          const ok = f.checkValidity();
          f.classList.toggle('is-invalid', !ok);
          if (!ok) valid = false;
        });
        if (!valid) { status.textContent = 'Please fix the fields above.'; status.classList.add('err'); return; }

        const data = Object.fromEntries(new FormData(form).entries());
        sendBtn.disabled = true; sendBtn.textContent = 'Sending...';

        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (!res.ok) throw new Error('status ' + res.status);
          form.reset();
          const m = bootstrap.Modal.getInstance(document.getElementById('contactModal'));
          if (m) m.hide();
          if (toastEl) new bootstrap.Toast(toastEl).show();
        } catch (err) {
          const subj = encodeURIComponent(data.subject || 'Portfolio enquiry from ' + data.name);
          const body = encodeURIComponent(data.message + '\n\n- ' + data.name + ' (' + data.email + ')');
          status.innerHTML = 'Mail server unreachable. <a href="mailto:prasiddhimainali07@gmail.com?subject='
            + subj + '&body=' + body + '">Open in your mail app instead &rarr;</a>';
          status.classList.add('err');
        } finally {
          sendBtn.disabled = false; sendBtn.textContent = 'Send message';
        }
      });

      form.querySelectorAll('.form-control').forEach(f =>
        f.addEventListener('input', () => f.classList.toggle('is-invalid', !f.checkValidity()))
      );
    }

    /* ---------------- one rAF-throttled scroll loop ---------------- */
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        syncNav();
        btt.classList.toggle('show', window.scrollY > 400);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { fitStage(); syncNav(); });

    fitStage(); syncNav();
  });
})();
