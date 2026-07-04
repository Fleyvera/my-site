(function () {
  'use strict';

  var buddy = document.getElementById('pixel-buddy');
  var zone = document.querySelector('.hero__figure');
  if (!buddy || !zone) return;

  var img = buddy.querySelector('img');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (reducedMotion || coarsePointer) {
    buddy.classList.add('pixel-buddy--static');
    return;
  }

  var facing = 1;

  function update(clientX, clientY) {
    var rect = zone.getBoundingClientRect();
    var centerX = rect.left + rect.width * 0.5;
    var centerY = rect.top + rect.height * 0.55;
    var dx = clientX - centerX;
    var dy = clientY - centerY;
    var distance = Math.min(Math.hypot(dx, dy), 220);
    var angle = Math.atan2(dy, dx);
    var moveX = Math.cos(angle) * distance * 0.14;
    var moveY = Math.sin(angle) * distance * 0.1;
    facing = dx >= 0 ? 1 : -1;
    var tilt = Math.max(-8, Math.min(8, dx * 0.015));

    buddy.style.transform =
      'translate(' + moveX + 'px,' + moveY + 'px) scaleX(' + facing + ') rotate(' + tilt + 'deg)';
  }

  window.addEventListener('mousemove', function (event) {
    update(event.clientX, event.clientY);
    buddy.classList.remove('is-idle');
  }, { passive: true });

  window.addEventListener('mouseleave', function () {
    buddy.style.transform = 'translate(0, 0) scaleX(1) rotate(0deg)';
    buddy.classList.add('is-idle');
  });

  buddy.classList.add('is-active');
  buddy.classList.add('is-idle');
})();
