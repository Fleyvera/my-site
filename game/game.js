(function () {
  "use strict";

  var preferSiteLink = document.getElementById("prefer-site-link");
  var mobileHint = document.querySelector(".game-shell__hint--mobile");
  var isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

  if (mobileHint && isMobile) {
    mobileHint.hidden = false;
  }

  if (preferSiteLink) {
    preferSiteLink.addEventListener("click", function () {
      localStorage.setItem("preferSite", "1");
    });
  }

  if (!document.getElementById("site-mode-nav")) {
    var nav = document.createElement("nav");
    nav.id = "site-mode-nav";
    nav.className = "site-mode-nav";
    nav.setAttribute("aria-label", "Alternar versão do site");
    nav.innerHTML = '<a href="/site/" id="site-mode-link">Site tradicional</a>';
    document.body.appendChild(nav);

    var siteModeLink = document.getElementById("site-mode-link");
    if (siteModeLink) {
      siteModeLink.addEventListener("click", function () {
        localStorage.setItem("preferSite", "1");
      });
    }
  }
})();
