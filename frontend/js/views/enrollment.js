/*
  Enrollment view: the full step-by-step checklist.
  The steps come from Portal.enrollmentStatus(), so they tick themselves off
  as documents are uploaded and courses are chosen.
*/
window.Portal = window.Portal || {};
Portal.views = Portal.views || {};

Portal.views.enrollment = {
  render: function () {
    const h = Portal.h;
    const ui = Portal.components;
    const text = Portal.content.enrollment;
    const status = Portal.content.status;
    const enrollment = Portal.enrollmentStatus();

    const tones = { done: "ok", current: "brand", todo: "neutral" };

    const steps = h("ol", { class: "steps" }, enrollment.steps.map(function (step, index) {
      return h("li", { class: "step is-" + step.state, "aria-current": step.state === "current" ? "step" : null }, [
        h("div", { class: "step-dot", "aria-hidden": "true", text: String(index + 1) }),
        h("div", {}, [
          h("div", { class: "item-title", text: step.label }),
          h("div", { class: "item-meta", text: step.detail }),
        ]),
        h("div", { class: "item-side" }, [
          ui.badge(status[step.state], tones[step.state]),
          // Only steps the visitor can act on get a button
          step.route && !step.done
            ? h("a", { class: "btn btn-small", href: "#/" + step.route, text: text.open })
            : null,
        ]),
      ]);
    }));

    return h("div", { class: "main-inner" }, [
      ui.pageHeader(text.title, text.subtitle),
      ui.card(text.stepsTitle, [steps]),
    ]);
  },
};
