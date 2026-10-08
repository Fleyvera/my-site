(function () {
  'use strict';

  var STORAGE_KEY = 'lang';
  var SUPPORTED = ['pt', 'en'];

  // O HTML é escrito em português; o dicionário PT é lido do próprio DOM.
  var en = {
    'meta.title': 'Felipe Martelo — Game Dev & Artist',
    'meta.desc': 'Felipe Martelo — Game Developer, Game Dev & UX/UI teacher, digital artist. Games, interfaces and pixel art.',

    'nav.aria': 'Main navigation',
    'nav.home': 'Home',
    'nav.skills': 'Skills',
    'nav.work': 'Work',
    'nav.experience': 'Experience',
    'nav.contact': 'Contact',
    'nav.game': 'Game',
    'nav.cta': 'Get in touch',
    'nav.menu': 'Open menu',
    'lang.aria': 'Language',

    'hero.label': 'Game Developer · Teacher · UX/UI',
    'hero.intro': "Hi, I'm",
    'hero.text': 'I make games, design interfaces, work with pixel art and teach Game Development and UX/UI at university.',
    'hero.chip.teacher': 'Teacher',
    'hero.play': '▶ Play portfolio',
    'hero.work': 'See my work',

    'skills.title': 'Skills',
    'skills.desc': 'What I do best — in practice and in the classroom.',
    'skills.gamedev.desc': 'Indie games from concept to build',
    'skills.ux.desc': 'Interfaces, flows and player experience',
    'skills.ux.link': 'See experience →',
    'skills.2d.desc': 'Illustration and digital art',
    'skills.pixel.desc': 'Pixel art and sprites',
    'skills.3d.desc': '3D modeling and rendering',

    'work.title': 'Work',
    'work.desc': "Games I've developed — from the studio to game jams.",
    'work.ba.alt': 'Born Again — Steam cover',
    'work.ba.desc': 'Roguelike MMORPG with permadeath and pixel art. Free to play on Steam, developed at Unnamed Studios.',
    'work.ba.link': 'View on Steam →',
    'work.play': 'Play on itch.io →',
    'work.pm.desc': 'Pixel art adventure made with Godot, playable in the browser.',
    'work.bd.desc': 'Fast, challenging platformer starring a very hurried bee.',
    'work.mo.desc': 'Arcade game made for Kenney Jam 2022.',
    'work.more.title': 'See all games',
    'work.more.desc': 'Game jams, prototypes and asset packs on my itch.io.',
    'work.github': 'There is also code on',

    'exp.title': 'Experience',
    'exp.desc': "Institutions and companies I've worked with.",
    'exp.fecaf.chip': 'Teacher · Game Dev & UX/UI',
    'exp.fecaf.desc': 'FECAF University Center — I teach Game Development and UX/UI, combining theory, prototyping and practice to train game developers.',
    'exp.unnamed.desc': 'Game development and creative production at an independent studio.',
    'exp.avenues.chip': 'Education',
    'exp.avenues.desc': 'Work in an international educational environment focused on technology and creativity.',
    'exp.sg.chip': 'Technology',
    'exp.sg.desc': 'Teaching programming and technology to young people at a coding school.',

    'contact.title': 'Contact',
    'contact.desc': "Let's talk about projects, collaborations or opportunities.",
    'contact.text': "Liked what you saw here? Let's talk about projects, collaborations or opportunities. Just pick an option below!",
    'contact.location.label': 'Location',
    'contact.location': 'São Paulo, SP — Brazil',
    'contact.email.label': 'Email',

    'footer.text': '© 2026 Felipe Martelo · Game Dev, UX/UI & pixel art.',
    'footer.portfolio': 'Interactive portfolio',
    'footer.top': 'Back to top ↑'
  };

  var metaDesc = document.querySelector('meta[name="description"]');
  var textNodes = document.querySelectorAll('[data-i18n]');
  var attrNodes = document.querySelectorAll('[data-i18n-attr]');
  var buttons = document.querySelectorAll('[data-lang]');

  var pt = {
    'meta.title': document.title,
    'meta.desc': metaDesc ? metaDesc.getAttribute('content') : ''
  };

  function parseAttrs(el) {
    return el.getAttribute('data-i18n-attr').split(';').map(function (pair) {
      var parts = pair.split(':');
      return { attr: parts[0].trim(), key: parts[1].trim() };
    });
  }

  textNodes.forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (!(key in pt)) pt[key] = el.textContent.replace(/\s+/g, ' ').trim();
  });

  attrNodes.forEach(function (el) {
    parseAttrs(el).forEach(function (item) {
      if (!(item.key in pt)) pt[item.key] = el.getAttribute(item.attr) || '';
    });
  });

  var dict = { pt: pt, en: en };

  function t(lang, key) {
    var value = dict[lang][key];
    return value === undefined ? pt[key] : value;
  }

  function apply(lang) {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.title = t(lang, 'meta.title');
    if (metaDesc) metaDesc.setAttribute('content', t(lang, 'meta.desc'));

    textNodes.forEach(function (el) {
      el.textContent = t(lang, el.getAttribute('data-i18n'));
    });

    attrNodes.forEach(function (el) {
      parseAttrs(el).forEach(function (item) {
        el.setAttribute(item.attr, t(lang, item.key));
      });
    });

    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  function detect() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* localStorage indisponível */ }

    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || 'pt'];
    return String(langs[0]).toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
      apply(lang);
    });
  });

  apply(detect());
})();
