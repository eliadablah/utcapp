/*
  File storage. Uploaded documents live in the private S3 bucket under
  uploads/<visitor id>/<document id>. The server reaches S3 with its IAM role,
  so there are no access keys anywhere in this code.
*/
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "./config.js";

const s3 = new S3Client({ region: config.region });

export function uploadKey(visitorId, documentId) {
  return `uploads/${visitorId}/${documentId}`;
}

export async function putFile(key, body, contentType) {
  await s3.send(new PutObjectCommand({ Bucket: config.s3Bucket, Key: key, Body: body, ContentType: contentType }));
}

// Returns a readable stream of the file's bytes
export async function getFile(key) {
  const response = await s3.send(new GetObjectCommand({ Bucket: config.s3Bucket, Key: key }));
  return response.Body;
}

export async function deleteFile(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: config.s3Bucket, Key: key }));
}
