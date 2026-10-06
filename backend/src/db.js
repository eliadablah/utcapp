/*
  Database access. Opens a small pool of MySQL connections over TLS, using a
  username and password fetched from Secrets Manager (never from a file).
  Also creates the tables the first time the API runs.
*/
import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { config } from "./config.js";

const secrets = new SecretsManagerClient({ region: config.region });

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS documents (
     id CHAR(36) PRIMARY KEY,
     visitor_id CHAR(36) NOT NULL,
     type_id VARCHAR(40) NOT NULL,
     file_name VARCHAR(255) NOT NULL,
     content_type VARCHAR(100) NOT NULL,
     size INT UNSIGNED NOT NULL,
     s3_key VARCHAR(255) NOT NULL,
     created_at DATETIME NOT NULL,
     INDEX idx_documents_visitor (visitor_id)
   ) DEFAULT CHARSET = utf8mb4`,
  `CREATE TABLE IF NOT EXISTS lab_requests (
     id CHAR(36) PRIMARY KEY,
     visitor_id CHAR(36) NOT NULL,
     lab_id VARCHAR(40) NOT NULL,
     lab_date CHAR(10) NOT NULL,
     slot VARCHAR(40) NOT NULL,
     reason VARCHAR(400) NOT NULL,
     status VARCHAR(20) NOT NULL,
     created_at DATETIME NOT NULL,
     INDEX idx_lab_requests_visitor (visitor_id)
   ) DEFAULT CHARSET = utf8mb4`,
  `CREATE TABLE IF NOT EXISTS tickets (
     seq INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
     visitor_id CHAR(36) NOT NULL,
     category VARCHAR(60) NOT NULL,
     priority VARCHAR(20) NOT NULL,
     subject VARCHAR(80) NOT NULL,
     details VARCHAR(1000) NOT NULL,
     status VARCHAR(20) NOT NULL,
     created_at DATETIME NOT NULL,
     INDEX idx_tickets_visitor (visitor_id)
   ) AUTO_INCREMENT = 1001 DEFAULT CHARSET = utf8mb4`,
  `CREATE TABLE IF NOT EXISTS planned_courses (
     visitor_id CHAR(36) NOT NULL,
     course_id VARCHAR(20) NOT NULL,
     PRIMARY KEY (visitor_id, course_id)
   ) DEFAULT CHARSET = utf8mb4`,
];

let poolPromise = null;

async function createPool() {
  const response = await secrets.send(new GetSecretValueCommand({ SecretId: config.dbSecretArn }));
  const secret = JSON.parse(response.SecretString);

  const pool = mysql.createPool({
    host: config.dbHost,
    database: config.dbName,
    user: secret.username,
    password: secret.password,
    // Encrypt the connection and check it really is our RDS server
    ssl: { ca: readFileSync(config.dbCaFile) },
    connectionLimit: 5,
    timezone: "Z",
  });

  for (const statement of SCHEMA) await pool.query(statement);
  return pool;
}

function getPool() {
  if (!poolPromise) {
    poolPromise = createPool().catch(function (error) {
      poolPromise = null; // let the next request try again
      throw error;
    });
  }
  return poolPromise;
}

// Runs one parameterized query. Values always go in params, never into the SQL text.
export async function query(sql, params = []) {
  try {
    const pool = await getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    // AWS rotates the password on a schedule. If ours went stale, fetch the new one once.
    if (error.code !== "ER_ACCESS_DENIED_ERROR") throw error;

    const stale = poolPromise;
    poolPromise = null;
    if (stale) stale.then(function (pool) { return pool.end(); }).catch(function () {});

    const pool = await getPool();
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}

// True when the database answers. Used by the readiness check.
export async function ping() {
  await query("SELECT 1");
  return true;
}
