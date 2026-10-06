/*
  Dashboard view: answers "where do I stand?" and "what do I do next?"
  Shows the next enrollment step, four summary numbers, recent activity and shortcuts.
*/
window.Portal = window.Portal || {};
Portal.views = Portal.views || {};

Portal.views.dashboard = {
  render: function () {
    const h = Portal.h;
    const ui = Portal.components;
    const text = Portal.content.dashboard;
    const state = Portal.store.get();
    const enrollment = Portal.enrollmentStatus();
    const catalog = Portal.content.courses.catalog;

    // --- Numbers for the summary strip ---
    const plannedCredits = catalog
      .filter(function (course) { return state.plannedCourseIds.indexOf(course.id) !== -1; })
      .reduce(function (sum, course) { return sum + course.credits; }, 0);
    const pendingLabs = state.labRequests.filter(function (request) { return request.status === "pending"; }).length;
    const openTickets = state.tickets.filter(function (ticket) { return ticket.status === "open"; }).length;

    // --- Next step banner ---
    const hero = h("section", { class: "hero" }, [
      h("div", {}, [
        h("div", { class: "eyebrow", text: text.statusEyebrow }),
        h("h2", { text: enrollment.next ? text.nextPrefix + enrollment.next.label : text.allDoneTitle }),
        h("p", { text: enrollment.next ? enrollment.next.detail : text.allDoneBody }),
      ]),
      h("a", {
        class: "btn",
        href: "#/" + (enrollment.next ? enrollment.next.route : "enrollment"),
        text: enrollment.next ? text.goToStep : text.viewEnrollment,
      }),
    ]);

    const stats = h("div", { class: "stats" }, [
      ui.statCard({ label: text.stats.documents, value: enrollment.receivedCount + " / " + enrollment.requiredCount, hint: text.stats.documentsHint, route: "documents" }),
      ui.statCard({ label: text.stats.courses, value: state.plannedCourseIds.length, hint: plannedCredits + " " + text.stats.creditsHint, route: "courses" }),
      ui.statCard({ label: text.stats.labs, value: pendingLabs, hint: text.stats.labsHint, route: "labs" }),
      ui.statCard({ label: text.stats.tickets, value: openTickets, hint: text.stats.ticketsHint, route: "support" }),
    ]);

    // --- Recent activity: the five newest things from every section ---
    const activity = []
      .concat(state.documents.map(function (doc) {
        return { when: doc.createdAt, label: text.activity.document + " " + doc.typeLabel };
      }))
      .concat(state.labRequests.map(function (request) {
        return { when: request.createdAt, label: text.activity.lab + " " + request.labLabel };
      }))
      .concat(state.tickets.map(function (ticket) {
        return { when: ticket.createdAt, label: text.activity.ticket + " " + ticket.subject };
      }))
      .sort(function (a, b) { return a.when < b.when ? 1 : -1; })
      .slice(0, 5);

    const recent = ui.card(text.recentTitle, [
      activity.length === 0
        ? ui.emptyState(text.recentEmpty)
        : h("ul", { class: "list" }, activity.map(function (entry) {
          return h("li", {}, [
            h("div", { class: "item-main" }, [h("div", { class: "item-title", text: entry.label })]),
            h("div", { class: "item-meta", text: Portal.formatDate(entry.when) }),
          ]);
        })),
    ]);

    const quick = ui.card(text.quickTitle, text.quick.map(function (action) {
      return h("a", { class: "btn btn-ghost", href: "#/" + action.route, text: action.label });
    }));

    return h("div", { class: "main-inner" }, [
      ui.pageHeader(text.title, text.subtitle),
      hero,
      stats,
      h("div", { class: "grid-2" }, [recent, quick]),
    ]);
  },
};
