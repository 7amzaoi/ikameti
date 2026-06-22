/**
 * IKAMETI — Homepage news box (below the hero).
 * Loads published news from Supabase (via window.IKAMETI_DB.getPublishedNews),
 * shows one item in a card, and lets the visitor flip between items with the
 * arrows or the dots. Re-localises on language change using each item's
 * per-language translations. Hides itself when there is no published news.
 */
(function () {
  'use strict';

  var state = { items: [], index: 0 };

  function $(sel) { return document.querySelector(sel); }
  function currentLang() {
    try {
      if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
        return window.i18n.getCurrentLanguage();
      }
    } catch (e) { /* ignore */ }
    return document.documentElement.lang || 'en';
  }
  function t(key, fallback) {
    if (window.i18n && typeof window.i18n.getTranslation === 'function') {
      var v = window.i18n.getTranslation(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function fmtDate(d) {
    if (!d) return '';
    var date = new Date(d);
    if (isNaN(date.getTime())) return esc(d);
    var lang = currentLang();
    var locale = ['en', 'ar', 'tr', 'ru', 'fa', 'uz', 'af'].indexOf(lang) >= 0 ? lang : 'en';
    try { return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (e) { return date.toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' }); }
  }
  // Turn admin-entered text into safe paragraphs (preserves line breaks).
  function bodyHtml(text) {
    var s = String(text || '').replace(/\r\n?/g, '\n').trim();
    if (!s) return '';
    return s.split(/\n{2,}/).map(function (para) {
      return '<p>' + esc(para).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function localize(item) {
    var lang = currentLang();
    var title = item.title, body = item.body;
    var tr = item.translations && item.translations[lang];
    if (tr && typeof tr === 'object') {
      if (tr.title && tr.title.trim()) title = tr.title;
      if (tr.body && tr.body.trim()) body = tr.body;
    }
    return { title: title, body: body, image: item.image, date: item.date };
  }

  function render() {
    var carousel = $('#news-carousel');
    if (!carousel) return;
    if (!state.items.length) return;

    if (state.index < 0) state.index = state.items.length - 1;
    if (state.index >= state.items.length) state.index = 0;

    var item = localize(state.items[state.index]);
    var multi = state.items.length > 1;
    var prevLabel = t('news_section.prev', 'Previous');
    var nextLabel = t('news_section.next', 'Next');

    var dots = '';
    if (multi) {
      for (var i = 0; i < state.items.length; i++) {
        dots += '<button type="button" class="news-dot' + (i === state.index ? ' active' : '') +
          '" data-news-dot="' + i + '" aria-label="' + (i + 1) + '"></button>';
      }
    }

    carousel.innerHTML =
      '<div class="news-box">' +
        (multi ? '<button type="button" class="news-nav news-prev" data-news-nav="-1" aria-label="' + esc(prevLabel) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' : '') +
        '<article class="news-slide" key="' + state.index + '">' +
          (item.image ? '<div class="news-slide-img" style="background-image:url(\'' + String(item.image).replace(/'/g, '%27') + '\')"></div>' : '') +
          '<div class="news-slide-body">' +
            (item.date ? '<span class="news-date">' + fmtDate(item.date) + '</span>' : '') +
            '<h3 class="news-title">' + esc(item.title) + '</h3>' +
            '<div class="news-text">' + bodyHtml(item.body) + '</div>' +
          '</div>' +
        '</article>' +
        (multi ? '<button type="button" class="news-nav news-next" data-news-nav="1" aria-label="' + esc(nextLabel) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' : '') +
      '</div>' +
      (multi ? '<div class="news-dots">' + dots + '</div>' : '');

    // wire controls
    Array.prototype.forEach.call(carousel.querySelectorAll('[data-news-nav]'), function (b) {
      b.addEventListener('click', function () { go(Number(b.getAttribute('data-news-nav'))); });
    });
    Array.prototype.forEach.call(carousel.querySelectorAll('[data-news-dot]'), function (b) {
      b.addEventListener('click', function () { goTo(Number(b.getAttribute('data-news-dot'))); });
    });
  }

  function go(delta) { state.index += delta; render(); }
  function goTo(i) { state.index = i; render(); }

  function show() {
    var section = $('#news-section');
    if (section) section.style.display = '';
  }
  function hide() {
    var section = $('#news-section');
    if (section) section.style.display = 'none';
  }

  function waitForDb(attempts, cb) {
    if (window.IKAMETI_DB && typeof window.IKAMETI_DB.getPublishedNews === 'function') { cb(); return; }
    if (attempts <= 0) { cb(); return; }
    setTimeout(function () { waitForDb(attempts - 1, cb); }, 120);
  }

  function load() {
    if (!window.IKAMETI_DB || typeof window.IKAMETI_DB.getPublishedNews !== 'function') { hide(); return; }
    window.IKAMETI_DB.getPublishedNews()
      .then(function (items) {
        state.items = Array.isArray(items) ? items : [];
        state.index = 0;
        if (!state.items.length) { hide(); return; }
        show();
        render();
      })
      .catch(function (err) { console.warn('[IKAMETI] news load failed:', err); hide(); });
  }

  function init() {
    if (!$('#news-section')) return; // page has no news box
    waitForDb(40, load);
    // re-localise the visible item when the language changes
    window.addEventListener('languageChanged', function () { if (state.items.length) render(); });
    window.addEventListener('i18nReady', function () { if (state.items.length) render(); });
    // keyboard arrows when the section is focused area (optional, nice touch)
    document.addEventListener('keydown', function (e) {
      var section = $('#news-section');
      if (!section || section.style.display === 'none' || state.items.length < 2) return;
      var r = section.getBoundingClientRect();
      var inView = r.top < window.innerHeight && r.bottom > 0;
      if (!inView) return;
      if (e.key === 'ArrowLeft') go(document.documentElement.dir === 'rtl' ? 1 : -1);
      else if (e.key === 'ArrowRight') go(document.documentElement.dir === 'rtl' ? -1 : 1);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
