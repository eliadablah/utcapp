/*
  UTC Student Services API: the entry point.
  Listens on the port the load balancer sends /api/* requests to, matches each
  request to a handler in routes.js, and turns errors into tidy JSON answers.
*/
import http from "node:http";
import { config } from "./config.js";
import { HttpError, sendJson } from "./http.js";
import * as routes from "./routes.js";
import { isUuid } from "./validate.js";

// [method, path pattern, handler, needs a visitor id?]
const table = [
  ["GET", /^\/api\/health$/, routes.health, false],
  ["GET", /^\/api\/health\/ready$/, routes.ready, false],
  ["GET", /^\/api\/bootstrap$/, routes.bootstrap, true],
  ["POST", /^\/api\/documents$/, routes.uploadDocument, true],
  ["GET", /^\/api\/documents\/(?<id>[^/]+)\/file$/, routes.downloadDocument, true],
  ["DELETE", /^\/api\/documents\/(?<id>[^/]+)$/, routes.deleteDocument, true],
  ["POST", /^\/api\/lab-requests$/, routes.createLabRequest, true],
  ["POST", /^\/api\/lab-requests\/(?<id>[^/]+)\/cancel$/, routes.cancelLabRequest, true],
  ["POST", /^\/api\/tickets$/, routes.createTicket, true],
  ["POST", /^\/api\/tickets\/(?<id>[^/]+)\/withdraw$/, routes.withdrawTicket, true],
  ["PUT", /^\/api\/courses\/(?<id>[^/]+)$/, routes.addCourse, true],
  ["DELETE", /^\/api\/courses\/(?<id>[^/]+)$/, routes.removeCourse, true],
  ["DELETE", /^\/api\/data$/, routes.resetData, true],
];

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");

  for (const [method, pattern, handler, needsVisitor] of table) {
    const match = req.method === method && pattern.exec(url.pathname);
    if (!match) continue;

    // The visitor id arrives in a custom header. Browsers refuse to let another
    // website send custom headers here, which blocks cross-site request forgery.
    const visitorId = req.headers["x-visitor-id"];
    if (needsVisitor && !isUuid(visitorId)) {
      throw new HttpError(401, "no_visitor", "A valid visitor id is required.");
    }

    const result = await handler({ req, res, url, visitorId, params: match.groups || {} });
    // Handlers that stream a file have already answered
    if (!res.headersSent) sendJson(res, 200, result);
    return;
  }

  throw new HttpError(404, "not_found", "No such API route.");
}

const server = http.createServer(function (req, res) {
  const started = Date.now();

  handle(req, res)
    .catch(function (error) {
      const known = error instanceof HttpError;
      // Unexpected errors are logged in full but never described to the visitor
      if (!known) console.error(JSON.stringify({ level: "error", message: error.message, code: error.code, stack: error.stack }));

      if (res.headersSent) {
        res.destroy();
        return;
      }
      const status = known ? error.status : 500;
      if (status === 413) res.setHeader("Connection", "close");
      sendJson(res, status, {
        error: { code: known ? error.code : "server_error", message: known ? error.message : "Something went wrong on our side." },
      });
    })
    .finally(function () {
      // One line per request. Only the path is logged: no query string, no visitor id.
      const path = String(req.url).split("?")[0];
      if (path !== "/api/health") {
        console.log(JSON.stringify({ level: "info", method: req.method, path, status: res.statusCode, ms: Date.now() - started }));
      }
    });
});

server.listen(config.port, function () {
  console.log(JSON.stringify({ level: "info", message: `UTC API listening on port ${config.port}` }));
});

// Finish in-flight requests when the server is being replaced
process.on("SIGTERM", function () {
  server.close(function () { process.exit(0); });
});
