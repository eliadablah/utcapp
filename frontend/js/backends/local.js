/*
  Local backend: the stand-in used when there is no API to talk to (for
  example when the page is opened straight from disk). It keeps everything in
  the browser's localStorage and offers the same methods as the remote
  backend, so the rest of the site cannot tell the difference.
  Files are not stored here, only their name, type and size.
*/
window.Portal = window.Portal || {};
Portal.backends = Portal.backends || {};

(function () {
  const KEY = "utc-portal-v1";

  function emptyState() {
    return { documents: [], labRequests: [], tickets: [], plannedCourseIds: [], ticketSeq: 1000 };
  }

  // localStorage can be blocked (private windows), so every use is guarded
  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? Object.assign(emptyState(), JSON.parse(raw)) : emptyState();
    } catch (error) {
      return emptyState();
    }
  }

  let state = load();

  function save(extra) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      // Still works for this visit; it just will not survive a refresh
    }
    return Promise.resolve(Object.assign({ data: state }, extra || {}));
  }

  function patch(collection, id, changes) {
    state[collection] = state[collection].map(function (item) {
      return item.id === id ? Object.assign({}, item, changes) : item;
    });
  }

  function labelOf(list, id) {
    const match = list.find(function (item) { return item.id === id; });
    return match ? match.label : id;
  }

  Portal.backends.local = {
    bootstrap: function () { return Promise.resolve({ data: state }); },

    addDocument: function (input) {
      state.documents = [{
        id: Portal.uid(),
        typeId: input.typeId,
        typeLabel: labelOf(Portal.content.documents.types, input.typeId),
        fileName: input.file.name,
        size: input.file.size,
        createdAt: new Date().toISOString(),
      }].concat(state.documents);
      return save();
    },
    removeDocument: function (id) {
      state.documents = state.documents.filter(function (doc) { return doc.id !== id; });
      return save();
    },

    addLabRequest: function (input) {
      state.labRequests = [{
        id: Portal.uid(),
        labLabel: labelOf(Portal.content.labs.labs, input.labId),
        date: input.date,
        slot: input.slot,
        reason: input.reason,
        status: "pending",
        createdAt: new Date().toISOString(),
      }].concat(state.labRequests);
      return save();
    },
    cancelLabRequest: function (id) {
      patch("labRequests", id, { status: "cancelled" });
      return save();
    },

    addTicket: function (input) {
      state.ticketSeq += 1;
      const number = "SR-" + state.ticketSeq;
      state.tickets = [Object.assign({ id: Portal.uid(), number: number, status: "open", createdAt: new Date().toISOString() }, input)].concat(state.tickets);
      return save({ ticket: { number: number } });
    },
    withdrawTicket: function (id) {
      patch("tickets", id, { status: "withdrawn" });
      return save();
    },

    addCourse: function (id) {
      if (state.plannedCourseIds.indexOf(id) === -1) state.plannedCourseIds = state.plannedCourseIds.concat(id);
      return save();
    },
    removeCourse: function (id) {
      state.plannedCourseIds = state.plannedCourseIds.filter(function (courseId) { return courseId !== id; });
      return save();
    },

    reset: function () {
      state = emptyState();
      return save();
    },
  };
})();
