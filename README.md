# utcapp

Terraform for the **UTC Student Services Portal** AWS infrastructure: a
three-tier, multi-AZ environment where only the load balancer is public and the
app servers and database stay private.

## Architecture

```text
Users -> Route 53 -> ALB (public subnets, HTTPS via ACM)
              -> EC2 app servers in an Auto Scaling Group (private app subnets)
              -> RDS MySQL (private database subnets)

Supporting: NAT Gateway, EFS, S3, IAM role, Secrets Manager, SSM Parameter
Store, CloudWatch alarms and logs, SNS notifications.
```

- VPC `10.10.0.0/16` across 3 Availability Zones
- 3 public, 6 app and 3 database subnets (`/20` each)

## Layout

```text
frontend           Portal front end (static HTML, CSS, JavaScript)
backend            Portal API (Node.js) and its install script
envs/dev/utc-app   Dev environment: calls the modules and sets their values
modules/network    VPC, subnets, gateways, route tables          (NET-001)
modules/security   Security groups for ALB, app, database, EFS   (SEC-001)
modules/alb        ALB, target group, listeners, ACM, Route 53   (ING-001)
modules/compute    Launch template, Auto Scaling Group, scaling  (CMP-001)
modules/database   RDS MySQL and secret references       (DB-001, SEC-002)
modules/storage    S3 bucket and EFS                             (STO-001)
modules/iam        EC2 instance role and policies                (IAM-001)
modules/monitoring SNS topic, log group, CloudWatch alarms       (OBS-001)
```

## Inputs

Set these in `envs/dev/utc-app/terraform.tfvars` (copy
`terraform.tfvars.example`). The file is ignored by Git.

| Name | What it is | Default |
|---|---|---|
| `aws_region` | Region to build in | `us-east-1` |
| `domain_name` | Full app domain, e.g. `app.example.com`. Empty = HTTP only | empty |
| `hosted_zone_name` | Route 53 hosted zone the domain lives in | empty |
| `notification_email` | Address that receives alerts. Empty = no emails | empty |

HTTPS, the ACM certificate and the Route 53 record are created only when
`domain_name` is set. The hosted zone must already exist in the account.

## Outputs

| Name | What it is |
|---|---|
| `app_url` | Address to open in a browser |
| `alb_dns_name` | Load balancer's AWS-generated address |
| `vpc_id` | VPC ID |
| `db_endpoint` | Database hostname (private) |
| `db_secret_arn` | Reference to the database password secret |
| `s3_bucket_name` | S3 bucket name |
| `autoscaling_group_name` | Auto Scaling Group name |

## Usage

Run from `envs/dev/utc-app`:

```bash
terraform init
terraform plan
terraform apply
terraform destroy
```

The environment bills by the hour while it exists (NAT Gateway, load balancer,
EC2, RDS). Run `terraform destroy` when finished.

## Secrets

- No password is stored in this repository or in the Terraform state. RDS
  generates the master password and keeps it in AWS Secrets Manager.
- The app finds the database through SSM parameters under `/utc-app/dev/db/`
  (`endpoint`, `name`, `secret_arn`). These are references, not secret values.
- App servers read them through their IAM role. There are no static AWS keys,
  and no SSH port is open; server access is through Session Manager.

## Website

`frontend/` holds the portal front end: plain HTML, CSS and JavaScript with no
build step. It has six sections (dashboard, enrollment, documents, lab access,
support, courses).

- Terraform uploads `frontend/` to the S3 bucket under `site/`.
- Each server copies it into Apache's web root at boot and writes a
  `server.json` with its own instance ID and AZ, which the sidebar displays.
- Changing any file in `frontend/` and running `terraform apply` rolls the servers
  so they pick up the new version.

When the API answers, the site saves through it ("server" mode). When it does
not, for example when `index.html` is opened from disk, the site falls back to
the browser's `localStorage` ("demo" mode) and says so in a banner.

## Backend API

`backend/` is a small Node.js program (no framework) that listens on port 3000.
The load balancer sends every request whose path starts with `/api/` to it and
everything else to Apache.

| Request | What it does |
|---|---|
| `GET /api/health` | Liveness check used by the load balancer |
| `GET /api/health/ready` | Also checks the database connection |
| `GET /api/bootstrap` | Fixed lists (courses, labs, ...) plus the visitor's data |
| `POST /api/documents?typeId=` | Upload a file (body) to S3 and record it |
| `GET /api/documents/:id/file` | Download a stored file |
| `DELETE /api/documents/:id` | Remove a document |
| `POST /api/lab-requests` | Request lab access |
| `POST /api/lab-requests/:id/cancel` | Cancel a lab request |
| `POST /api/tickets` | Open a support request |
| `POST /api/tickets/:id/withdraw` | Withdraw a support request |
| `PUT` / `DELETE /api/courses/:id` | Add or remove a course from the plan |
| `DELETE /api/data` | Remove everything the visitor stored |

How it is deployed and secured:

- Terraform uploads `backend/` to S3; each server copies it at boot and runs
  `backend/deploy/install.sh`, which installs Node.js, the dependencies and a
  systemd service running as an unprivileged user.
- Database settings come from SSM Parameter Store and the password from
  Secrets Manager at run time. The connection to RDS uses TLS.
- Uploads go to the private S3 bucket under `uploads/`. Type, size and the
  file's leading bytes are checked.
- All SQL is parameterized and every input is validated on the server.

Known limits: there is no login. The browser generates a random visitor id and
sends it in the `X-Visitor-Id` header; data is separated per id. Anyone who
obtained an id could read that visitor's data, so this is not yet suitable for
real student records. There is no rate limiting and no `package-lock.json`.
