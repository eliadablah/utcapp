/*
  Input checks. The website also checks these, but the API never trusts the
  browser: every value is checked again here before it reaches the database.
*/
import { HttpError } from "./http.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isUuid(value) {
  return typeof value === "string" && UUID.test(value);
}

// A trimmed string between min and max characters long
export function text(value, name, min, max) {
  if (typeof value !== "string") throw new HttpError(400, "invalid", `${name} is required.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new HttpError(400, "invalid", `${name} is too short.`);
  if (trimmed.length > max) throw new HttpError(400, "invalid", `${name} is too long.`);
  return trimmed;
}

// One of a fixed list of allowed values
export function oneOf(value, name, allowed) {
  if (!allowed.includes(value)) throw new HttpError(400, "invalid", `${name} is not a valid choice.`);
  return value;
}

// A real calendar date in YYYY-MM-DD form that is not in the past
export function futureDate(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, "invalid", `${name} is not a valid date.`);
  }
  const date = new Date(value + "T00:00:00Z");
  if (isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, "invalid", `${name} is not a valid date.`);
  }
  // One day of slack, because the visitor's "today" can be the server's "yesterday"
  if (date.getTime() < Date.now() - 2 * 24 * 60 * 60 * 1000) {
    throw new HttpError(400, "invalid", `${name} must be today or later.`);
  }
  return value;
}

// Keeps a file name safe to store and to send back in a download header
export function fileName(value) {
  let name = "";
  try {
    name = decodeURIComponent(String(value || ""));
  } catch (error) {
    name = "";
  }
  name = name.replace(/[\\/\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
  return name || "document";
}
