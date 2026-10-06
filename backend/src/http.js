/*
  Small helpers for reading requests and writing responses.
  HttpError is how a handler says "this request was wrong" with a status code
  and a message that is safe to show the visitor.
*/
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(payload);
}

// Reads the whole request body, refusing anything larger than limitBytes
export function readBody(req, limitBytes) {
  return new Promise(function (resolve, reject) {
    const tooLarge = new HttpError(413, "too_large", "That upload is too large.");

    if (Number(req.headers["content-length"] || 0) > limitBytes) {
      reject(tooLarge);
      return;
    }

    const chunks = [];
    let size = 0;

    req.on("data", function (chunk) {
      size += chunk.length;
      if (size > limitBytes) {
        req.removeAllListeners("data");
        reject(tooLarge);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", function () { resolve(Buffer.concat(chunks)); });
    req.on("error", reject);
  });
}

// Reads a small JSON object body
export async function readJson(req) {
  const body = await readBody(req, 16 * 1024);
  let parsed;

  try {
    parsed = JSON.parse(body.toString("utf8"));
  } catch (error) {
    throw new HttpError(400, "bad_json", "The request was not valid JSON.");
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpError(400, "bad_json", "The request was not valid JSON.");
  }
  return parsed;
}
