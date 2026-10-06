/*
  Page header: the big title and one line of explanation at the top of every view.
  Portal.components.pageHeader(title, subtitle)
  The h1 can receive focus so keyboard and screen reader users land on it after navigating.
*/
window.Portal = window.Portal || {};
Portal.components = Portal.components || {};

Portal.components.pageHeader = function (title, subtitle) {
  const h = Portal.h;
  return h("header", { class: "page-header" }, [
    h("h1", { id: "page-title", tabindex: "-1", text: title }),
    h("p", { text: subtitle }),
  ]);
};
