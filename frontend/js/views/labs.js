/*
  Lab access view: a form to ask for time in a lab, and the list of requests.
  Requests stay "Pending review" because approving them is a staff job.
*/
window.Portal = window.Portal || {};
Portal.views = Portal.views || {};

Portal.views.labs = {
  render: function () {
    const h = Portal.h;
    const ui = Portal.components;
    const text = Portal.content.labs;
    const status = Portal.content.status;
    const state = Portal.store.get();

    // --- Form ---
    const lab = ui.field({ id: "lab-name", label: text.labLabel, type: "select", options: text.labs.map(function (item) { return { value: item.id, label: item.label }; }) });
    const date = ui.field({ id: "lab-date", label: text.dateLabel, type: "date", attrs: { min: Portal.today() } });
    const slot = ui.field({ id: "lab-slot", label: text.slotLabel, type: "select", options: text.slots });
    const reason = ui.field({ id: "lab-reason", label: text.reasonLabel, type: "textarea", hint: text.reasonHint, attrs: { maxlength: "400" } });
    const error = h("p", { class: "form-error", role: "alert" });
    date.input.value = Portal.today();

    function submit(event) {
      event.preventDefault();

      // Dates in YYYY-MM-DD form compare correctly as plain text
      if (!date.input.value || date.input.value < Portal.today()) { error.textContent = text.errors.date; return; }
      if (reason.input.value.trim().length < 10) { error.textContent = text.errors.reason; return; }

      submitButton.disabled = true;
      Portal.store.addLabRequest({
        labId: lab.input.value,
        date: date.input.value,
        slot: slot.input.value,
        reason: reason.input.value.trim(),
      })
        .then(function () { ui.toast(text.added); })
        .catch(function (failure) {
          submitButton.disabled = false;
          error.textContent = failure.message;
        });
    }

    const submitButton = h("button", { class: "btn", type: "submit", text: text.submit });
    const form = h("form", { class: "form", onsubmit: submit, novalidate: true }, [
      lab.wrap,
      h("div", { class: "form-row" }, [date.wrap, slot.wrap]),
      reason.wrap,
      error,
      h("div", {}, [submitButton]),
    ]);

    // --- Request list ---
    const requests = state.labRequests.length === 0
      ? ui.emptyState(text.empty)
      : h("ul", { class: "list" }, state.labRequests.map(function (request) {
        const pending = request.status === "pending";
        return h("li", {}, [
          h("div", { class: "item-main" }, [
            h("div", { class: "item-title", text: request.labLabel }),
            // T12:00 keeps the calendar day from shifting across time zones
            h("div", { class: "item-meta", text: Portal.formatDate(request.date + "T12:00:00") + " · " + request.slot }),
            h("div", { class: "item-meta", text: request.reason }),
          ]),
          h("div", { class: "item-side" }, [
            ui.badge(pending ? status.pending : status.cancelled, pending ? "warn" : "neutral"),
            pending
              ? h("button", {
                class: "btn btn-ghost btn-small",
                type: "button",
                text: text.cancel,
                "aria-label": text.cancel + ": " + request.labLabel,
                onclick: function () {
                  Portal.store.cancelLabRequest(request.id)
                    .then(function () { ui.toast(text.cancelled); })
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
        ui.card(text.listTitle, [requests]),
      ]),
    ]);
  },
};
