/*
  Empty state: the friendly message shown where a list has nothing in it yet.
  Portal.components.emptyState(text)
*/
window.Portal = window.Portal || {};
Portal.components = Portal.components || {};

Portal.components.emptyState = function (text) {
  return Portal.h("p", { class: "empty", text: text });
};
