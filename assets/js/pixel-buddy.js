(function () {
  'use strict';

  var canvas = document.getElementById('pixel-buddy');
  var stage = document.querySelector('.hero__stage');
  if (!canvas || !stage) return;

  var ctx = canvas.getContext('2d');
  var sheet = new Image();
  sheet.src = '/assets/sprites/game/MeForYouMe-Sheet.png';

  var FRAME_W = 14;
  var FRAME_H = 21;
  var SCALE = 5;
  var animFrame = 0;
  var animTimer = 0;
  var posX = 0;
  var targetX = 0;
  var currentAnim = 'idle';
  var flip = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ANIMS = {
    idle: [[0, 0], [14, 0], [28, 0], [42, 0]],
    walk_front: [[56, 0], [70, 0], [84, 0], [98, 0]],
    walk_side: [[112, 0], [126, 0], [140, 0], [154, 0], [168, 0]],
    walk_back: [[182, 0], [196, 0], [210, 0], [224, 0], [238, 0]]
  };

  var ANIM_SPEED = {
    idle: 240,
    walk_front: 130,
    walk_back: 130,
    walk_side: 130
  };

  function resize() {
    var rect = stage.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    if (posX === 0) posX = rect.width * 0.5;
    if (targetX === 0) targetX = posX;
  }

  function pickAnim(mouseX, mouseY) {
    var rect = stage.getBoundingClientRect();
    var charY = rect.height - FRAME_H * SCALE - 12;
    var dx = mouseX - (rect.left + posX);
    var dy = mouseY - (rect.top + charY);
    var moving = Math.abs(targetX - posX) > 2;

    if (!moving) {
      if (dy > 24) return { name: 'walk_front', flip: false };
      if (dy < -24) return { name: 'walk_back', flip: false };
      return { name: 'idle', flip: false };
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      return { name: 'walk_side', flip: dx < 0 };
    }
    if (dy > 0) return { name: 'walk_front', flip: false };
    return { name: 'walk_back', flip: false };
  }

  function setTarget(clientX) {
    var rect = stage.getBoundingClientRect();
    targetX = Math.max(36, Math.min(rect.width - 36, clientX - rect.left));
  }

  function onPointerMove(event) {
    setTarget(event.clientX);
    var anim = pickAnim(event.clientX, event.clientY);
    currentAnim = anim.name;
    flip = anim.flip;
  }

  function onPointerDown(event) {
    setTarget(event.clientX);
    stage.setPointerCapture(event.pointerId);
  }

  function draw() {
    var rect = stage.getBoundingClientRect();
    var groundY = rect.height - FRAME_H * SCALE - 12;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!sheet.complete) return;

    posX += (targetX - posX) * (reducedMotion ? 1 : 0.14);
    var moving = Math.abs(targetX - posX) > 1.5;

    if (!moving && !reducedMotion) {
      var idleAnim = pickAnim(rect.left + targetX, rect.top + groundY);
      currentAnim = idleAnim.name;
      flip = idleAnim.flip;
    }

    animTimer += 16;
    var speed = ANIM_SPEED[currentAnim] || 180;
    if (animTimer >= speed) {
      animTimer = 0;
      animFrame = (animFrame + 1) % ANIMS[currentAnim].length;
    }

    var frame = ANIMS[currentAnim][animFrame];
    var drawW = FRAME_W * SCALE;
    var drawH = FRAME_H * SCALE;
    var drawX = posX - drawW * 0.5;

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flip) {
      ctx.translate(drawX + drawW, groundY);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame[0], frame[1], FRAME_W, FRAME_H, 0, 0, drawW, drawH);
    } else {
      ctx.drawImage(sheet, frame[0], frame[1], FRAME_W, FRAME_H, drawX, groundY, drawW, drawH);
    }
    ctx.restore();
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  function bindInput() {
    stage.addEventListener('pointermove', onPointerMove, { passive: true });
    stage.addEventListener('pointerdown', onPointerDown, { passive: true });
    stage.addEventListener('pointerleave', function () {
      targetX = canvas.width * 0.5;
      currentAnim = 'idle';
      flip = false;
    });
  }

  sheet.onload = function () {
    resize();
    if (!reducedMotion) bindInput();
    loop();
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();
})();
