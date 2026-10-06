/*
  App: draws the frame (sidebar + main area) once, then swaps the view in the
  main area whenever the address changes (#/dashboard, #/documents, ...) or
  the stored data changes.
*/
window.Portal = window.Portal || {};

(function () {
  const h = Portal.h;
  const text = Portal.content.app;
  const routes = Portal.content.nav;

  // --- Frame ---
  const navLinks = {};
  const nav = h("nav", { class: "nav", "aria-label": text.navLabel }, routes.map(function (route) {
    const link = h("a", { href: "#/" + route.id }, [Portal.icon(route.icon), h("span", { text: route.label })]);
    navLinks[route.id] = link;
    return link;
  }));

  const serverLine = h("strong", { text: text.localPreview });
  const sideFoot = h("div", { class: "side-foot" }, [
    h("span", { text: text.servedBy }),
    serverLine,
    h("button", {
      class: "link-button",
      type: "button",
      text: text.reset,
      onclick: function () {
        if (!window.confirm(text.resetConfirm)) return;
        Portal.store.reset()
          .then(function () { Portal.components.toast(text.resetDone); })
          .catch(function (failure) { Portal.components.toast(failure.message); });
      },
    }),
  ]);

  const notice = h("div", { class: "notice", text: text.loading });
  const view = h("div", {});
  const main = h("main", { class: "main", id: "main" }, [
    h("div", { class: "main-inner" }, [notice, view]),
  ]);

  document.getElementById("app").appendChild(h("div", { class: "shell" }, [
    h("a", { class: "skip-link", href: "#main", text: text.skip }),
    h("aside", { class: "sidebar" }, [
      h("div", { class: "brand" }, [
        h("span", { class: "brand-mark", "aria-hidden": "true", text: text.mark }),
        h("span", { text: text.name }),
      ]),
      nav,
      sideFoot,
    ]),
    main,
  ]));

  // --- Routing ---
  function currentRoute() {
    const id = window.location.hash.replace("#/", "");
    return routes.find(function (route) { return route.id === id; }) || routes[0];
  }

  // moveFocus is true only when the visitor navigated, not when data changed
  function render(moveFocus) {
    const route = currentRoute();

    routes.forEach(function (item) {
      if (item.id === route.id) navLinks[item.id].setAttribute("aria-current", "page");
      else navLinks[item.id].removeAttribute("aria-current");
    });

    view.replaceChildren(Portal.views[route.id].render());
    document.title = route.label + " · " + text.name;

    if (moveFocus) {
      window.scrollTo(0, 0);
      const title = document.getElementById("page-title");
      if (title) title.focus({ preventScroll: true });
    }
  }

  // --- Start: find out where the data lives, then draw the first view ---
  Portal.store.init().then(function () {
    notice.textContent = Portal.store.mode === "server" ? text.serverNotice : text.demoNotice;
    window.addEventListener("hashchange", function () { render(true); });
    Portal.store.subscribe(function () { render(false); });
    render(false);
  });

  // --- Which server answered? ---
  Portal.loadServerInfo().then(function (info) {
    if (info) serverLine.textContent = info.instanceId + " · " + info.az;
  });
})();
