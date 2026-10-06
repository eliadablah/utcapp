/*
  Card: a white panel with a heading.
  Portal.components.card(title, children) - children is an array of elements.
*/
window.Portal = window.Portal || {};
Portal.components = Portal.components || {};

Portal.components.card = function (title, children) {
  const h = Portal.h;
  return h("section", { class: "card" }, [
    h("h2", { text: title }),
    h("div", { class: "card-body" }, children),
  ]);
};
