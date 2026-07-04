(function () {
  'use strict';

  var buddy = document.getElementById('pixel-buddy');
  if (!buddy) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  var canFollow = !reducedMotion && !coarsePointer;

  if (!canFollow) {
    var anchor = document.querySelector('.hero__figure');
    if (anchor) {
      var placeholder = anchor.querySelector('.hero__figure-placeholder');
      if (placeholder) placeholder.remove();
      anchor.appendChild(buddy);
    }
    buddy.classList.add('pixel-buddy--static');
    return;
  }

  var posX = window.innerWidth * 0.72;
  var posY = window.innerHeight * 0.42;
  var targetX = posX;
  var targetY = posY;
  var facing = 1;
  var idleTimer = 0;
  var isIdle = true;

  function setTransform() {
    var tilt = Math.max(-10, Math.min(10, (targetX - posX) * 0.04));
    buddy.style.transform =
      'translate3d(' + posX + 'px,' + posY + 'px,0) translate(-50%,-100%) scaleX(' + facing + ') rotate(' + tilt + 'deg)';
  }

  function seedFromHero() {
    var anchor = document.querySelector('.hero__figure');
    if (!anchor) return;

    var rect = anchor.getBoundingClientRect();
    posX = rect.left + rect.width * 0.5;
    posY = rect.top + rect.height * 0.88;
    targetX = posX;
    targetY = posY;
    setTransform();
  }

  function onMove(event) {
    targetX = event.clientX;
    targetY = event.clientY + 12;
    idleTimer = 0;
    if (isIdle) {
      isIdle = false;
      buddy.classList.remove('is-idle');
    }
  }

  function tick() {
    posX += (targetX - posX) * 0.09;
    posY += (targetY - posY) * 0.09;
    facing = targetX >= posX ? 1 : -1;

    idleTimer += 1;
    if (!isIdle && idleTimer > 40) {
      isIdle = true;
      buddy.classList.add('is-idle');
    }

    var margin = 72;
    posX = Math.max(margin, Math.min(window.innerWidth - margin, posX));
    posY = Math.max(margin + 40, Math.min(window.innerHeight - margin, posY));

    setTransform();
    requestAnimationFrame(tick);
  }

  seedFromHero();
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('resize', seedFromHero, { passive: true });
  buddy.classList.add('is-active');
  requestAnimationFrame(tick);
})();
