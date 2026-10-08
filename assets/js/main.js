(function () {
  'use strict';

  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var menuToggle = document.getElementById('menu-toggle');
  var navLinks = nav ? nav.querySelectorAll('a') : [];
  var sections = document.querySelectorAll('section[id]');

  function onScroll() {
    if (header) {
      header.classList.toggle('header--scrolled', window.scrollY > 16);
    }

    var scrollPos = window.scrollY + 120;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove('is-open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      menuToggle.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.game-feature__video').forEach(function (video) {
    if (reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    }
  });

  document.querySelectorAll('[data-trailer]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var media = document.getElementById(trigger.getAttribute('data-trailer'));
      if (!media || media.classList.contains('is-playing')) return;

      var video = media.querySelector('video');
      if (video) video.pause();

      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + media.getAttribute('data-youtube') +
        '?autoplay=1&rel=0&playsinline=1';
      iframe.title = media.getAttribute('data-trailer-title') || 'Trailer';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;

      media.appendChild(iframe);
      media.classList.add('is-playing');
      media.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  });
})();
