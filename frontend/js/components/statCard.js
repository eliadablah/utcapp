/*
  Stat card: one big number with a label, linking to the page it summarizes.
  Portal.components.statCard({ label, value, hint, route })
*/
window.Portal = window.Portal || {};
Portal.components = Portal.components || {};

Portal.components.statCard = function (config) {
  const h = Portal.h;
  return h("a", { class: "stat", href: "#/" + config.route }, [
    h("div", { class: "stat-label", text: config.label }),
    h("div", { class: "stat-value", text: String(config.value) }),
    h("div", { class: "stat-hint", text: config.hint }),
  ]);
};
