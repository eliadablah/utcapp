/*
  Remote backend: talks to the real API under /api, which saves to the
  database and to S3. Every method returns a promise of { data, ... } where
  data is the visitor's full, fresh state.

  There is no login yet, so the browser makes up a random visitor id once and
  sends it with every request. The server keeps each id's data separate.
*/
window.Portal = window.Portal || {};
Portal.backends = Portal.backends || {};

(function () {
  const ID_KEY = "utc-portal-visitor";

  // A random version-4 UUID. getRandomValues works on http and https pages alike.
  function newId() {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
  }

  let visitorId = null;
  function getVisitorId() {
    if (visitorId) return visitorId;
    try {
      visitorId = window.localStorage.getItem(ID_KEY);
      if (!visitorId) {
        visitorId = newId();
        window.localStorage.setItem(ID_KEY, visitorId);
      }
    } catch (error) {
      // Storage blocked: the id lasts only until the page is closed
      visitorId = visitorId || newId();
    }
    return visitorId;
  }

  // Sends one request and returns the parsed answer, or throws an Error whose
  // message is safe to show (the API writes those messages for visitors).
  function call(method, path, options) {
    const settings = options || {};
    const headers = Object.assign({ "X-Visitor-Id": getVisitorId() }, settings.headers || {});
    let body = settings.body;

    if (settings.json) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(settings.json);
    }

    const failed = Portal.content.app.requestFailed;

    return fetch("api/" + path, { method: method, headers: headers, body: body, cache: "no-store" })
      // The network itself failed (offline, server gone)
      .catch(function () { throw new Error(failed); })
      .then(function (response) {
        if (settings.raw && response.ok) return response;
        // An answer that is not JSON (such as an error page) counts as a failure
        return response.json().catch(function () { return null; }).then(function (payload) {
          if (response.ok && payload) return payload;
          throw new Error((payload && payload.error && payload.error.message) || failed);
        });
      });
  }

  Portal.backends.remote = {
    bootstrap: function () { return call("GET", "bootstrap"); },

    addDocument: function (input) {
      return call("POST", "documents?typeId=" + encodeURIComponent(input.typeId), {
        // The file name travels in a header, not the address, so it stays out of access logs
        headers: { "Content-Type": input.file.type, "X-File-Name": encodeURIComponent(input.file.name) },
        body: input.file,
      });
    },
    removeDocument: function (id) { return call("DELETE", "documents/" + encodeURIComponent(id)); },
    // Resolves to a Blob holding the stored file
    downloadDocument: function (id) {
      return call("GET", "documents/" + encodeURIComponent(id) + "/file", { raw: true })
        .then(function (response) { return response.blob(); });
    },

    addLabRequest: function (input) { return call("POST", "lab-requests", { json: input }); },
    cancelLabRequest: function (id) { return call("POST", "lab-requests/" + encodeURIComponent(id) + "/cancel"); },

    addTicket: function (input) { return call("POST", "tickets", { json: input }); },
    withdrawTicket: function (id) { return call("POST", "tickets/" + encodeURIComponent(id) + "/withdraw"); },

    addCourse: function (id) { return call("PUT", "courses/" + encodeURIComponent(id)); },
    removeCourse: function (id) { return call("DELETE", "courses/" + encodeURIComponent(id)); },

    reset: function () { return call("DELETE", "data"); },
  };
})();
