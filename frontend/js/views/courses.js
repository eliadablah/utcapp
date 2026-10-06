/*
  Courses view: search and filter this term's catalog and build a course plan.
  The plan is capped at the credit limit set in content.js.
*/
window.Portal = window.Portal || {};
Portal.views = Portal.views || {};

(function () {
  // Kept outside render so the search survives when the page redraws
  let query = "";
  let dept = "";

  Portal.views.courses = {
    render: function () {
      const h = Portal.h;
      const ui = Portal.components;
      const text = Portal.content.courses;
      const status = Portal.content.status;
      const state = Portal.store.get();

      const isPlanned = function (course) { return state.plannedCourseIds.indexOf(course.id) !== -1; };
      const plannedCredits = text.catalog.filter(isPlanned).reduce(function (sum, course) { return sum + course.credits; }, 0);

      // --- Filters ---
      const departments = text.catalog
        .map(function (course) { return course.dept; })
        .filter(function (name, index, all) { return all.indexOf(name) === index; });

      const search = ui.field({ id: "course-search", label: text.searchLabel, type: "search", placeholder: text.searchPlaceholder });
      const deptField = ui.field({
        id: "course-dept",
        label: text.deptLabel,
        type: "select",
        options: [{ value: "", label: text.allDepts }].concat(departments),
      });
      search.input.value = query;
      deptField.input.value = dept;

      // --- Course cards ---
      const grid = h("div", { class: "course-grid", "aria-live": "polite" });

      function toggle(course) {
        if (!isPlanned(course) && plannedCredits + course.credits > text.maxCredits) {
          ui.toast(text.overLimit);
          return;
        }
        const wasPlanned = isPlanned(course);
        Portal.store.toggleCourse(course.id)
          .then(function () { ui.toast(wasPlanned ? text.removed : text.added); })
          .catch(function (failure) { ui.toast(failure.message); });
      }

      function drawGrid() {
        const needle = query.trim().toLowerCase();
        const matches = text.catalog.filter(function (course) {
          const haystack = (course.title + " " + course.code + " " + course.instructor).toLowerCase();
          return (!dept || course.dept === dept) && (!needle || haystack.indexOf(needle) !== -1);
        });

        grid.replaceChildren.apply(grid, matches.length === 0
          ? [ui.emptyState(text.empty)]
          : matches.map(function (course) {
            const planned = isPlanned(course);
            return h("article", { class: "course" + (planned ? " is-planned" : "") }, [
              h("div", { class: "course-top" }, [
                h("span", { class: "course-code", text: course.code }),
                planned ? ui.badge(status.planned, "ok") : ui.badge(course.credits + text.credits, "neutral"),
              ]),
              h("h3", { text: course.title }),
              h("div", { class: "item-meta", text: course.instructor }),
              h("div", { class: "item-meta", text: course.schedule + " · " + course.location }),
              h("button", {
                class: planned ? "btn btn-ghost btn-small" : "btn btn-small",
                type: "button",
                text: planned ? text.remove : text.add,
                "aria-label": (planned ? text.remove : text.add) + ": " + course.title,
                onclick: function () { toggle(course); },
              }),
            ]);
          }));
      }

      // Typing only redraws the cards, so the search box keeps focus
      search.input.addEventListener("input", function () { query = search.input.value; drawGrid(); });
      deptField.input.addEventListener("change", function () { dept = deptField.input.value; drawGrid(); });
      drawGrid();

      // --- Render ---
      return h("div", { class: "main-inner" }, [
        ui.pageHeader(text.title, text.subtitle),
        h("div", { class: "notice", text: text.planSummary + state.plannedCourseIds.length + text.planCourses + plannedCredits + " / " + text.maxCredits + text.credits }),
        h("div", { class: "card" }, [h("div", { class: "form-row" }, [search.wrap, deptField.wrap])]),
        grid,
      ]);
    },
  };
})();
