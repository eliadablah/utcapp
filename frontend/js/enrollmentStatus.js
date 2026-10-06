/*
  Works out the enrollment steps from what the visitor has actually done.
  Used by both the dashboard ("what is next?") and the enrollment page.
  Returns { steps, next, ready } where each step has a state of done / current / todo.
*/
window.Portal = window.Portal || {};

Portal.enrollmentStatus = function () {
  const text = Portal.content.enrollment;
  const state = Portal.store.get();

  const requiredTypes = Portal.content.documents.types.filter(function (type) { return type.required; });
  const receivedCount = requiredTypes.filter(function (type) {
    return state.documents.some(function (doc) { return doc.typeId === type.id; });
  }).length;

  const documentsDone = receivedCount === requiredTypes.length;
  const coursesDone = state.plannedCourseIds.length > 0;
  const ready = documentsDone && coursesDone;

  const steps = [
    {
      id: "application",
      label: text.steps.application.label,
      detail: text.steps.application.detail,
      done: true,
    },
    {
      id: "documents",
      label: text.steps.documents.label,
      detail: receivedCount + text.documentsProgress + requiredTypes.length + text.documentsProgressEnd,
      route: text.steps.documents.route,
      done: documentsDone,
    },
    {
      id: "courses",
      label: text.steps.courses.label,
      detail: state.plannedCourseIds.length + text.coursesProgress,
      route: text.steps.courses.route,
      done: coursesDone,
    },
    {
      // Staff do this part, so the portal can only say whether it is ready for them
      id: "review",
      label: text.steps.review.label,
      detail: ready ? text.reviewReady : text.reviewWaiting,
      done: false,
    },
  ];

  // The first unfinished step the visitor can act on is the "current" one
  const next = steps.find(function (step) { return !step.done && step.route; }) || null;
  steps.forEach(function (step) {
    step.state = step.done ? "done" : (next && step.id === next.id) || (ready && step.id === "review") ? "current" : "todo";
  });

  return { steps: steps, next: next, ready: ready, receivedCount: receivedCount, requiredCount: requiredTypes.length };
};
