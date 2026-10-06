/*
  Badge: a small colored pill for a status word.
  Portal.components.badge(text, tone) - tone is neutral | ok | warn | danger | brand.
*/
window.Portal = window.Portal || {};
Portal.components = Portal.components || {};

Portal.components.badge = function (text, tone) {
  return Portal.h("span", { class: "badge badge-" + (tone || "neutral"), text: text });
};
