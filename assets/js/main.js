(function () {
  'use strict';

  var sidebar = document.getElementById('sidebar');
  var nav = document.getElementById('nav');
  var menuToggle = document.getElementById('menu-toggle');
  var backdrop = document.getElementById('sidebar-backdrop');
  var navLinks = nav.querySelectorAll('.sidebar__link');
  var sections = document.querySelectorAll('section[id]');

  function setMenuOpen(isOpen) {
    sidebar.classList.toggle('is-open', isOpen);
    menuToggle.classList.toggle('is-open', isOpen);
    backdrop.classList.toggle('is-visible', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function onScroll() {
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

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      setMenuOpen(!sidebar.classList.contains('is-open'));
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
