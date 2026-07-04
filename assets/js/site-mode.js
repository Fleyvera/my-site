(function () {
  "use strict";

  var playLink = document.getElementById("play-game-link");

  if (playLink) {
    playLink.addEventListener("click", function () {
      localStorage.removeItem("preferSite");
    });
  }
})();
