#!/bin/bash
# Installs and starts the UTC API on an app server. Run as root by the boot script,
# after the backend folder has been copied from S3 to /opt/utc-api.
# Needs in the environment: SSM_PREFIX, S3_BUCKET, AWS_DEFAULT_REGION
set -euo pipefail

APP_DIR=/opt/utc-api

# --- Node.js ---
dnf install -y nodejs24 nodejs24-npm
# Amazon Linux names these with the version on the end; fall back to the plain names
NODE=$(command -v node-24 || command -v node)
NPM=$(command -v npm-24 || command -v npm)

# --- A locked-down user for the API to run as (no login, no home folder) ---
id -u utcapi >/dev/null 2>&1 || useradd --system --no-create-home --shell /sbin/nologin utcapi

# --- The API's libraries ---
cd "$APP_DIR"
"$NPM" install --omit=dev --no-audit --no-fund

# --- Amazon's certificate list, so the API can verify it is talking to the real database ---
curl -sSf -o "$APP_DIR/rds-ca.pem" https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# --- Settings: read the references from SSM Parameter Store. No passwords here. ---
param() {
  aws ssm get-parameter --name "$SSM_PREFIX/db/$1" --query Parameter.Value --output text
}

cat > /etc/utc-api.env <<EOF
PORT=3000
AWS_REGION=$AWS_DEFAULT_REGION
DB_HOST=$(param endpoint)
DB_NAME=$(param name)
DB_SECRET_ARN=$(param secret_arn)
DB_CA_FILE=$APP_DIR/rds-ca.pem
S3_BUCKET=$S3_BUCKET
EOF
chown root:utcapi /etc/utc-api.env
chmod 640 /etc/utc-api.env

# --- Log folder ---
mkdir -p /var/log/utc-api
chown utcapi:utcapi /var/log/utc-api

# --- Run it as a service that starts on boot and restarts if it crashes ---
sed "s|__NODE__|$NODE|" "$APP_DIR/deploy/utc-api.service" > /etc/systemd/system/utc-api.service
systemctl daemon-reload
systemctl enable utc-api
systemctl restart utc-api
