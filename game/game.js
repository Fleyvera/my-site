(function () {
  "use strict";

  function goToSite() {
    window.location.href = "/site/";
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
      event.preventDefault();
      goToSite();
    }
  });

  if (!document.getElementById("site-mode-nav")) {
    var nav = document.createElement("nav");
    nav.id = "site-mode-nav";
    nav.className = "site-mode-nav";
    nav.setAttribute("aria-label", "Alternar versão do site");
    nav.innerHTML =
      '<button type="button" id="site-test-btn" class="site-mode-nav__btn">Site (teste · Tab)</button>';
    document.body.appendChild(nav);

    var siteButton = document.getElementById("site-test-btn");
    if (siteButton) {
      siteButton.addEventListener("click", function (event) {
        event.stopPropagation();
        goToSite();
      });
    }
  }

  if (!document.getElementById("capture-hint")) {
    var hint = document.createElement("div");
    hint.id = "capture-hint";
    hint.className = "capture-hint";
    hint.textContent = "Clique na tela para capturar o mouse";
    document.body.appendChild(hint);

    document.addEventListener("pointerlockchange", function () {
      hint.hidden = document.pointerLockElement != null;
    });

    document.addEventListener("mousedown", function () {
      window.setTimeout(function () {
        if (document.pointerLockElement == null) {
          hint.hidden = false;
        }
      }, 100);
    });
  }
})();
