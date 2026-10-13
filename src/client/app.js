/* Sattam client script: language memory, search + filters, mobile menu.
   No dependencies. Progressive enhancement: the site works without JS. */
(function () {
  'use strict';

  var LANG_KEY = 'sattam:lang';

  function getStoredLang() {
    try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; }
  }
  function setStoredLang(lang) {
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  function norm(s) {
    return (s || '').toString().toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
  }

  function initLangMemory() {
    // Persist the user's language choice on any switcher link click.
    document.addEventListener('click', function (ev) {
      var el = ev.target.closest('[data-setlang]');
      if (el) setStoredLang(el.getAttribute('data-setlang'));
    });

    // On the root chooser, send returning visitors straight to their language.
    if (location.pathname === '/' || location.pathname === '/index.html') {
      var stored = getStoredLang();
      if (!stored) {
        var nav = (navigator.language || 'en').toLowerCase();
        stored = nav.indexOf('ta') === 0 ? 'ta' : null;
      }
      if (stored === 'en' || stored === 'ta') {
        var links = document.querySelectorAll('[data-setlang="' + stored + '"]');
        if (links.length) location.replace(links[0].getAttribute('href'));
      }
    }
  }

  function initMenu() {
    var btn = document.querySelector('.menu-btn');
    var nav = document.getElementById('mobile-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function cardHtml(item) {
    var langChip = item.lang === 'ta' ? '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD' : 'English';
    return '<a class="card" href="' + item.url + '">' +
      '<span class="card__emoji" aria-hidden="true">' + item.emoji + '</span>' +
      '<span class="card__cat">' + escapeHtml(item.categoryName) + '</span>' +
      '<h3 class="card__title">' + escapeHtml(item.title) + '</h3>' +
      '<p class="card__summary">' + escapeHtml(item.summary) + '</p>' +
      '<span class="card__lang"><span class="lang-chip">' + langChip + '</span></span>' +
      '</a>';
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function scoreItem(item, terms) {
    if (!terms.length) return 1;
    var title = norm(item.title);
    var summary = norm(item.summary);
    var kw = norm(item.keywords);
    var s = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (title.indexOf(t) !== -1) s += 6;
      else if (summary.indexOf(t) !== -1) s += 3;
      else if (kw.indexOf(t) !== -1) s += 2;
      else s -= 12;
    }
    return s;
  }

  function initSearch() {
    var form = document.getElementById('filters');
    var results = document.getElementById('results');
    if (!form || !results) return;

    var qEl = document.getElementById('f-q');
    var langEl = document.getElementById('f-lang');
    var catEl = document.getElementById('f-cat');
    var resetEl = document.getElementById('f-reset');
    var countEl = document.getElementById('results-count');
    var emptyEl = document.getElementById('empty');
    var index = [];

    var params = new URLSearchParams(location.search);
    if (params.get('q')) qEl.value = params.get('q');
    if (params.get('lang')) langEl.value = params.get('lang');
    if (params.get('category')) catEl.value = params.get('category');

    var baseEl = document.querySelector('meta[name="site-base"]');
    var base = baseEl ? baseEl.getAttribute('content') || '' : '';

    fetch(base + '/assets/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; render(); })
      .catch(function () { index = []; render(); });

    function render() {
      var q = norm(qEl.value);
      var terms = q ? q.split(' ').filter(Boolean) : [];
      var lang = langEl.value;
      var cat = catEl.value;

      var out = index
        .filter(function (it) { return !lang || it.lang === lang; })
        .filter(function (it) { return !cat || it.category === cat; })
        .map(function (it) { return { it: it, s: scoreItem(it, terms) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .map(function (x) { return x.it; });

      results.innerHTML = out.map(cardHtml).join('');
      emptyEl.hidden = out.length !== 0;

      var n = out.length;
      countEl.textContent = q
        ? n + (n === 1 ? ' result' : ' results') + ' \u00B7 "' + qEl.value + '"'
        : '';

      var usp = new URLSearchParams();
      if (qEl.value) usp.set('q', qEl.value);
      if (lang) usp.set('lang', lang);
      if (cat) usp.set('category', cat);
      var qs = usp.toString();
      history.replaceState(null, '', qs ? '?' + qs : location.pathname);
    }

    var debounce;
    function onInput() {
      clearTimeout(debounce);
      debounce = setTimeout(render, 120);
    }
    qEl.addEventListener('input', onInput);
    langEl.addEventListener('change', render);
    catEl.addEventListener('change', render);
    resetEl.addEventListener('click', function () {
      qEl.value = '';
      langEl.value = '';
      catEl.value = '';
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLangMemory();
    initMenu();
    initSearch();
  });
})();
