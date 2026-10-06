locals {
  # HTTPS needs a real domain. With no domain set, the ALB serves plain HTTP only.
  enable_https = var.domain_name != ""
}

data "aws_route53_zone" "main" {
  count        = local.enable_https ? 1 : 0
  name         = var.hosted_zone_name
  private_zone = false
}
