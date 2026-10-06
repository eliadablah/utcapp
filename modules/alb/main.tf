# ------------------------------------------------------------------------------
# Application Load Balancer & target group (ING-001)
# ------------------------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.environment}-utc-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  tags = {
    Name        = "${var.environment}-utc-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "app" {
  name     = "utc-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = var.health_check_path
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "utc-target-group"
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# Listeners
# No domain: port 80 sends visitors to the servers.
# With a domain: port 80 bounces visitors to 443, and 443 sends them to the servers.
# ------------------------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = local.enable_https ? "redirect" : "forward"
    target_group_arn = local.enable_https ? null : aws_lb_target_group.app.arn

    dynamic "redirect" {
      for_each = local.enable_https ? [1] : []

      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = local.enable_https ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ------------------------------------------------------------------------------
# API routing: anything under /api/ goes to the backend program on port 3000,
# everything else keeps going to the website on port 80
# ------------------------------------------------------------------------------
resource "aws_lb_target_group" "api" {
  name     = "utc-api-target-group"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "utc-api-target-group"
    Environment = var.environment
  }
}

resource "aws_lb_listener_rule" "api" {
  # Attach to whichever listener actually serves visitors
  listener_arn = local.enable_https ? aws_lb_listener.https[0].arn : aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ------------------------------------------------------------------------------
# ACM certificate & Route 53 (only when a domain is set)
# ------------------------------------------------------------------------------
resource "aws_acm_certificate" "main" {
  count             = local.enable_https ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Name        = "${var.environment}-utc-cert"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# AWS asks us to prove we own the domain by adding a special DNS record
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in flatten(aws_acm_certificate.main[*].domain_validation_options) : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  zone_id         = data.aws_route53_zone.main[0].zone_id
  name            = each.value.name
  type            = each.value.type
  ttl             = 60
  records         = [each.value.record]
}

# Waits here until AWS has checked the record and issued the certificate
resource "aws_acm_certificate_validation" "main" {
  count                   = local.enable_https ? 1 : 0
  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Points the domain name at the load balancer
resource "aws_route53_record" "app" {
  count   = local.enable_https ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
