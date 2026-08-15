/**
 * IKAMETI — Ikamet Card Showcase
 * Scroll-driven, pinned section: the residence-permit clip is scrubbed by
 * scroll position while four step blocks fade in/out around it.
 *
 * Progressive enhancement: without GSAP, without JS, or under
 * prefers-reduced-motion the section stays a plain stacked block with a poster
 * image and IntersectionObserver fade-ins. Nothing below depends on the video
 * loading successfully.
 */
(function () {
  'use strict';

  var STEP_COUNT = 4;
  var MOBILE_BREAKPOINT = 768;
  /** Fallback if metadata never arrives; the supplied clip is 10s. */
  var FALLBACK_DURATION = 10;
  /** Don't re-seek for sub-frame deltas — pointless work and it stutters. */
  var SEEK_EPSILON = 0.02;

  function init() {
    var section = document.getElementById('ikamet-showcase');
    if (!section) return;

    var pin = section.querySelector('.ikamet-showcase__pin');
    var stage = section.querySelector('.ikamet-showcase__stage');
    var media = section.querySelector('.ikamet-showcase__media');
    var video = section.querySelector('video');
    var steps = Array.prototype.slice.call(
      section.querySelectorAll('.ikamet-showcase__step')
    );
    var dots = Array.prototype.slice.call(
      section.querySelectorAll('.ikamet-showcase__dot')
    );

    if (!pin || !stage || !steps.length) return;

    var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var hasGsap = !!(window.gsap && window.ScrollTrigger);

    /* ---------------------------------------------------------------
     * Direction: mirror all horizontal travel in RTL (ar / fa / af).
     * --------------------------------------------------------------- */
    function syncDirection() {
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      stage.style.setProperty('--sc-dir', rtl ? '-1' : '1');
    }
    syncDirection();

    /* ---------------------------------------------------------------
     * Lazy video loading — src is only attached when the section is
     * within one viewport, so the clip never competes with the hero.
     * --------------------------------------------------------------- */
    var videoRequested = false;

    function loadVideo() {
      if (videoRequested || !video) return;
      videoRequested = true;
      var src = video.getAttribute('data-src');
      if (src && !video.getAttribute('src')) {
        video.setAttribute('src', src);
        video.load();
      }
    }

    if (video && 'IntersectionObserver' in window) {
      var preloadObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              loadVideo();
              preloadObserver.disconnect();
            }
          });
        },
        /* 100% (a full viewport of lead-in) put the section inside the root
         * margin while the page was still loading — the 7MB clip started
         * downloading alongside the hero, which is exactly what deferring it
         * was meant to avoid. 40% still gives the fetch a head start without
         * racing first paint. */
        { rootMargin: '40% 0px' }
      );
      preloadObserver.observe(section);
    } else {
      loadVideo();
    }

    /* ---------------------------------------------------------------
     * Static fallback: reduced motion, no GSAP, or no JS-driven scroll.
     * --------------------------------------------------------------- */
    function enableStaticMode() {
      section.classList.remove('is-scroll-enabled');
      /* Releases the 100vh the pin reserves from first paint (see
       * card-showcase.css) — the static layout sizes to its own content. */
      section.classList.add('is-static');

      if (video) {
        video.removeAttribute('autoplay');
        video.pause();
      }

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );
        steps.forEach(function (step) {
          io.observe(step);
        });
      } else {
        steps.forEach(function (step) {
          step.classList.add('is-visible');
        });
      }
    }

    /* ---------------------------------------------------------------
     * Should we scrub on this device?
     * Mobile keeps the pin but drops to autoplay-once on data-saver or
     * low-memory hardware, where seeking a video per frame is not viable.
     * --------------------------------------------------------------- */
    function canScrubVideo() {
      if (!video) return false;
      if (window.innerWidth >= MOBILE_BREAKPOINT) return true;

      var conn = navigator.connection;
      if (conn && (conn.saveData === true || /2g/.test(conn.effectiveType || ''))) {
        return false;
      }
      if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) {
        return false;
      }
      return true;
    }

    /** Play the clip through once when the section comes into view. */
    function autoplayOnce() {
      if (!video || !('IntersectionObserver' in window)) return;
      var played = false;
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !played) {
              played = true;
              loadVideo();
              video.muted = true;
              var p = video.play();
              if (p && p.catch) p.catch(function () { /* autoplay blocked */ });
              io.disconnect();
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(section);
    }

    if (reduceMotionQuery.matches || !hasGsap) {
      enableStaticMode();
      if (!reduceMotionQuery.matches && video) autoplayOnce();
      return;
    }

    /* ---------------------------------------------------------------
     * Scroll-driven mode
     * --------------------------------------------------------------- */
    section.classList.add('is-scroll-enabled');

    var scrubVideo = canScrubVideo();
    if (!scrubVideo) autoplayOnce();

    var duration = FALLBACK_DURATION;
    if (video) {
      video.addEventListener('loadedmetadata', function () {
        if (isFinite(video.duration) && video.duration > 0) {
          duration = video.duration;
        }
      });
    }

    /* One rAF-batched write pass. ScrollTrigger's onUpdate only records the
     * progress; every DOM/media write happens here, so scroll handlers never
     * touch layout directly. */
    var targetProgress = 0;
    var queued = false;
    var lastSeek = -1;
    var lastStep = -1;

    function render() {
      queued = false;
      var p = targetProgress;

      if (scrubVideo && video && video.readyState >= 1) {
        var t = Math.max(0, Math.min(duration - 0.001, p * duration));
        if (Math.abs(t - lastSeek) > SEEK_EPSILON) {
          lastSeek = t;
          try {
            video.currentTime = t;
          } catch (e) {
            /* seek not ready yet — next frame retries */
          }
        }
      }

      var step = Math.max(0, Math.min(STEP_COUNT - 1, Math.floor(p * STEP_COUNT)));
      if (step !== lastStep) {
        lastStep = step;
        applyStep(step);
      }
    }

    function requestRender() {
      if (!queued) {
        queued = true;
        requestAnimationFrame(render);
      }
    }

    /* Card travel per step, in --sc-x units (-1 .. 1).
     * Sign is mirrored for RTL by --sc-dir in CSS.
     *   step 1 -> card inline-end,   text inline-start
     *   step 2 -> card inline-start, text inline-end
     *   step 3 -> card inline-end,   text inline-start
     *   step 4 -> card centred, lifted, text centred underneath */
    var CARD_X = [1, -1, 1, 0];
    var CARD_Y = ['0%', '0%', '0%', '-12%'];

    function applyStep(index) {
      stage.style.setProperty('--sc-x', String(CARD_X[index]));
      stage.style.setProperty('--sc-y', CARD_Y[index]);

      steps.forEach(function (step, i) {
        step.classList.toggle('is-active', i === index);
        step.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    applyStep(0);

    /* Explicit registration. The UMD build usually self-registers, but relying
     * on that leaves pin behaviour dependent on script order. */
    if (window.gsap.registerPlugin) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }

    /* Mobile browser chrome collapsing resizes the viewport constantly;
     * without this the pin jumps every time the URL bar hides. */
    window.ScrollTrigger.config({ ignoreMobileResize: true });

    /* pinSpacing stays ON (the default). It makes ScrollTrigger insert a spacer
     * that holds the scroll distance, so the pinned card never overlaps the
     * hero above or the next section below.
     * The end distance is computed in pixels rather than '+=300%' because a
     * percentage there resolves against the trigger's own height, not the
     * viewport; invalidateOnRefresh re-runs this on resize. */
    var trigger = window.ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: function () {
        return '+=' + window.innerHeight * 3;
      },
      pin: pin,
      pinSpacing: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        targetProgress = self.progress;
        requestRender();
      }
    });

    /* ScrollTrigger caches the section's document offset at create time. That
     * measurement is taken before the hero's image and webfonts settle and
     * before i18n swaps in the translated copy, all of which move this section
     * down the page. A stale offset is what makes the pin engage early and sit
     * on top of the hero, so re-measure once everything above has settled. */
    window.addEventListener('load', function () {
      window.ScrollTrigger.refresh();
    });

    /* Translated copy changes text height, and RTL flips the geometry —
     * both need a re-measure. */
    window.addEventListener('languageChanged', function () {
      syncDirection();
      /* One frame later: i18n writes textContent synchronously, but layout for
       * the new string hasn't been computed when the event fires. */
      requestAnimationFrame(function () {
        window.ScrollTrigger.refresh();
      });
    });

    /* Crossing the mobile breakpoint changes whether we scrub at all. */
    var wasMobile = window.innerWidth < MOBILE_BREAKPOINT;
    window.addEventListener('resize', function () {
      var isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (isMobile !== wasMobile) {
        wasMobile = isMobile;
        scrubVideo = canScrubVideo();
      }
    });

    /* Honour a mid-session reduced-motion change. */
    var onReduceChange = function () {
      if (reduceMotionQuery.matches) {
        trigger.kill(true);
        enableStaticMode();
      }
    };
    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener('change', onReduceChange);
    } else if (reduceMotionQuery.addListener) {
      reduceMotionQuery.addListener(onReduceChange);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
