// Fills every contact link from config.js, so the address lives in one place.
(function () {
  var email = ((window.YT_TRACKER_CONFIG || {}).contactEmail || "").trim();
  if (!email) return;
  document.querySelectorAll("[data-contact-email]").forEach(function (a) {
    a.href = "mailto:" + email;
    a.textContent = email;
  });
})();
