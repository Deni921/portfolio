/* ============================================================
   Deni Mekollari — Portfolio v2  ·  motion engine
   ============================================================ */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine   = matchMedia('(pointer:fine)').matches;
  const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp   = (a, b, t) => a + (b - a) * t;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------------- LOADER ---------------- */
  const loader = $('#loader'), lCount = $('#lCount'), lBar = $('#lBar');
  let booted = false;
  function boot() {
    if (booted) return; booted = true;
    document.body.classList.remove('locked');
    // hero entrance
    $$('#top .line-mask, #top .fade').forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 80 + i * 90);
    });
  }
  function runLoader() {
    if (reduce) { loader.style.display = 'none'; boot(); return; }
    const t0 = performance.now(), dur = 1500;
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 2);
      const val = Math.round(eased * 100);
      lCount.textContent = val;
      lBar.style.width = val + '%';
      if (p < 1) requestAnimationFrame(tick);
      else {
        loader.classList.add('done');
        boot();
        setTimeout(() => loader.remove(), 1200);
      }
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- LENIS SMOOTH SCROLL ---------------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, touchMultiplier: 1.6 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.documentElement.classList.add('lenis', 'lenis-smooth');
    window.lenis = lenis;
  }
  /* ---------------- PAGE-TRAVEL TRANSITION ---------------- */
  const wipebar = $('.wipebar');
  let travelT = null;
  function travel(ms) {
    if (reduce || !wipebar) return;
    document.body.classList.add('traveling');
    wipebar.style.transition = 'none';
    wipebar.style.opacity = '1';
    wipebar.style.transform = 'scaleX(0)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wipebar.style.transition = 'transform ' + ms + 'ms cubic-bezier(0.65,0,0.35,1)';
      wipebar.style.transform = 'scaleX(1)';
    }));
    clearTimeout(travelT);
    travelT = setTimeout(() => {
      document.body.classList.remove('traveling');
      wipebar.style.transition = 'opacity .35s ease';
      wipebar.style.opacity = '0';
    }, ms + 60);
  }

  // anchor handling
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      if (lenis) { lenis.scrollTo(t, { offset: -10, duration: 1.4 }); travel(1400); }
      else { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); travel(700); }
    });
  });

  /* ---------------- CUSTOM CURSOR ---------------- */
  if (fine && !reduce) {
    const ring = $('#cRing'), dot = $('#cDot'), ctext = $('#cText');
    document.body.classList.add('has-cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, dx = mx, dy = my;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const cloop = () => {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      dx = lerp(dx, mx, 0.4);  dy = lerp(dy, my, 0.4);
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      dot.style.transform  = `translate(${dx}px,${dy}px)`;
      requestAnimationFrame(cloop);
    };
    requestAnimationFrame(cloop);

    const targetSel = 'a, button, .card, [data-cursor]';
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest(targetSel);
      if (!t) return;
      const label = (t.closest('[data-cursor]') || {}).dataset?.cursor;
      ctext.textContent = label || '';
      document.body.classList.add('cur-link');
      document.body.classList.toggle('cur-label', !!label);
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest(targetSel);
      if (t && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(targetSel)))
        document.body.classList.remove('cur-link', 'cur-label');
    });
    addEventListener('mouseleave', () => document.body.classList.add('cur-hide'));
    addEventListener('mouseenter', () => document.body.classList.remove('cur-hide'));
  }

  /* ---------------- REVEAL OBSERVER (masks / fades / clips) ---------------- */
  const revealEls = $$('.line-mask, .fade, .clip').filter((el) => !el.closest('#top') && !el.closest('#loader'));
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------------- COUNTERS ---------------- */
  const counters = $$('[data-count]');
  const runCount = (el) => {
    const target = +el.dataset.count, t0 = performance.now(), dur = 1500;
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => reduce ? (c.textContent = c.dataset.count) : cio.observe(c));
  }

  /* ---------------- ROTATING ROLE ---------------- */
  const rot = $('#rot');
  if (rot) {
    const words = ['scalable platforms.', 'clean APIs.', 'production systems.', 'fast frontends.', 'solid databases.'];
    let i = 0;
    const b = rot.querySelector('b');
    if (!reduce) setInterval(() => {
      b.style.transform = 'translateY(-110%)';
      setTimeout(() => { i = (i + 1) % words.length; b.textContent = words[i]; b.style.transition = 'none'; b.style.transform = 'translateY(110%)';
        requestAnimationFrame(() => { b.style.transition = ''; b.style.transform = 'translateY(0)'; }); }, 480);
    }, 2600);
  }

  /* ---------------- TEXT SCRAMBLE ---------------- */
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&/<>*';
  if (!reduce) $$('.scramble').forEach((el) => {
    const text = el.dataset.text || el.textContent;
    el.addEventListener('pointerenter', () => {
      let it = 0; clearInterval(el._iv);
      el._iv = setInterval(() => {
        el.textContent = text.split('').map((c, idx) => (c === ' ' ? ' ' : idx < it ? text[idx] : glyphs[(Math.random() * glyphs.length) | 0])).join('');
        if (it >= text.length) { clearInterval(el._iv); el.textContent = text; }
        it += 1 / 2;
      }, 30);
    });
  });

  /* ---------------- MANIFESTO — scroll-linked word highlight ---------------- */
  const stmt = $('#stmt');
  if (stmt) {
    const hi = ['stack', 'architecture', 'ships.'];
    const words = stmt.dataset.words.split(' ');
    stmt.innerHTML = words.map((w) => {
      const acc = hi.includes(w.toLowerCase()) ? ' acc' : '';
      return `<span class="w${acc}">${w}</span>`;
    }).join(' ');
  }

  /* ---------------- MARQUEE BANDS ---------------- */
  const bands = $$('[data-marquee]').map((band) => {
    const track = band.querySelector('.track');
    track.innerHTML += track.innerHTML; // duplicate for seamless loop
    return { track, dir: +band.dataset.marquee, x: 0, half: 0 };
  });

  /* ---------------- HORIZONTAL GALLERY ---------------- */
  const pinTrack = $('#pinTrack'), hTrack = $('#hTrack'), galProg = $('#galProg');
  const galActive = () => matchMedia('(min-width:821px)').matches;

  /* ---------------- NAV hide/show + dark-section awareness ---------------- */
  const nav = $('#nav');
  const darkSections = $$('.gallery, .contact');
  let lastY = 0;

  /* ---------------- MASTER RAF (scroll-linked + marquees) ---------------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const y = scrollY;

    // nav
    if (nav) {
      // direction deadband: ignore sub-pixel jitter from momentum scroll so
      // the hide/show state doesn't flicker frame-to-frame
      const dy = y - lastY;
      if (Math.abs(dy) > 6) {
        if (dy > 0 && y > 220) nav.classList.add('hide');
        else nav.classList.remove('hide');
        lastY = y;
      }
      // backdrop once we leave the hero
      nav.classList.toggle('scrolled', y > 12);
      // flip nav to light when it sits over a dark section
      const navMid = 44;
      const overDark = darkSections.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top < navMid && r.bottom > navMid;
      });
      nav.classList.toggle('dark', overDark);
    }

    // manifesto word highlight
    if (stmt) {
      const sec = stmt.closest('.manifesto');
      const r = sec.getBoundingClientRect();
      const travel = sec.offsetHeight - innerHeight;
      const p = clamp(-r.top / travel, 0, 1);
      const ws = stmt.querySelectorAll('.w');
      const lit = Math.round(p * ws.length * 1.18);
      ws.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }

    // horizontal gallery
    if (pinTrack && hTrack && galActive()) {
      const r = pinTrack.getBoundingClientRect();
      const travel = pinTrack.offsetHeight - innerHeight;
      const p = clamp(-r.top / travel, 0, 1);
      const maxX = Math.max(0, hTrack.scrollWidth - innerWidth);
      hTrack.style.transform = `translateX(${-p * maxX}px)`;
      if (galProg) galProg.style.right = (100 - p * 100) + '%';
    } else if (hTrack) {
      hTrack.style.transform = '';
    }

    // marquees
    bands.forEach((b) => {
      b.half = b.track.scrollWidth / 2;
      b.x += b.dir * 34 * dt;
      if (b.dir < 0 && -b.x >= b.half) b.x += b.half;
      if (b.dir > 0 && b.x >= 0) b.x -= b.half;
      if (b.dir > 0 && b.x < -b.half) b.x += b.half;
      b.track.style.transform = `translateX(${b.x}px)`;
    });

    requestAnimationFrame(frame);
  }
  // init marquee start offset for positive direction
  bands.forEach((b) => { if (b.dir > 0) b.x = -b.track.scrollWidth / 2; });
  requestAnimationFrame(frame);

  /* ---------------- 3D TILT on project shots ---------------- */
  if (fine && !reduce) {
    $$('.card').forEach((card) => {
      const shot = card.querySelector('.shot');
      if (!shot) return;
      const img = shot.classList.contains('framed') ? null : shot.querySelector('img');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        shot.style.transform = `perspective(900px) rotateX(${(-ny * 7).toFixed(2)}deg) rotateY(${(nx * 9).toFixed(2)}deg) scale(1.015)`;
        shot.style.boxShadow = `${(-nx * 22).toFixed(1)}px ${(18 - ny * 14).toFixed(1)}px 44px rgba(0,0,0,.45)`;
        shot.style.setProperty('--gx', ((nx + 0.5) * 100).toFixed(1) + '%');
        shot.style.setProperty('--gy', ((ny + 0.5) * 100).toFixed(1) + '%');
        if (img) img.style.transform = `translate(${(-nx * 12).toFixed(1)}px, ${(-ny * 12).toFixed(1)}px) scale(1.1)`;
      });
      card.addEventListener('pointerleave', () => {
        shot.style.transform = '';
        shot.style.boxShadow = '';
        if (img) img.style.transform = '';
      });
    });
  }

  /* ---------------- CASE STUDY OVERLAY ---------------- */
  const csOverlay = $('#csOverlay');
  if (csOverlay) {
    const articles = $$('.cs', csOverlay);
    const openCS = (n) => {
      articles.forEach((a, i) => a.classList.toggle('active', i === n));
      csOverlay.scrollTop = 0;
      csOverlay.classList.add('open');
      csOverlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('locked');
      if (lenis) lenis.stop();
    };
    const closeCS = () => {
      if (!csOverlay.classList.contains('open')) return;
      csOverlay.classList.remove('open');
      csOverlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('locked');
      if (lenis) lenis.start();
    };
    $$('.card').forEach((card, i) => {
      card.addEventListener('click', () => openCS(i));
    });
    $('#csClose').addEventListener('click', closeCS);
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCS(); });
  }

  /* ---------------- LOCAL TIME + TAB TITLE ---------------- */
  const clock = $('#clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Tirane' });
    const tickClock = () => { clock.textContent = fmt.format(new Date()); };
    tickClock();
    setInterval(tickClock, 1000);
  }
  const baseTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'Did I say something?' : baseTitle;
  });

  /* ---------------- GO ---------------- */
  document.body.classList.add('locked');
  if (document.readyState === 'complete') runLoader();
  else addEventListener('load', runLoader);
  // safety: never trap the user if load stalls
  setTimeout(runLoader, 2600);
})();
