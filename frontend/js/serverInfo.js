/*
  Finds out which app server answered this visit.
  Each EC2 server writes its own server.json at boot ({ instanceId, az }).
  When the page is opened straight from disk there is no such file, so this
  resolves to null and the sidebar says "Local preview".
*/
window.Portal = window.Portal || {};

Portal.loadServerInfo = function () {
  return fetch("server.json", { cache: "no-store" })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (info) { return info && info.instanceId ? info : null; })
    .catch(function () { return null; });
};
