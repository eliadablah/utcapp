locals {
  # Every file in the website folder, e.g. "index.html", "js/app.js"
  site_files = fileset(var.frontend_dir, "**")

  # Every file in the backend folder, e.g. "package.json", "src/server.js"
  backend_files = fileset(var.backend_dir, "**")

  # One fingerprint for the website plus the backend. It changes when any file
  # changes, which changes the boot script, which makes the servers get replaced.
  site_version = sha1(join("", concat(
    [for f in sort(local.site_files) : filemd5("${var.frontend_dir}/${f}")],
    [for f in sort(local.backend_files) : filemd5("${var.backend_dir}/${f}")],
  )))
}

# Finds the newest Amazon Linux 2023 image, so we never hardcode an image ID
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
