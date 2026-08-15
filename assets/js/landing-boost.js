/**
 * IKAMETI LANDING — conversion + motion layer
 *
 * Scroll reveals, animated stat counters, the floating WhatsApp pill, the
 * sticky mobile CTA bar, and GA4 click tracking.
 *
 * Progressive enhancement throughout: if IntersectionObserver is missing or
 * this script never runs, [data-reveal] elements are simply left visible by
 * the no-JS guard in the <head>, and counters keep their server-rendered text.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------
   * Reading direction — directional reveals mirror in RTL
   * ---------------------------------------------------------------- */
  function syncRevealDirection() {
    var rtl = document.documentElement.getAttribute('dir') === 'rtl';
    document.documentElement.style.setProperty('--rv-dir', rtl ? '-1' : '1');
  }

  /* ----------------------------------------------------------------
   * 1. Scroll reveals
   * ---------------------------------------------------------------- */
  function initReveals() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add('is-revealed');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute('data-reveal-delay'), 10) || 0;
          setTimeout(function () {
            el.classList.add('is-revealed');
          }, delay);
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    Array.prototype.forEach.call(items, function (el) {
      io.observe(el);
    });
  }

  /* ----------------------------------------------------------------
   * 2. Stat counters
   * Markup: <span class="count-up" data-count-to="98" data-count-suffix="%">
   * The element's existing text is the fallback and is only replaced once
   * the animation actually starts.
   * ---------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;

    function format(el, value) {
      var decimals = parseInt(el.getAttribute('data-count-decimals'), 10) || 0;
      var prefix = el.getAttribute('data-count-prefix') || '';
      var suffix = el.getAttribute('data-count-suffix') || '';
      /* toLocaleString keeps Arabic-Indic digits in ar/fa/af, matching the
       * rest of the translated page. */
      var lang = document.documentElement.lang || 'en';
      var num;
      try {
        num = value.toLocaleString(lang, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      } catch (e) {
        num = value.toFixed(decimals);
      }
      return prefix + num + suffix;
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      if (isNaN(target)) return;

      if (reduceMotion) {
        el.textContent = format(el, target);
        return;
      }

      var duration = parseInt(el.getAttribute('data-count-duration'), 10) || 1600;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        /* easeOutExpo — fast start, long settle, reads as "counting up" */
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = format(el, target * eased);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = format(el, target);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(counters, function (el) {
        el.textContent = format(el, parseFloat(el.getAttribute('data-count-to')));
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    Array.prototype.forEach.call(counters, function (el) {
      io.observe(el);
    });
  }

  /* ----------------------------------------------------------------
   * 3. Floating WhatsApp + sticky CTA bar
   * Both appear only after the hero has been scrolled past.
   * ---------------------------------------------------------------- */
  function initStickyCtas() {
    var wa = document.querySelector('.wa-float');
    var bar = document.querySelector('.cta-bar');
    if (!wa && !bar) return;

    var hero = document.querySelector('section.bg-dark');
    var ticking = false;

    function apply() {
      ticking = false;
      var threshold = hero ? hero.offsetHeight * 0.75 : 400;
      var show = window.pageYOffset > threshold;

      /* Hide again over the final CTA band so the fixed buttons don't
       * sit on top of the very buttons they duplicate. This has to be the CTA
       * section itself, not the footer below it: keying off <footer> let the
       * bar cover both final-CTA buttons for the whole height of that band. */
      var finalCta = document.querySelector('.landing-final-cta') ||
                     document.querySelector('footer');
      if (show && finalCta) {
        var rect = finalCta.getBoundingClientRect();
        if (rect.top < window.innerHeight) show = false;
      }

      if (wa) wa.classList.toggle('is-visible', show);
      if (bar) bar.classList.toggle('is-visible', show);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    apply();
  }

  /* ----------------------------------------------------------------
   * 4. GA4 click tracking
   * gtag is already on the page; guard anyway so a blocked analytics
   * script can never break a CTA.
   * ---------------------------------------------------------------- */
  function initTracking() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-track]') : null;
      if (!el) return;
      if (typeof window.gtag !== 'function') return;
      try {
        window.gtag('event', 'cta_click', {
          cta_id: el.getAttribute('data-track'),
          cta_text: (el.textContent || '').trim().slice(0, 60),
          page_language: document.documentElement.lang || 'en'
        });
      } catch (err) {
        /* analytics must never interrupt navigation */
      }
    });
  }

  /* ----------------------------------------------------------------
   * 5. Pointer tilt + cursor highlight on cards
   * Skipped entirely on touch/coarse pointers, where there is no cursor
   * to follow and the tilt would only fire on tap.
   * ---------------------------------------------------------------- */
  function initCardTilt() {
    if (reduceMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var cards = document.querySelectorAll('.card-interactive');
    if (!cards.length) return;

    var MAX_TILT = 5; /* degrees — subtle enough to stay legible */

    Array.prototype.forEach.call(cards, function (card) {
      var frame = null;
      var pending = null;

      function write() {
        frame = null;
        if (!pending) return;
        card.style.setProperty('--tilt-x', pending.tx.toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', pending.ty.toFixed(2) + 'deg');
        card.style.setProperty('--mx', pending.mx.toFixed(1) + '%');
        card.style.setProperty('--my', pending.my.toFixed(1) + '%');
      }

      card.addEventListener('pointermove', function (e) {
        /* getBoundingClientRect is the only read, and it happens before any
         * write; the writes are batched into the next frame. */
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        pending = {
          tx: (0.5 - py) * MAX_TILT * 2,
          ty: (px - 0.5) * MAX_TILT * 2,
          mx: px * 100,
          my: py * 100
        };
        if (!frame) frame = requestAnimationFrame(write);
      });

      card.addEventListener('pointerleave', function () {
        if (frame) {
          cancelAnimationFrame(frame);
          frame = null;
        }
        pending = null;
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  function init() {
    syncRevealDirection();
    initReveals();
    initCounters();
    initStickyCtas();
    initTracking();
    initCardTilt();
  }

  window.addEventListener('languageChanged', syncRevealDirection);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
