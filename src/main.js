import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import { reel, categories, regions, clients } from './data.js';
import { mountEnquiry } from './enquiry.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
document.documentElement.classList.add(reduced ? 'reduced' : 'js');

/* ----------------------------------------------------------------
   Smooth scroll (Lenis) wired into GSAP's ticker
---------------------------------------------------------------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true, allowNestedScroll: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (target) => {
  if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -64, duration: 1.4 });
  else if (target === 0) window.scrollTo(0, 0);
  else target.scrollIntoView();
};
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id === '#' || id === '#main') return;
  const el = id === '#top' ? 0 : $(id);
  if (el === null) return;
  e.preventDefault();
  closeMenu();
  scrollToTarget(el);
});

/* ----------------------------------------------------------------
   Utilities
---------------------------------------------------------------- */
function splitWords(el) {
  if (el.dataset.splitDone) return $$('.wi', el);
  const nodes = [...el.childNodes];
  el.textContent = '';
  const wrap = (child) => {
    const w = document.createElement('span'); w.className = 'w';
    const i = document.createElement('span'); i.className = 'wi';
    i.appendChild(child); w.appendChild(i); el.appendChild(w);
  };
  nodes.forEach((n) => {
    if (n.nodeType === 3) {
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) el.appendChild(document.createTextNode(' '));
        else wrap(document.createTextNode(part));
      });
    } else if (n.nodeName === 'BR') el.appendChild(n);
    else wrap(n);
  });
  el.dataset.splitDone = '1';
  return $$('.wi', el);
}
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const BASE = import.meta.env.BASE_URL;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ----------------------------------------------------------------
   Navigation
---------------------------------------------------------------- */
const nav = $('[data-nav]');
const burger = $('[data-burger]');
function closeMenu() { nav.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); }
burger.addEventListener('click', () => {
  const open = !nav.classList.contains('menu-open');
  nav.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
});
ScrollTrigger.create({
  start: () => window.innerHeight * 0.85,
  onUpdate: (self) => nav.classList.toggle('is-solid', self.scroll() > window.innerHeight * 0.85),
});
// active-section indicator: a pill slides to the section in view (and follows hover)
(() => {
  const wrap = $('.nav-links'), ind = $('[data-nav-ind]');
  const links = $$('a', wrap), sheetLinks = $$('.nav-sheet a[href^="#"]');
  let current = null;
  const place = (a) => {
    if (!a) { gsap.to(ind, { opacity: 0, duration: 0.25 }); return; }
    const props = { x: a.offsetLeft, width: a.offsetWidth, opacity: 1 };
    if (reduced || !parseFloat(getComputedStyle(ind).opacity)) gsap.set(ind, props); else gsap.to(ind, { ...props, duration: 0.45, ease: 'power3.out' });
  };
  const setActive = (a) => {
    current = a;
    links.forEach((l) => l.classList.toggle('is-active', l === a));
    sheetLinks.forEach((l) => l.classList.toggle('is-active', a && l.getAttribute('href') === a.getAttribute('href')));
    if (!wrap.matches(':hover')) place(a);
  };
  links.forEach((a) => a.addEventListener('pointerenter', () => place(a)));
  wrap.addEventListener('pointerleave', () => place(current));
  const secs = links.map((a) => $(a.getAttribute('href')));
  links.forEach((a, i) => {
    const next = secs[i + 1];
    ScrollTrigger.create({
      trigger: secs[i], start: 'top 50%',
      ...(next ? { endTrigger: next, end: 'top 50%' } : { end: 'bottom 50%' }),
      onToggle: (self) => { if (self.isActive) setActive(a); else if (current === a) setActive(null); },
    });
  });
  window.addEventListener('resize', () => current && gsap.set(ind, { x: current.offsetLeft, width: current.offsetWidth }));
})();
const fab = $('[data-fab]');
ScrollTrigger.create({
  trigger: '#live', start: 'top 80%',
  onEnter: () => fab.classList.add('is-visible'),
  onLeaveBack: () => fab.classList.remove('is-visible'),
});

/* ----------------------------------------------------------------
   HERO — destination reel (two <video> elements, cross-faded)
---------------------------------------------------------------- */
const Reel = (() => {
  const vids = $$('.hero-video');
  const placeEl = $('[data-reel-place]');
  const barsEl = $('[data-reel-bars]');
  const toggle = $('[data-reel-toggle]');
  const small = window.matchMedia('(max-width: 768px)').matches;
  const src = (k) => `${BASE}media/video/${k}${small ? '-sm' : ''}.mp4`;
  const poster = (k) => `${BASE}media/video/${k}${small ? '-sm' : ''}.jpg`;
  let idx = -1, active = 0, userPaused = reduced, inView = true, raf = 0;

  const bars = reel.map((r, i) => {
    const b = h('button', 'reel-bar', `<span class="track"><span class="fill"></span></span>${esc(r.short)}`);
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', `Show ${r.place}`);
    b.addEventListener('click', () => { go(i, true); });
    barsEl.appendChild(b);
    return b;
  });

  function setCaption(text) {
    if (reduced) { placeEl.textContent = text; return; }
    gsap.timeline()
      .to(placeEl, { yPercent: -60, opacity: 0, duration: 0.3, ease: 'power2.in' })
      .add(() => { placeEl.textContent = text; })
      .fromTo(placeEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
  }

  let frames = 0;
  function tick() {
    const v = vids[active];
    const fill = bars[idx]?.querySelector('.fill');
    if (fill && v.duration) fill.style.transform = `scaleX(${Math.min(1, v.currentTime / v.duration)})`;
    // watchdog: browsers sometimes pause muted autoplay (hidden tab, power saving) — resume it
    if (++frames % 45 === 0 && !userPaused && inView && v.paused && !v.ended && v.readyState >= 2 && document.visibilityState === 'visible') {
      v.play().catch(() => {});
    }
    raf = requestAnimationFrame(tick);
  }

  function go(i, fromUser = false) {
    const n = (i + reel.length) % reel.length;
    if (n === idx && !fromUser) return;
    const first = idx === -1;
    const cur = vids[active];
    const next = first ? cur : vids[1 - active];
    const item = reel[n];
    next.poster = poster(item.key);
    next.src = src(item.key);
    next.currentTime = 0;
    if (fromUser && userPaused) { userPaused = false; toggle.classList.remove('is-paused'); }
    const start = () => {
      if (!reduced) gsap.fromTo(next, { scale: 1.045 }, { scale: 1, duration: 7.5, ease: 'none', overwrite: true });
      if (first) return;
      next.classList.add('is-active');
      cur.classList.remove('is-active');
      setTimeout(() => { cur.pause(); }, 1200);
      active = 1 - active;
    };
    idx = n;
    bars.forEach((b, j) => {
      b.classList.toggle('is-active', j === n);
      b.classList.toggle('is-done', j < n);
      b.setAttribute('aria-selected', String(j === n));
      b.querySelector('.fill').style.transform = j < n ? 'scaleX(1)' : 'scaleX(0)';
    });
    setCaption(item.place);
    if (userPaused || !inView) { next.load(); start(); return; }
    next.play().then(start).catch(start);
  }

  vids.forEach((v) => v.addEventListener('ended', () => { if (v === vids[active]) go(idx + 1); }));

  toggle.addEventListener('click', () => {
    const v = vids[active];
    userPaused = !userPaused;
    toggle.classList.toggle('is-paused', userPaused);
    toggle.setAttribute('aria-label', userPaused ? 'Play destination reel' : 'Pause destination reel');
    if (userPaused) v.pause(); else v.play().catch(() => {});
  });
  if (reduced) { toggle.classList.add('is-paused'); toggle.setAttribute('aria-label', 'Play destination reel'); }

  // pause when the hero is off-screen (saves battery), resume when back
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    const v = vids[active];
    if (!inView) v.pause(); else if (!userPaused && idx >= 0) v.play().catch(() => {});
  }, { threshold: 0.05 }).observe($('.hero'));

  return {
    start() { go(0); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
  };
})();

/* ----------------------------------------------------------------
   Intro curtain + hero entrance
---------------------------------------------------------------- */
const heroWords = splitWords($('.hero-title'));
function heroIn() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.hero-frame', { scale: 1.08, duration: 1.8, ease: 'expo.out' }, 0)
    .from('.pill', { y: 20, opacity: 0, duration: 0.8 }, 0.25)
    .from(heroWords, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.3)
    .from('[data-hero-fade]', { y: 24, opacity: 0, duration: 0.9, stagger: 0.12 }, 0.65)
    .from('[data-hero-bottom] > *', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.85)
    .from('.nav', { y: -20, opacity: 0, duration: 0.8 }, 0.5)
    .from('.scroll-cue', { opacity: 0, duration: 0.8 }, 1.1);
  return tl;
}
if (reduced) {
  Reel.start();
} else {
  lenis?.stop();
  window.scrollTo(0, 0);
  gsap.timeline()
    .to('.intro-mark', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
    .to('.intro-bar span', { width: '100%', duration: 0.9, ease: 'power2.inOut' }, 0.2)
    .add(() => Reel.start(), 0.6)
    .to('.intro-mark, .intro-bar', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.in' }, 1.15)
    .to('.intro', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 1.35)
    .add(heroIn(), 1.65)
    .add(() => { $('.intro')?.remove(); lenis?.start(); });
}

/* Hero scroll: the full-bleed reel tucks into a rounded card as you leave it */
if (!reduced) {
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .fromTo('[data-hero-frame]', { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: 'inset(8% 3% 0% 3% round 28px)', ease: 'none' }, 0)
    .to('[data-hero-content]', { yPercent: -30, opacity: 0, ease: 'none' }, 0)
    .to('[data-hero-bottom]', { opacity: 0, ease: 'none', duration: 0.4 }, 0)
    .to('.hero-media', { yPercent: 12, ease: 'none' }, 0);
}

/* ----------------------------------------------------------------
   Generic reveals
---------------------------------------------------------------- */
if (!reduced) {
  $$('[data-split]').forEach((el) => {
    if (el.classList.contains('hero-title')) return;
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  $$('[data-reveal]').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  ScrollTrigger.batch('[data-card]', {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }),
  });
}

/* ----------------------------------------------------------------
   Track My Tour — live route map synced with the trip chat
---------------------------------------------------------------- */
(() => {
  const root = $('[data-live]');
  const legs = $$('.leg', root);
  const stopsEl = $$('.stop', root);
  const coach = $('[data-coach]', root);
  const clock = $('[data-map-clock]', root);
  const nextEl = $('[data-next]', root), etaEl = $('[data-eta]', root);
  const bar = $('[data-trip-bar]', root);
  const notified = $('[data-notified]', root);
  const feedEl = $('[data-chat-feed]', root);
  const stops = [
    { name: 'Bengaluru', t: '06:10', msg: 'Coach departed Bengaluru — 42 students and 4 teachers on board.' },
    { name: 'Mysuru', t: '08:45', msg: 'Breakfast stop in Mysuru. Headcount 46 / 46 ✓' },
    { name: 'Kushalnagar', t: '10:30', msg: 'At the Golden Temple, Bylakuppe — visit started.' },
    { name: 'Madikeri', t: '11:50', msg: 'Checked in at the homestay. Rooms allotted.' },
    { name: 'Abbey Falls', t: '13:15', msg: 'Reached Abbey Falls. Parents have been notified.' },
  ];
  const extra = [
    { me: true, text: 'Can we add the Dubare elephant camp tomorrow?' },
    { t: '12:04', text: 'Done — added for 9:00 am. Updated itinerary shared with parents.' },
  ];
  const lens = legs.map((l) => l.getTotalLength());
  const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
  const typing = h('div', 'ctyping', '<i></i><i></i><i></i>');
  typing.hidden = true;
  const list = h('div', 'cfeed-list');
  feedEl.append(list, typing);

  // Two interchangeable views: the inline SVG sketch (instant) and the real map (loaded on demand).
  const svgView = {
    reset() { legs.forEach((l, i) => { l.style.strokeDasharray = lens[i]; l.style.strokeDashoffset = lens[i]; }); },
    progress(i, t) {
      legs.forEach((l, j) => { l.style.strokeDashoffset = j < i ? 0 : j === i ? lens[j] * (1 - t) : lens[j]; });
      const pt = legs[i].getPointAtLength(lens[i] * t);
      gsap.set(coach, { x: pt.x, y: pt.y });
    },
    arrive(i) { stopsEl.forEach((s, j) => { s.classList.toggle('is-on', j <= i); s.classList.toggle('is-current', j === i); }); },
    focus() {}, overview() {},
  };
  let view = svgView;
  const st = { leg: 0, t: 0, at: 0 };
  const setProgress = (i, t) => { st.leg = i; st.t = t; view.progress(i, t); };

  const msgEl = (m) => m.me
    ? h('div', 'cm me', esc(m.text))
    : h('div', 'cm', `<time>${m.t}</time>${esc(m.text)}`);
  function push(m, animate = true) {
    typing.hidden = true;
    const el = msgEl(m);
    list.appendChild(el);
    while (list.children.length > 4) list.firstElementChild.remove();
    if (animate) gsap.fromTo(el, { y: 12, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' });
  }
  function arrive(i) {
    st.at = i;
    view.arrive(i);
    clock.textContent = stops[i].t;
    const last = i === stops.length - 1;
    nextEl.textContent = last ? stops[i].name : stops[i + 1].name;
    nextEl.previousElementSibling.textContent = last ? 'Destination' : 'Next stop';
    etaEl.textContent = last ? stops[i].t : stops[i + 1].t;
    $('.mp-eta .mp-k', root).textContent = last ? 'Arrived' : 'Arriving';
    bar.style.width = `${(i / (stops.length - 1)) * 100}%`;
    if (i > 0) { notified.classList.remove('flash'); void notified.offsetWidth; notified.classList.add('flash'); }
  }
  function reset() {
    view.reset();
    list.innerHTML = ''; typing.hidden = true;
    setProgress(0, 0);
    arrive(0);
    view.overview();
  }

  // swap in the real map shortly before the section scrolls into view
  const card = $('.map-card', root), glEl = $('[data-map-gl]', root);
  const mapPadding = () => (window.innerWidth <= 560
    ? { top: 80, right: 64, bottom: 44, left: 84 }
    : { top: 130, right: 90, bottom: Math.min(250, card.clientHeight * 0.4), left: 120 });
  const loadMap = () => import('./livemap.js')
    .then((mod) => mod.createMapView(glEl, { padding: mapPadding }))
    .then((gl) => {
      view = gl;
      if (import.meta.env.DEV) window.liveMap = gl.map;
      card.classList.add('has-gl');
      gl.arrive(st.at);
      gl.progress(st.leg, st.t);
      gl.map.resize();
    })
    .catch((err) => { console.warn('Live map unavailable, using the sketch map instead.', err); });
  // after the page (and hero video) has loaded, in an idle moment, once the section is near
  const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200));
  const afterLoad = (fn) => (document.readyState === 'complete' ? idle(fn) : window.addEventListener('load', () => idle(fn), { once: true }));
  ScrollTrigger.create({ trigger: root, start: 'top 140%', once: true, onEnter: () => afterLoad(loadMap) });

  if (reduced) {
    setProgress(legs.length - 1, 1);
    arrive(stops.length - 1);
    [stops[3], ...extra, stops[4]].forEach((m) => push(m.name ? { t: m.t, text: m.msg } : m, false));
    return;
  }

  let proxy = null;
  const drive = (i, ms) => new Promise((res) => {
    const a = mins(stops[i].t), b = mins(stops[i + 1].t);
    proxy = { t: 0 };
    view.focus(i);
    gsap.to(proxy, { t: 1, duration: ms / 1000, ease: 'power1.inOut', onUpdate: () => {
      setProgress(i, proxy.t);
      clock.textContent = fmt(a + (b - a) * proxy.t);
      bar.style.width = `${((i + proxy.t) / (stops.length - 1)) * 100}%`;
    }, onComplete: res });
  });

  reset();
  looper(root, async (wait) => {
    for (;;) {
      reset();
      await wait(1200);
      push({ t: stops[0].t, text: stops[0].msg });
      await wait(1400);
      for (let i = 0; i < legs.length; i++) {
        await Promise.all([drive(i, 3200), wait(3200)]);
        arrive(i + 1);
        typing.hidden = false;
        await wait(800);
        push({ t: stops[i + 1].t, text: stops[i + 1].msg });
        if (i + 1 === 3) {
          await wait(1500); push(extra[0]);
          await wait(900); typing.hidden = false;
          await wait(800); push(extra[1]);
        }
        await wait(1300);
      }
      view.overview();
      await wait(4200);
    }
  }, () => { if (proxy) gsap.killTweensOf(proxy); });

})();

/* ----------------------------------------------------------------
   Feature bento — each card runs a small looping story while on screen.
   Every loop uses a generation token so leaving/re-entering never
   leaves stray timers or duplicate elements behind.
---------------------------------------------------------------- */
function looper(trigger, run, onStop) {
  let gen = 0;
  const timers = new Set();
  const wait = (ms, g) => new Promise((res, rej) => {
    const t = setTimeout(() => { timers.delete(t); g === gen ? res() : rej(new Error('stale')); }, ms);
    timers.add(t);
  });
  const stop = () => { gen++; timers.forEach(clearTimeout); timers.clear(); onStop?.(); };
  const start = () => { stop(); const g = gen; run((ms) => wait(ms, g)).catch(() => {}); };
  if (reduced) return;
  ScrollTrigger.create({ trigger, start: 'top 85%', end: 'bottom 10%', onToggle: (s) => (s.isActive ? start() : stop()) });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (ScrollTrigger.isInViewport(trigger, 0.15)) start(); });
}

/* 1 — lock-screen notifications */
(() => {
  const stack = $('[data-notifs]');
  const clock = $('[data-lock-time]');
  const items = [
    { t: '07:45', m: 'Coach reached Alleppey — 46 / 46 on board' },
    { t: '09:10', m: 'Houseboat check-in complete ✓' },
    { t: '11:24', m: 'Backwater cruise started · back by 1 pm' },
    { t: '13:05', m: 'Lunch served on board · headcount 46 / 46' },
    { t: '16:40', m: 'Sunset at Vembanad Lake — photos shared' },
    { t: '19:30', m: 'Dinner done. Medical kit restocked ✓' },
  ];
  const make = (it) => h('div', 'notif', `<span class="app"><img src="${BASE}media/brand/emblem.png" alt=""></span><div class="txt"><div class="row"><b>Track My Tour</b><span>${it.t}</span></div><p>${esc(it.m)}</p></div>`);
  const layout = () => $$('.notif', stack).forEach((n, i) => n.setAttribute('data-pos', String(Math.min(i, 3))));
  let k = 0;
  const push = () => {
    const it = items[k % items.length]; k++;
    clock.textContent = it.t;
    const n = make(it);
    n.classList.add('is-entering');
    stack.prepend(n);
    layout();
    requestAnimationFrame(() => requestAnimationFrame(() => n.classList.remove('is-entering')));
    $$('.notif', stack).slice(4).forEach((x) => x.remove());
  };
  // seed with two so the card never looks empty
  push(); push();
  looper($('.b-live'), async (wait) => { for (;;) { await wait(2600); push(); } });
})();

/* 2 — safety ring + checklist */
(() => {
  const ring = $('[data-ring]'), num = $('[data-ring-num]');
  const lis = $$('.checklist li');
  const C = 326.73;
  const set = (n) => {
    lis.forEach((li, i) => li.classList.toggle('is-done', i < n));
    num.textContent = n;
    ring.style.transition = 'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)';
    ring.style.strokeDashoffset = String(C * (1 - n / lis.length));
  };
  if (reduced) { set(lis.length); return; }
  set(0);
  looper($('.b-medical'), async (wait) => {
    for (;;) {
      set(0); await wait(700);
      for (let n = 1; n <= lis.length; n++) { set(n); await wait(750); }
      await wait(3200);
    }
  });
})();

/* 3 — coordinator thread types itself out */
(() => {
  const msgs = $$('.thread .t-msg');
  const typing = $('.thread .t-typing');
  const show = (el) => { el.classList.add('is-on'); gsap.fromTo(el, { y: 8, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' }); };
  looper($('.b-coord'), async (wait) => {
    for (;;) {
      msgs.forEach((m, i) => m.classList.toggle('is-on', i === 0));
      typing.classList.remove('is-on');
      await wait(900);
      for (const m of msgs.slice(1)) {
        const mine = m.classList.contains('t-me');
        if (!mine) { typing.classList.add('is-on'); await wait(1100); typing.classList.remove('is-on'); }
        else await wait(700);
        show(m);
        await wait(900);
      }
      await wait(4000);
    }
  });
})();

/* 4 — booking pipeline confirms step by step */
(() => {
  const steps = $$('.pipe-steps .step');
  const fill = $('[data-pipe-fill]');
  const done = $('[data-pipe-done]');
  const set = (n) => {
    steps.forEach((s, i) => {
      s.classList.toggle('is-done', i < n);
      s.classList.toggle('is-wait', i > n);
      $('em span', s).textContent = i < n ? 'Confirmed' : i === n ? 'Booking' : 'Queued';
    });
    fill.style.width = `${(Math.max(0, n - 1) / (steps.length - 1)) * 100}%`;
    done.classList.toggle('is-on', n >= steps.length);
  };
  if (reduced) { set(steps.length); return; }
  set(0);
  looper($('.b-book'), async (wait) => {
    for (;;) {
      set(0); await wait(900);
      for (let n = 1; n <= steps.length; n++) { set(n); await wait(850); }
      await wait(3400);
    }
  });
})();

/* ----------------------------------------------------------------
   Day trips & learning visits — photo cards + venue drawer
---------------------------------------------------------------- */
const Drawer = (() => {
  const root = $('[data-drawer]');
  const panel = $('.drawer-panel', root);
  const backdrop = $('.drawer-backdrop', root);
  const body = $('[data-drawer-body]', root);
  let last = null;
  gsap.set(panel, { xPercent: 100 });
  function open(c) {
    last = document.activeElement;
    body.innerHTML = `
      <div class="drawer-hero"><img src="${c.src}" alt="${esc(c.label)}"><div class="drawer-hero-shade"></div>
        <div class="drawer-hero-copy"><span class="b-kicker">${c.venues.length} venues</span><h3 id="drawer-title">${esc(c.label)}</h3></div></div>
      <div class="drawer-content">
        <p class="drawer-lead"><b>${esc(c.lead)}</b> ${esc(c.desc)}</p>
        <ul class="venue-list">${c.venues.map((v) => `<li><span class="vi"></span>${esc(v)}</li>`).join('')}</ul>
      </div>
      <div class="drawer-foot">
        <button class="btn btn-light btn-block" type="button" data-enquire data-dest="${esc(c.label)}" data-type="School / college tour">Plan a ${esc(c.label.toLowerCase())} visit</button>
        <p>Pick one or more venues — we'll handle transport, tickets and supervision.</p>
      </div>`;
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    if (reduced) { gsap.set([backdrop, panel], { opacity: 1, xPercent: 0 }); }
    else {
      gsap.to(backdrop, { opacity: 1, duration: 0.3 });
      gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.6, ease: 'expo.out' });
      gsap.from($$('.venue-list li', body), { y: 10, opacity: 0, duration: 0.4, ease: 'power3.out', stagger: 0.03, delay: 0.2 });
    }
    setTimeout(() => $('.modal-close', root).focus(), 60);
  }
  function close(keepLocked = false) {
    if (!root.classList.contains('is-open')) return;
    const done = () => {
      root.classList.remove('is-open'); root.setAttribute('aria-hidden', 'true');
      if (!keepLocked) { document.body.style.overflow = ''; lenis?.start(); last?.focus?.(); }
    };
    if (reduced) return done();
    gsap.to(backdrop, { opacity: 0, duration: 0.25 });
    gsap.to(panel, { xPercent: 100, duration: 0.4, ease: 'power3.in', onComplete: done });
  }
  root.addEventListener('click', (e) => { if (e.target.closest('[data-drawer-close]')) close(); });
  return { open, close, isOpen: () => root.classList.contains('is-open'), root };
})();

(() => {
  const grid = $('[data-cat-grid]');
  const layout = ['wide', '', '', '', '', 'wide', 'wide', 'wide'];
  categories.forEach((c, i) => {
    const b = h('button', `cat-card ${layout[i] || ''}`);
    b.type = 'button';
    b.setAttribute('aria-label', `${c.label} — see ${c.venues.length} venues`);
    b.innerHTML = `
      <img src="${c.src}" alt="" loading="lazy">
      <span class="cat-shade"></span>
      <span class="cat-count">${c.venues.length} venues</span>
      <span class="cat-body">
        <span class="cat-title">${esc(c.label)}</span>
        <span class="cat-lead">${esc(c.lead)}</span>
        <span class="cat-peek">${c.venues.slice(0, 3).map((v) => `<span>${esc(v)}</span>`).join('')}${c.venues.length > 3 ? `<span class="more">+${c.venues.length - 3} more</span>` : ''}</span>
      </span>
      <span class="cat-go" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>`;
    b.setAttribute('data-card', '');
    if (!reduced) gsap.set(b, { opacity: 0, y: 28 });
    b.addEventListener('click', () => Drawer.open(c));
    grid.appendChild(b);
  });
  if (!reduced) ScrollTrigger.batch('.cat-card', { start: 'top 90%', onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }) });
})();

/* ----------------------------------------------------------------
   Tours across India & abroad — expanding panels
---------------------------------------------------------------- */
(() => {
  const filterWrap = $('[data-tour-filters]');
  const wrap = $('[data-panels]');
  const arrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const canHover = window.matchMedia('(hover: hover)').matches;
  let r = -1, panels = [];

  const pills = regions.map((reg, i) => {
    const b = h('button', 'tour-filter', `${esc(reg.name)}<span>${reg.trips.length}</span>`);
    b.type = 'button'; b.setAttribute('role', 'tab');
    b.addEventListener('click', () => show(i, true));
    filterWrap.appendChild(b);
    return b;
  });

  function open(i) {
    panels.forEach((p, j) => {
      const on = j === i;
      p.classList.toggle('is-open', on);
      $('.panel-hit', p).setAttribute('aria-expanded', String(on));
      $$('.panel-c a, .panel-c button', p).forEach((el) => { el.tabIndex = on ? 0 : -1; });
    });
  }

  function show(i, user) {
    if (i === r) return;
    r = i;
    const reg = regions[i];
    pills.forEach((b, j) => { b.classList.toggle('is-on', j === i); b.setAttribute('aria-selected', String(j === i)); });
    if (user && filterWrap.scrollWidth > filterWrap.clientWidth) filterWrap.scrollTo({ left: pills[i].offsetLeft - 24, behavior: reduced ? 'auto' : 'smooth' });
    const render = () => {
      wrap.innerHTML = reg.trips.map((t, j) => {
        const wa = `https://wa.me/919686854872?text=${encodeURIComponent(`Hi Aviora! I'd like to know more about the ${t.title} tour.`)}`;
        return `<div class="panel">
          <img src="${t.thumb}" srcset="${t.thumb} 700w, ${t.src} 1600w" sizes="(max-width: 760px) 100vw, 60vw" alt="" loading="lazy">
          <button class="panel-hit" type="button" aria-label="${esc(t.title)}"></button>
          <span class="panel-n">${String(j + 1).padStart(2, '0')}</span>
          <span class="panel-v" aria-hidden="true">${esc(t.title)}</span>
          <div class="panel-c">
            <small>${esc(t.tag)}</small>
            <h3>${esc(t.title)}</h3>
            <div class="panel-btns">
              <button class="btn btn-light btn-lg" type="button" data-enquire data-dest="${esc(t.title)}" data-type="${esc(reg.type)}">Get a quote${arrow}</button>
              <a class="btn btn-glass btn-lg" href="${wa}" target="_blank" rel="noopener">Ask on WhatsApp</a>
            </div>
          </div>
        </div>`;
      }).join('');
      wrap.style.setProperty('--open', Math.max(5, reg.trips.length));
      panels = $$('.panel', wrap);
      panels.forEach((p, j) => {
        $('.panel-hit', p).addEventListener('click', () => open(j));
        if (canHover) p.addEventListener('mouseenter', () => open(j));
      });
      open(0);
      if (!reduced) {
        gsap.fromTo(panels, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04, clearProps: 'opacity,transform' });
      }
    };
    if (user && !reduced && panels.length) gsap.to(panels, { opacity: 0, y: -12, duration: 0.25, ease: 'power2.in', stagger: 0.03, onComplete: render });
    else render();
  }
  show(0, false);
  $$('[data-region-link]').forEach((a) => a.addEventListener('click', () => show(regions.findIndex((x) => x.name === a.dataset.regionLink), true)));
  if (!reduced) gsap.from('[data-inc]', { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.includes', start: 'top 90%' } });
})();

/* ----------------------------------------------------------------
   Clients — counter + two opposite marquees
---------------------------------------------------------------- */
(() => {
  const fill = (el, list) => {
    [...list, ...list].forEach((c, i) => {
      const t = h('div', 'logo-tile', `<img src="${c.src}" alt="${i < list.length ? esc(c.name) : ''}" loading="lazy">`);
      if (i >= list.length) t.setAttribute('aria-hidden', 'true');
      el.appendChild(t);
    });
  };
  const half = Math.ceil(clients.length / 2);
  fill($('[data-clients-a]'), clients.slice(0, half).concat(clients.slice(half)));
  fill($('[data-clients-b]'), clients.slice(half).concat(clients.slice(0, half)));
  const num = $('[data-count]');
  const target = +num.dataset.count;
  if (reduced) { num.textContent = target; return; }
  const o = { v: 0 };
  gsap.to(o, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: () => { num.textContent = Math.round(o.v); }, scrollTrigger: { trigger: num, start: 'top 85%' } });
})();

/* ----------------------------------------------------------------
   FAQ accordion
---------------------------------------------------------------- */
$$('.faq-item').forEach((item) => {
  const btn = $('button', item), panel = $('.faq-a', item);
  btn.addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    $$('.faq-item.is-open').forEach((o) => {
      if (o === item) return;
      o.classList.remove('is-open'); $('button', o).setAttribute('aria-expanded', 'false');
      gsap.to($('.faq-a', o), { height: 0, duration: reduced ? 0 : 0.4, ease: 'power3.inOut' });
    });
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    gsap.fromTo(panel, { height: open ? 0 : panel.offsetHeight }, { height: open ? 'auto' : 0, duration: reduced ? 0 : 0.45, ease: 'power3.inOut' });
  });
});

/* ----------------------------------------------------------------
   Trip builder — boarding pass
---------------------------------------------------------------- */
const plan = {};
(() => {
  const root = $('[data-planner]');
  const pass = $('[data-pass]', root);
  const WHO = [
    { label: 'School', type: 'School / college tour' },
    { label: 'College', type: 'School / college tour' },
    { label: 'Corporate', type: 'Corporate / group outing' },
    { label: 'Family & friends', short: 'Family', type: null },
  ];
  const TO = [
    { name: 'Coorg', code: 'CRG' }, { name: 'Mysuru', code: 'MYS' }, { name: 'Kerala', code: 'COK' }, { name: 'Goa', code: 'GOI' },
    { name: 'Delhi · Agra', code: 'AGR' }, { name: 'Manali', code: 'KUU' }, { name: 'Singapore', code: 'SIN', intl: true }, { name: 'Dubai', code: 'DXB', intl: true },
  ];
  const now = new Date();
  const WHEN = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
    return { label: d.toLocaleString('en-GB', { month: 'short' }) + (i === 0 || d.getMonth() === 0 ? ` ’${String(d.getFullYear()).slice(2)}` : ''),
      flap: `${d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()} ${d.getFullYear()}`,
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` };
  });
  const state = { who: 0, to: 0, when: 0, size: 40 };

  const groups = {};
  [['who', WHO.map((w) => w.label)], ['to', TO.map((t) => t.name)], ['when', WHEN.map((w) => w.label)]].forEach(([key, labels]) => {
    const wrap = $(`[data-pl="${key}"]`, root);
    groups[key] = labels.map((l, i) => {
      const b = h('button', 'pl-opt', esc(l)); b.type = 'button'; b.setAttribute('role', 'radio');
      b.addEventListener('click', () => { state[key] = i; sync(key); });
      wrap.appendChild(b); return b;
    });
  });

  const range = $('[data-pl-size]', root), sizeOut = $('[data-pl-size-out]', root);
  const paintRange = () => range.style.setProperty('--p', `${((state.size - range.min) / (range.max - range.min)) * 100}%`);
  range.addEventListener('input', () => { state.size = +range.value; sizeOut.textContent = state.size; paintRange(); sync('size'); });

  // split-flap: letters shuffle before settling
  const CH = [...Array(26)].map((_, i) => String.fromCharCode(65 + i)).join('') + '0123456789';
  const flapTweens = new Map();
  function flap(el, text, instant) {
    flapTweens.get(el)?.kill();
    if (instant || reduced || el.textContent === text) { el.textContent = text; return; }
    const o = { p: 0 };
    flapTweens.set(el, gsap.to(o, { p: 1, duration: 0.55, ease: 'none', onUpdate: () => {
      const done = Math.floor(o.p * text.length);
      el.textContent = text.split('').map((c, i) => (i < done || c === ' ' || c === '·' ? c : CH[(Math.random() * CH.length) | 0])).join('');
    }, onComplete: () => { el.textContent = text; } }));
  }
  const hash = (str) => { let x = 2166136261; for (const c of str) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
  const barcode = $('[data-barcode]', root);
  function drawBarcode(seed) {
    let x = 0, r = seed, out = '';
    while (x < 100) { r = Math.imul(r ^ (r >>> 13), 1274126177) >>> 0; const w = 0.6 + (r % 4) * 0.55; if (r & 16) out += `<rect x="${x.toFixed(2)}" width="${w.toFixed(2)}" height="40"/>`; x += w + 0.5 + ((r >>> 5) % 3) * 0.4; }
    barcode.innerHTML = out;
  }
  const f = (k) => $(`[data-f="${k}"]`, pass);
  const plane = $('[data-pass-plane]', pass);

  function sync(changed, instant = false) {
    Object.entries(groups).forEach(([k, btns]) => btns.forEach((b, i) => { b.classList.toggle('is-on', i === state[k]); b.setAttribute('aria-checked', String(i === state[k])); }));
    const who = WHO[state.who], to = TO[state.to], when = WHEN[state.when];
    flap(f('to'), to.code, instant);
    f('toName').textContent = to.name;
    flap(f('who'), (who.short || who.label).toUpperCase(), instant);
    flap(f('size'), String(state.size).padStart(3, '0'), instant || changed === 'size');
    flap(f('when'), when.flap, instant);
    flap(f('cls'), to.intl ? 'ABROAD' : 'DOMESTIC', instant);
    const code = `AVT-${(hash(`${state.who}${state.to}${state.when}${state.size}`) % 9000 + 1000)}`;
    flap(f('code'), code, instant || changed === 'size');
    drawBarcode(hash(code));
    Object.assign(plan, {
      type: who.type || (to.intl ? 'International holiday' : 'Domestic holiday'), dest: to.name, size: state.size, month: when.value,
      text: `Hi Aviora! I'd like a quote: ${who.label} trip to ${to.name} for ${state.size} travellers in ${when.flap.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}.`,
    });
    $('[data-pl-wa]', root).href = `https://wa.me/919686854872?text=${encodeURIComponent(plan.text)}`;
    if (!instant && !reduced && changed !== 'size') {
      gsap.fromTo(plane, { left: '0%', opacity: 0 }, { left: '100%', opacity: 1, duration: 0.9, ease: 'power2.inOut', onComplete: () => gsap.to(plane, { left: '50%', duration: 0.6, ease: 'power3.out' }) });
      gsap.fromTo(pass, { rotate: -0.6 }, { rotate: 0, duration: 0.6, ease: 'elastic.out(1, .4)' });
    }
  }
  paintRange();
  sync(null, true);

  $('[data-pl-send]', root).addEventListener('click', () => openModal({ dest: plan.dest, type: plan.type, size: plan.size, month: plan.month, message: plan.text }));

  // pass prints out of the slot when scrolled into view
  if (!reduced) {
    gsap.fromTo(pass, { yPercent: -100, clipPath: 'inset(100% 0 0 0)' }, { yPercent: 0, clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power3.out',
      scrollTrigger: { trigger: '.pass-stage', start: 'top 75%' }, onComplete: () => gsap.set(pass, { clearProps: 'clipPath' }) });
    gsap.from('.pass-actions .btn', { opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.9, scrollTrigger: { trigger: '.pass-stage', start: 'top 75%' } });
  }
})();

/* footer mega wordmark rises in */
(() => {
  const mega = $('[data-mega]');
  mega.innerHTML = mega.textContent.split('').map((ch) => `<span class="ml">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  if (!reduced) gsap.from($$('.ml', mega), { yPercent: 100, duration: 1.1, ease: 'power4.out', stagger: 0.035, scrollTrigger: { trigger: '.footer-mega', start: 'top 95%' } });
})();

/* ----------------------------------------------------------------
   Magnetic primary buttons (desktop only)
---------------------------------------------------------------- */
if (!reduced && finePointer) {
  $$('.hero-ctas .btn, .pass-actions .btn').forEach((b) => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3.out' });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

/* ----------------------------------------------------------------
   Enquiry: inline form + modal
---------------------------------------------------------------- */
mountEnquiry($('#enquire [data-form-slot]'));
const modal = $('[data-modal]');
const modalCard = $('.modal-card', modal);
const modalBackdrop = $('.modal-backdrop', modal);
let lastFocus = null;
function openModal(prefill = {}) {
  mountEnquiry($('[data-modal-slot]'));
  const f = $('[data-modal-slot] form', modal);
  if (f && prefill.dest) f.elements.destination.value = prefill.dest;
  if (f && prefill.type) f.elements.trip_type.value = prefill.type;
  if (f && prefill.size) f.elements.group_size.value = prefill.size;
  if (f && prefill.month) f.elements.travel_month.value = prefill.month;
  if (f && prefill.message) f.elements.message.value = prefill.message;
  lastFocus = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  lenis?.stop();
  document.body.style.overflow = 'hidden';
  gsap.to(modalBackdrop, { opacity: 1, duration: 0.3 });
  gsap.fromTo(modalCard, { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' });
  setTimeout(() => $('input[name="name"]', modal)?.focus(), 80);
}
function closeModal() {
  gsap.to(modalBackdrop, { opacity: 0, duration: 0.25 });
  gsap.to(modalCard, { opacity: 0, y: 16, duration: 0.25, ease: 'power2.in', onComplete: () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lenis?.start();
    lastFocus?.focus?.();
  } });
}
document.addEventListener('click', (e) => {
  const enq = e.target.closest('[data-enquire]');
  if (enq) {
    e.preventDefault(); closeMenu();
    const fromDrawer = Drawer.isOpen();
    if (fromDrawer) Drawer.close(true);
    openModal({ dest: enq.dataset.dest, type: enq.dataset.type });
  }
  else if (e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  else if (e.key === 'Escape' && Drawer.isOpen()) Drawer.close();
  if (e.key === 'Tab' && modal.classList.contains('is-open')) {
    const f = $$('button, [href], input, select, textarea', modalCard).filter((x) => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});

$('[data-year]').textContent = new Date().getFullYear();
window.addEventListener('load', () => ScrollTrigger.refresh());

// dev-only handles for debugging in the console
if (import.meta.env.DEV) Object.assign(window, { gsap, ScrollTrigger, lenis });
