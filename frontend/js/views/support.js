/*
  Support view: open a support request and track every request in one list,
  each with its own number (SR-1001, ...). A request can be withdrawn.
*/
window.Portal = window.Portal || {};
Portal.views = Portal.views || {};

Portal.views.support = {
  render: function () {
    const h = Portal.h;
    const ui = Portal.components;
    const text = Portal.content.support;
    const status = Portal.content.status;
    const state = Portal.store.get();

    // --- Form ---
    const category = ui.field({ id: "ticket-category", label: text.categoryLabel, type: "select", options: text.categories });
    const priority = ui.field({ id: "ticket-priority", label: text.priorityLabel, type: "select", options: text.priorities });
    const subject = ui.field({ id: "ticket-subject", label: text.subjectLabel, attrs: { maxlength: "80" } });
    const details = ui.field({ id: "ticket-details", label: text.detailsLabel, type: "textarea", hint: text.detailsHint, attrs: { maxlength: "1000" } });
    const error = h("p", { class: "form-error", role: "alert" });

    function submit(event) {
      event.preventDefault();

      if (subject.input.value.trim().length < 4) { error.textContent = text.errors.subject; return; }
      if (details.input.value.trim().length < 10) { error.textContent = text.errors.details; return; }

      submitButton.disabled = true;
      Portal.store.addTicket({
        category: category.input.value,
        priority: priority.input.value,
        subject: subject.input.value.trim(),
        details: details.input.value.trim(),
      })
        // The backend picks the request number, so read it from the answer
        .then(function (result) { ui.toast(text.added + result.ticket.number); })
        .catch(function (failure) {
          submitButton.disabled = false;
          error.textContent = failure.message;
        });
    }

    const submitButton = h("button", { class: "btn", type: "submit", text: text.submit });
    const form = h("form", { class: "form", onsubmit: submit, novalidate: true }, [
      h("div", { class: "form-row" }, [category.wrap, priority.wrap]),
      subject.wrap,
      details.wrap,
      error,
      h("div", {}, [submitButton]),
    ]);

    // --- Request list ---
    const tickets = state.tickets.length === 0
      ? ui.emptyState(text.empty)
      : h("ul", { class: "list" }, state.tickets.map(function (ticket) {
        const open = ticket.status === "open";
        return h("li", {}, [
          h("div", { class: "item-main" }, [
            h("div", { class: "item-title", text: ticket.number + " · " + ticket.subject }),
            h("div", { class: "item-meta", text: ticket.category + " · " + ticket.priority + " · " + Portal.formatDate(ticket.createdAt) }),
            h("div", { class: "item-meta", text: ticket.details }),
          ]),
          h("div", { class: "item-side" }, [
            ui.badge(open ? status.open : status.withdrawn, open ? "brand" : "neutral"),
            open
              ? h("button", {
                class: "btn btn-ghost btn-small",
                type: "button",
                text: text.withdraw,
                "aria-label": text.withdraw + ": " + ticket.number,
                onclick: function () {
                  Portal.store.withdrawTicket(ticket.id)
                    .then(function () { ui.toast(text.withdrawn); })
                    .catch(function (failure) { ui.toast(failure.message); });
                },
              })
              : null,
          ]),
        ]);
      }));

    // --- Render ---
    return h("div", { class: "main-inner" }, [
      ui.pageHeader(text.title, text.subtitle),
      h("div", { class: "grid-2" }, [
        ui.card(text.formTitle, [form]),
        ui.card(text.listTitle, [tickets]),
      ]),
    ]);
  },
};
