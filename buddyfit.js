/* Buddyfit per TizenBrew - v0.1.0
 * Scritto in ES5 per il motore (Chromium vecchio) delle TV Samsung 2017.
 * Fa tre cose:
 *  1) rilancia gli eventi input/change quando la tastiera della TV
 *     modifica un campo, cosi' il sito attiva il tasto ACCEDI;
 *  2) rende leggibile il testo nei campi (CSS minimo, da affinare);
 *  3) mostra in basso gli errori JavaScript (DEBUG = true), utile
 *     perche' sulla TV non c'e' la console.
 */
(function () {
  'use strict';

  var DEBUG = true;

  /* ---------- 1) Eventi input ---------- */
  var nativeSetter = null;
  try {
    nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype, 'value').set;
  } catch (e) { /* ignora */ }

  var firing = false;

  function fire(el) {
    if (firing) return;
    firing = true;
    try {
      if (nativeSetter) nativeSetter.call(el, el.value);
      ['input', 'change'].forEach(function (type) {
        var ev = document.createEvent('Event');
        ev.initEvent(type, true, true);
        el.dispatchEvent(ev);
      });
    } finally {
      firing = false;
    }
  }

  ['keyup', 'blur', 'change', 'compositionend'].forEach(function (type) {
    document.addEventListener(type, function (ev) {
      if (!ev.isTrusted) return;
      var t = ev.target;
      if (t && t.tagName === 'INPUT') fire(t);
    }, true);
  });

  /* Rete di sicurezza: controlla i campi ogni mezzo secondo */
  setInterval(function () {
    var list = document.querySelectorAll('input');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.value && el.getAttribute('data-bf-last') !== el.value) {
        el.setAttribute('data-bf-last', el.value);
        fire(el);
      }
    }
  }, 500);

  /* ---------- 2) CSS minimo per i campi ---------- */
  function addStyle(css) {
    var s = document.createElement('style');
    s.type = 'text/css';
    s.appendChild(document.createTextNode(css));
    (document.head || document.documentElement).appendChild(s);
  }

  addStyle(
    'input[type="email"], input[type="password"], input[type="text"] {' +
    '  color: #111 !important;' +
    '  font-size: 22px !important;' +
    '}'
  );

  /* ---------- 3) Overlay errori ---------- */
  if (DEBUG) {
    var box = null;
    var lines = [];

    function show(msg) {
      lines.push(String(msg).slice(0, 160));
      if (lines.length > 4) lines.shift();
      if (!box) {
        box = document.createElement('div');
        box.style.cssText =
          'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
          'background:rgba(120,0,0,.85);color:#fff;font:14px monospace;' +
          'padding:4px 8px;pointer-events:none;white-space:pre-wrap;';
        (document.body || document.documentElement).appendChild(box);
      }
      box.textContent = lines.join('\n');
    }

    window.addEventListener('error', function (e) {
      show('ERR: ' + e.message + ' @' +
           String(e.filename || '').split('/').pop() + ':' + e.lineno);
    });
    window.addEventListener('unhandledrejection', function (e) {
      show('PROMISE: ' + (e.reason && e.reason.message || e.reason));
    });
  }
})();
