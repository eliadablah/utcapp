/*
  The portal's memory. Holds the visitor's current data and tells the app to
  redraw whenever it changes.

  The data itself lives in a "backend": the real API when it answers
  (mode "server"), or the browser's own storage when it does not (mode "demo").
  Every action returns a promise, because the server takes a moment to reply.
*/
window.Portal = window.Portal || {};

(function () {
  const listeners = [];
  let backend = null;
  let state = { documents: [], labRequests: [], tickets: [], plannedCourseIds: [] };

  function notify() {
    listeners.forEach(function (listener) { listener(); });
  }

  // Runs a backend call, then swaps in the fresh data it returned
  function run(promise) {
    return promise.then(function (result) {
      state = result.data;
      notify();
      return result;
    });
  }

  // The server owns the fixed lists when it is running; copy them over the built-in ones
  function useServerConfig(config) {
    const content = Portal.content;
    content.documents.types = config.documentTypes;
    content.documents.maxBytes = config.maxUploadBytes;
    content.labs.labs = config.labs;
    content.labs.slots = config.slots;
    content.support.categories = config.categories;
    content.support.priorities = config.priorities;
    content.courses.catalog = config.catalog;
    content.courses.maxCredits = config.maxCredits;
  }

  Portal.store = {
    mode: "demo",

    get: function () { return state; },
    subscribe: function (listener) { listeners.push(listener); },

    // Picks the backend. Call once, before the first draw.
    init: function () {
      return Portal.backends.remote.bootstrap()
        .then(function (result) {
          backend = Portal.backends.remote;
          Portal.store.mode = "server";
          useServerConfig(result.config);
          state = result.data;
        })
        .catch(function () {
          backend = Portal.backends.local;
          Portal.store.mode = "demo";
          return backend.bootstrap().then(function (result) { state = result.data; });
        });
    },

    addDocument: function (input) { return run(backend.addDocument(input)); },
    removeDocument: function (id) { return run(backend.removeDocument(id)); },
    // Only the server keeps the actual file, so only it can hand it back
    canDownload: function () { return typeof backend.downloadDocument === "function"; },
    downloadDocument: function (id) { return backend.downloadDocument(id); },

    addLabRequest: function (input) { return run(backend.addLabRequest(input)); },
    cancelLabRequest: function (id) { return run(backend.cancelLabRequest(id)); },

    addTicket: function (input) { return run(backend.addTicket(input)); },
    withdrawTicket: function (id) { return run(backend.withdrawTicket(id)); },

    toggleCourse: function (courseId) {
      const planned = state.plannedCourseIds.indexOf(courseId) !== -1;
      return run(planned ? backend.removeCourse(courseId) : backend.addCourse(courseId));
    },

    reset: function () { return run(backend.reset()); },
  };
})();
