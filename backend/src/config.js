/*
  Settings the API reads from its environment (written to /etc/utc-api.env by
  deploy/install.sh). None of these is a secret: the database password is
  fetched from Secrets Manager at run time, using DB_SECRET_ARN as the pointer.
*/
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3000),
  region: required("AWS_REGION"),
  dbHost: required("DB_HOST"),
  dbName: required("DB_NAME"),
  dbSecretArn: required("DB_SECRET_ARN"),
  dbCaFile: required("DB_CA_FILE"),
  s3Bucket: required("S3_BUCKET"),
};
