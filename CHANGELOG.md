# Changelog

## 2026-10-06

### Front end — Small fixes

- The sidebar's clear button now reads "Clear my data" and its confirmation
  warns that uploaded files are removed too.
- The menu's scrollbar on narrow screens is slim and uses the sidebar colors.
- Removed the unused placeholder `modules/compute/files/index.html`.
- Checked in the local preview only; these were not deployed before the
  environment was destroyed.

### Repository layout — `frontend/` folder

- Renamed `site/` to `frontend/` so it sits beside `backend/`. The compute
  module's `site_dir` input is now `frontend_dir`. Nothing changes in AWS.

### Backend — Live rollout

- Rolled the servers to a version that installs the API at boot, then attached
  the API target group to the Auto Scaling Group.
- Verified on `https://utc-dev.eliadablah.com`: both API targets healthy;
  a support request, lab request, course and PDF upload saved, survived a
  page reload, and the uploaded file downloaded back intact.

### Backend — Portal API

- Added `backend/`: a Node.js API on port 3000 that stores documents in S3 and
  lab requests, support requests and course plans in RDS MySQL, creating its
  tables on first run.
- Reads database settings from SSM Parameter Store and the password from
  Secrets Manager; connects to RDS over TLS; runs as an unprivileged systemd
  service; logs to CloudWatch.
- The load balancer routes `/api/*` to a new target group
  (`utc-api-target-group`); the app security group allows port 3000 from the
  load balancer only.
- No login yet: data is separated by a random per-browser visitor id.
- Smoke-tested on one server against the real database and bucket: health,
  bootstrap, ticket, lab request, course, upload, download, cross-visitor
  download refused, invalid input refused, reset.

### Front end — Server mode

- The site now saves through the API when it is reachable and falls back to
  browser-only demo mode when it is not.
- Added document download, and error messages for failed requests.
- Added `.gitattributes` so server scripts keep Unix line endings.

### Front end — Student Services Portal

- Added `site/`: a static portal with dashboard, enrollment checklist,
  document upload (type and size checks, drag and drop), lab access requests,
  support requests and a searchable course catalog.
- Data is kept in the browser's `localStorage`; there is no backend yet.
- Not yet verified in a browser.

### CMP-001 — Website deployment

- The compute module now uploads `site/` to S3 and each server syncs it into
  the web root at boot, replacing the inline placeholder page.
- Servers write `server.json` (instance ID and AZ) for the portal to display.
- Added a rolling instance refresh so a changed website replaces the servers.
- `modules/compute/files/index.html` is no longer used.

### IAC-001 — README and environment inputs/outputs

- Wrote the README: architecture, module layout, inputs, outputs, usage and
  how secrets are handled.
- Added `variables.tf`, `outputs.tf` and `terraform.tfvars.example` to
  `envs/dev/utc-app`.

### OBS-001 — Monitoring module

- Added SNS topic `utc-auto-scaling` with an optional email subscription.
- Added a CloudWatch log group for web server logs and alarms for unhealthy
  load balancer targets, database CPU and database free storage.

### CMP-001 — Compute module

- Added the launch template (Amazon Linux 2023, Apache, EFS mount, CloudWatch
  agent) and the Auto Scaling Group across the app subnets.
- Added CPU based scale-out / scale-in policies and scaling notifications.
- Added a placeholder home page that shows the serving instance and AZ.

### ING-001 — Load balancer module

- Added the ALB, target group `utc-target-group` and HTTP listener.
- HTTPS listener, ACM certificate and Route 53 records are created only when
  `domain_name` is set; HTTP then redirects to HTTPS.

### IAM-001 — EC2 instance role

- Added the app server role and instance profile: Session Manager, CloudWatch
  agent, and access limited to the app's bucket, secret, parameters and EFS.

### DB-001 / SEC-002 — Database module and secret storage

- Added RDS MySQL `utc-dev-database` in the database subnets.
- The master password is generated and held by Secrets Manager; SSM parameters
  under `/utc-app/dev/db/` expose the references the app needs.

### STO-001 — Storage module

- Added an encrypted, versioned, non-public S3 bucket and an encrypted EFS
  file system with one mount target per AZ.

### SEC-001 — Security groups

- Added security groups for the ALB, app servers, database and EFS, each
  accepting traffic only from the tier in front of it.

### NET-001 — Network module and dev environment

- Added the `network` module: VPC, Internet Gateway, public / private (app) /
  database subnets, NAT Gateway, and route tables.
- Private subnets and their route table associations wrap around the AZ list,
  so the module supports more than one app subnet per AZ.
- Wired the module into `envs/dev/utc-app` with the architecture diagram's
  addressing: VPC `10.10.0.0/16`, 3 AZs, 3 public, 6 app and 3 database `/20`
  subnets, and a single shared NAT Gateway.
- Validated with `terraform plan`.

### Validation status

- `terraform init`, `validate` and `plan` pass for the whole dev environment.
  The plan adds 60 resources on top of the already-applied network.
- `terraform apply` succeeded for the dev environment (HTTP only, no domain).
  The portal loads through the load balancer and requests are answered by two
  servers in two different AZs.
- Checked in AWS: both targets healthy; servers have no public IP; EFS mounted
  and writable on both servers; Apache and the CloudWatch agent running; log
  streams receiving events; both servers online in Systems Manager; database
  private and encrypted; S3 public access blocked; scaling policies attached
  to their alarms.
- Scaling tested by forcing the high-CPU alarm: a third server launched in
  `us-east-1b` and was healthy in about 80 seconds; the low-CPU alarm removed
  one server about five minutes later.
- Not yet tested: email delivery (no subscription set).

### ING-001 — Domain and HTTPS for dev

- Dev now serves at `https://utc-dev.eliadablah.com`: ACM certificate issued
  by DNS validation, HTTPS listener on 443, and a Route 53 alias record.
- Port 80 answers with a 301 redirect to HTTPS.
- Chosen naming: `utc-dev.eliadablah.com` for dev, `utc.eliadablah.com`
  reserved for prod.

### Fix — Server launch ordering

- The first apply failed creating the Auto Scaling Group ("Access denied when
  attempting to assume role AWSServiceRoleForAutoScaling"); a second apply
  succeeded.
- The instance profile output now waits for all role permissions, and the
  target group output waits for the listener, so servers no longer launch
  before their S3 access or the load balancer wiring exists.
