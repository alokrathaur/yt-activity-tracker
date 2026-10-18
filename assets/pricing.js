// Regional pricing, buy buttons and the "manage subscription" form. All payment logic runs on the
// license worker; this page only shows prices and sends the buyer there with plan and email.
(function () {
  var api = ((window.YT_TRACKER_CONFIG || {}).licenseApiUrl || "").trim();
  if (api && !/\/$/.test(api)) api += "/";

  // Mirrors cloudflare-worker/src/pricing.js: INR in India, USD everywhere else
  var CATALOG = {
    IN: {
      plans: {
        monthly: ["₹33", "/month", "Flexible access"],
        quarterly: ["₹99", "/3 months", "3 months · ₹33/month"],
        yearly: ["₹299", "/year", "Save ₹97 vs. monthly billing"],
        lifetime: ["₹599", "once", "One-time payment"]
      }
    },
    INTL: {
      plans: {
        monthly: ["$1", "/month", "Flexible access"],
        quarterly: ["$2.99", "/3 months", "3 months · about $1/month"],
        yearly: ["$7.99", "/year", "Save $4.01 vs. monthly billing"],
        lifetime: ["$14.99", "once", "One-time payment"]
      }
    }
  };
  var TERMS = {
    monthly: "Billed monthly. Renews automatically until cancelled.",
    quarterly: "Billed every 3 months. Renews automatically until cancelled.",
    yearly: "Billed yearly. Renews automatically until cancelled.",
    lifetime: "Pay once. No recurring charges, ever."
  };

  function render(region) {
    var entry = CATALOG[region] || CATALOG.INTL;
    var shown = 0;
    document.querySelectorAll("[data-plan-card]").forEach(function (card) {
      var id = card.getAttribute("data-plan-card");
      var p = entry.plans[id];
      card.hidden = !p;
      if (!p) return;
      shown++;
      card.querySelector("[data-price]").textContent = p[0];
      card.querySelector("[data-period]").textContent = p[1];
      card.querySelector("[data-desc]").textContent = p[2];
      card.querySelector("[data-terms]").textContent = TERMS[id];
    });
    document.querySelector(".pricing").setAttribute("data-count", shown);
    var cheapest = entry.plans.monthly || entry.plans.quarterly;
    var from = document.querySelector("[data-from-price]");
    if (from) from.textContent = "From " + cheapest[0] + cheapest[1];
  }

  // India pays in INR; every other country pays the USD price
  function regionForCountry(country) {
    return (country || "").toUpperCase() === "IN" ? "IN" : "INTL";
  }

  // Offline guess from the browser's time zone, used until (or unless) the worker answers
  function guessRegion() {
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { /* old browser */ }
    return tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "IN" : "INTL";
  }

  render(guessRegion());

  // The worker knows the visitor's country from their IP, which beats the time-zone guess
  if (api) {
    fetch(api + "pricing")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { if (data && data.country) render(regionForCountry(data.country)); })
      .catch(function () { /* keep the time-zone guess */ });
  }

  // ---------------------------------------------------------------- buy buttons

  var emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var buyEmail = document.getElementById("buy-email");
  var buyMsg = document.getElementById("buy-msg");
  var buttons = document.querySelectorAll(".buy");

  function say(el, text, isError) {
    el.textContent = text;
    el.classList.toggle("error", !!isError);
  }

  try {
    var saved = localStorage.getItem("ytt-email");
    if (saved) buyEmail.value = saved;
  } catch (e) { /* storage blocked: start empty */ }

  if (!api) {
    buttons.forEach(function (b) { b.disabled = true; });
    say(buyMsg, "Payments are coming soon. Install the free app now; you can upgrade later.");
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var email = buyEmail.value.trim().toLowerCase();
      if (!emailRe.test(email)) {
        say(buyMsg, "Enter the email you'll use in the app first.", true);
        buyEmail.focus();
        return;
      }
      try { localStorage.setItem("ytt-email", email); } catch (e) { /* ignore */ }
      say(buyMsg, "Opening secure checkout…");
      buttons.forEach(function (b) { b.disabled = true; });
      location.href = api + "checkout?plan=" + encodeURIComponent(button.dataset.plan) + "&email=" + encodeURIComponent(email);
    });
  });

  // Back/forward cache: re-enable the buttons if the user returns from checkout
  window.addEventListener("pageshow", function () {
    if (api) buttons.forEach(function (b) { b.disabled = false; });
  });

  // ---------------------------------------------------------------- manage subscription

  var portalForm = document.getElementById("portal-form");
  var portalMsg = document.getElementById("portal-msg");
  portalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var email = portalForm.email.value.trim().toLowerCase();
    if (!emailRe.test(email)) return say(portalMsg, "Enter the email you paid with.", true);
    if (!api) return say(portalMsg, "Payments aren't live yet.", true);

    say(portalMsg, "Sending…");
    fetch(api + "portal/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email })
    }).then(function (res) {
      if (!res.ok) throw new Error(res.status);
      say(portalMsg, "If " + email + " has a purchase, a link to manage it is on its way. Check your inbox.");
    }).catch(function () {
      say(portalMsg, "Couldn't send right now. Please try again in a minute.", true);
    });
  });
})();
