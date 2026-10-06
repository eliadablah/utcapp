/*
  The API's handlers: one function per thing the website can ask for.
  Each receives { req, res, url, visitorId, params } and returns the JSON to
  send back. Anything that changes data returns the visitor's fresh data, so
  the website can redraw from one answer.
*/
import { randomUUID } from "node:crypto";
import { limits, portalConfig, uploadTypes } from "./catalog.js";
import { HttpError, readBody, readJson } from "./http.js";
import * as repo from "./repository.js";
import * as storage from "./storage.js";
import * as check from "./validate.js";
import { ping } from "./db.js";

async function dataFor(visitorId, extra = {}) {
  return { data: await repo.getData(visitorId), ...extra };
}

async function enforceLimit(table, visitorId, max) {
  if ((await repo.countRows(table, visitorId)) >= max) {
    throw new HttpError(409, "limit_reached", "You have reached the limit for this section.");
  }
}

// --- Health ---
// Liveness: is the program running? The load balancer asks this.
export function health() {
  return { status: "ok" };
}

// Readiness: can it also reach the database?
export async function ready() {
  await ping();
  return { status: "ok", database: "ok" };
}

// --- Bootstrap: the fixed lists plus this visitor's data, in one call ---
export function bootstrap({ visitorId }) {
  return dataFor(visitorId, { config: portalConfig });
}

// --- Documents ---
export async function uploadDocument({ req, url, visitorId }) {
  const typeId = check.oneOf(url.searchParams.get("typeId"), "Document type", portalConfig.documentTypes.map(function (type) { return type.id; }));
  const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  const signature = uploadTypes[contentType];
  if (!signature) throw new HttpError(415, "bad_type", "That file type is not accepted. Use PDF, JPG or PNG.");

  await enforceLimit("documents", visitorId, limits.documents);

  const body = await readBody(req, portalConfig.maxUploadBytes);
  if (body.length === 0) throw new HttpError(400, "empty", "That file is empty.");
  // Check the file's first bytes, so a renamed file cannot pretend to be a PDF or image
  if (!signature.every(function (byte, index) { return body[index] === byte; })) {
    throw new HttpError(415, "bad_type", "That file does not look like a real PDF, JPG or PNG.");
  }

  const id = randomUUID();
  const s3Key = storage.uploadKey(visitorId, id);
  await storage.putFile(s3Key, body, contentType);

  try {
    await repo.insertDocument({ id, visitorId, typeId, fileName: check.fileName(req.headers["x-file-name"]), contentType, size: body.length, s3Key });
  } catch (error) {
    // Do not leave a file in S3 that no database row points to
    await storage.deleteFile(s3Key).catch(function () {});
    throw error;
  }

  return dataFor(visitorId);
}

export async function downloadDocument({ res, visitorId, params }) {
  const doc = check.isUuid(params.id) ? await repo.findDocument(visitorId, params.id) : null;
  if (!doc) throw new HttpError(404, "not_found", "That document was not found.");

  const stream = await storage.getFile(doc.s3_key);
  res.writeHead(200, {
    "Content-Type": doc.content_type,
    "Content-Length": doc.size,
    // "attachment" makes the browser save the file instead of opening it inside the site
    "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(doc.file_name),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  // If S3 fails halfway, drop the connection instead of crashing the API
  stream.on("error", function () { res.destroy(); });
  stream.pipe(res);
}

export async function deleteDocument({ visitorId, params }) {
  const doc = check.isUuid(params.id) ? await repo.findDocument(visitorId, params.id) : null;
  if (!doc) throw new HttpError(404, "not_found", "That document was not found.");

  await repo.deleteDocument(visitorId, doc.id);
  await storage.deleteFile(doc.s3_key);
  return dataFor(visitorId);
}

// --- Lab requests ---
export async function createLabRequest({ req, visitorId }) {
  const body = await readJson(req);
  const request = {
    id: randomUUID(),
    visitorId,
    labId: check.oneOf(body.labId, "Lab", portalConfig.labs.map(function (lab) { return lab.id; })),
    date: check.futureDate(body.date, "Date"),
    slot: check.oneOf(body.slot, "Time slot", portalConfig.slots),
    reason: check.text(body.reason, "Reason", 10, 400),
  };

  await enforceLimit("lab_requests", visitorId, limits.labRequests);
  await repo.insertLabRequest(request);
  return dataFor(visitorId);
}

export async function cancelLabRequest({ visitorId, params }) {
  if (check.isUuid(params.id)) await repo.cancelLabRequest(visitorId, params.id);
  return dataFor(visitorId);
}

// --- Tickets ---
export async function createTicket({ req, visitorId }) {
  const body = await readJson(req);
  const ticket = {
    visitorId,
    category: check.oneOf(body.category, "Category", portalConfig.categories),
    priority: check.oneOf(body.priority, "Priority", portalConfig.priorities),
    subject: check.text(body.subject, "Subject", 4, 80),
    details: check.text(body.details, "Details", 10, 1000),
  };

  await enforceLimit("tickets", visitorId, limits.tickets);
  const number = await repo.insertTicket(ticket);
  return dataFor(visitorId, { ticket: { number } });
}

export async function withdrawTicket({ visitorId, params }) {
  if (/^\d{1,9}$/.test(params.id)) await repo.withdrawTicket(visitorId, Number(params.id));
  return dataFor(visitorId);
}

// --- Course plan ---
export async function addCourse({ visitorId, params }) {
  const course = portalConfig.catalog.find(function (item) { return item.id === params.id; });
  if (!course) throw new HttpError(404, "not_found", "That course was not found.");

  const planned = await repo.plannedCourseIds(visitorId);
  if (!planned.includes(course.id)) {
    const credits = portalConfig.catalog
      .filter(function (item) { return planned.includes(item.id); })
      .reduce(function (sum, item) { return sum + item.credits; }, 0);
    if (credits + course.credits > portalConfig.maxCredits) {
      throw new HttpError(409, "over_limit", `That would go over the ${portalConfig.maxCredits} credit limit.`);
    }
    await repo.addCourse(visitorId, course.id);
  }
  return dataFor(visitorId);
}

export async function removeCourse({ visitorId, params }) {
  await repo.removeCourse(visitorId, String(params.id).slice(0, 20));
  return dataFor(visitorId);
}

// --- Reset: remove everything this visitor stored, files included ---
export async function resetData({ visitorId }) {
  const keys = await repo.listDocumentKeys(visitorId);
  await repo.deleteEverything(visitorId);
  await Promise.all(keys.map(function (row) { return storage.deleteFile(row.s3_key).catch(function () {}); }));
  return dataFor(visitorId);
}
