/*
  Every database question the API asks, in one place.
  Each function is scoped to one visitor id, so a visitor can only ever read
  or change their own rows.
*/
import { query } from "./db.js";
import { portalConfig } from "./catalog.js";

function labelOf(list, id) {
  const match = list.find(function (item) { return item.id === id; });
  return match ? match.label : id;
}

// Everything the website shows for one visitor, in the shape the pages expect
export async function getData(visitorId) {
  const [documents, labRequests, tickets, courses] = await Promise.all([
    query("SELECT id, type_id, file_name, size, created_at FROM documents WHERE visitor_id = ? ORDER BY created_at DESC", [visitorId]),
    query("SELECT id, lab_id, lab_date, slot, reason, status, created_at FROM lab_requests WHERE visitor_id = ? ORDER BY created_at DESC", [visitorId]),
    query("SELECT seq, category, priority, subject, details, status, created_at FROM tickets WHERE visitor_id = ? ORDER BY seq DESC", [visitorId]),
    query("SELECT course_id FROM planned_courses WHERE visitor_id = ?", [visitorId]),
  ]);

  return {
    documents: documents.map(function (row) {
      return {
        id: row.id,
        typeId: row.type_id,
        typeLabel: labelOf(portalConfig.documentTypes, row.type_id),
        fileName: row.file_name,
        size: row.size,
        createdAt: row.created_at.toISOString(),
      };
    }),
    labRequests: labRequests.map(function (row) {
      return {
        id: row.id,
        labLabel: labelOf(portalConfig.labs, row.lab_id),
        date: row.lab_date,
        slot: row.slot,
        reason: row.reason,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      };
    }),
    tickets: tickets.map(function (row) {
      return {
        id: String(row.seq),
        number: "SR-" + row.seq,
        category: row.category,
        priority: row.priority,
        subject: row.subject,
        details: row.details,
        status: row.status,
        createdAt: row.created_at.toISOString(),
      };
    }),
    plannedCourseIds: courses.map(function (row) { return row.course_id; }),
  };
}

export async function countRows(table, visitorId) {
  // table is one of our own fixed names, never text from a visitor
  const rows = await query(`SELECT COUNT(*) AS total FROM ${table} WHERE visitor_id = ?`, [visitorId]);
  return rows[0].total;
}

// --- Documents ---
export function insertDocument(doc) {
  return query(
    "INSERT INTO documents (id, visitor_id, type_id, file_name, content_type, size, s3_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())",
    [doc.id, doc.visitorId, doc.typeId, doc.fileName, doc.contentType, doc.size, doc.s3Key],
  );
}

export async function findDocument(visitorId, id) {
  const rows = await query("SELECT id, file_name, content_type, size, s3_key FROM documents WHERE visitor_id = ? AND id = ?", [visitorId, id]);
  return rows[0] || null;
}

export function listDocumentKeys(visitorId) {
  return query("SELECT s3_key FROM documents WHERE visitor_id = ?", [visitorId]);
}

export function deleteDocument(visitorId, id) {
  return query("DELETE FROM documents WHERE visitor_id = ? AND id = ?", [visitorId, id]);
}

// --- Lab requests ---
export function insertLabRequest(request) {
  return query(
    "INSERT INTO lab_requests (id, visitor_id, lab_id, lab_date, slot, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', UTC_TIMESTAMP())",
    [request.id, request.visitorId, request.labId, request.date, request.slot, request.reason],
  );
}

export function cancelLabRequest(visitorId, id) {
  return query("UPDATE lab_requests SET status = 'cancelled' WHERE visitor_id = ? AND id = ? AND status = 'pending'", [visitorId, id]);
}

// --- Tickets ---
export async function insertTicket(ticket) {
  const result = await query(
    "INSERT INTO tickets (visitor_id, category, priority, subject, details, status, created_at) VALUES (?, ?, ?, ?, ?, 'open', UTC_TIMESTAMP())",
    [ticket.visitorId, ticket.category, ticket.priority, ticket.subject, ticket.details],
  );
  return "SR-" + result.insertId;
}

export function withdrawTicket(visitorId, seq) {
  return query("UPDATE tickets SET status = 'withdrawn' WHERE visitor_id = ? AND seq = ? AND status = 'open'", [visitorId, seq]);
}

// --- Course plan ---
export async function plannedCourseIds(visitorId) {
  const rows = await query("SELECT course_id FROM planned_courses WHERE visitor_id = ?", [visitorId]);
  return rows.map(function (row) { return row.course_id; });
}

export function addCourse(visitorId, courseId) {
  return query("INSERT IGNORE INTO planned_courses (visitor_id, course_id) VALUES (?, ?)", [visitorId, courseId]);
}

export function removeCourse(visitorId, courseId) {
  return query("DELETE FROM planned_courses WHERE visitor_id = ? AND course_id = ?", [visitorId, courseId]);
}

// --- Reset ---
export async function deleteEverything(visitorId) {
  await query("DELETE FROM documents WHERE visitor_id = ?", [visitorId]);
  await query("DELETE FROM lab_requests WHERE visitor_id = ?", [visitorId]);
  await query("DELETE FROM tickets WHERE visitor_id = ?", [visitorId]);
  await query("DELETE FROM planned_courses WHERE visitor_id = ?", [visitorId]);
}
