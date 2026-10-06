/*
  Toast: a short confirmation message at the bottom of the screen.
  Portal.components.toast(message)
  It is a "live region", so screen readers read the message out loud too.
*/
window.Portal = window.Portal || {};
Portal.components = Portal.components || {};

(function () {
  let region = null;
  let timer = null;

  Portal.components.toast = function (message) {
    if (!region) {
      region = Portal.h("div", { class: "toast", role: "status", "aria-live": "polite" });
      document.body.appendChild(region);
    }

    region.textContent = message;
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { region.textContent = ""; }, 4000);
  };
})();
