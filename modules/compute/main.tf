# ------------------------------------------------------------------------------
# Website files: uploaded to S3, then copied onto each server at boot
# ------------------------------------------------------------------------------
resource "aws_s3_object" "site" {
  for_each = local.site_files

  bucket = var.s3_bucket_name
  key    = "site/${each.value}"
  source = "${var.frontend_dir}/${each.value}"
  # Re-upload a file whenever its contents change
  etag = filemd5("${var.frontend_dir}/${each.value}")
}

# Backend files: same idea, kept under their own folder in the bucket
resource "aws_s3_object" "backend" {
  for_each = local.backend_files

  bucket = var.s3_bucket_name
  key    = "backend/${each.value}"
  source = "${var.backend_dir}/${each.value}"
  etag   = filemd5("${var.backend_dir}/${each.value}")
}

# ------------------------------------------------------------------------------
# Launch template (CMP-001): the recipe for one app server
# ------------------------------------------------------------------------------
resource "aws_launch_template" "app" {
  name_prefix   = "${var.environment}-utc-app-"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  # Only allow the safer version 2 of the instance metadata service
  metadata_options {
    http_tokens = "required"
  }

  # The boot script, with the blanks filled in
  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh.tftpl", {
    efs_id         = var.efs_id
    log_group_name = var.log_group_name
    s3_bucket_name = var.s3_bucket_name
    site_version   = local.site_version
    ssm_prefix     = var.ssm_prefix
  }))

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name        = "${var.environment}-utc-app"
      Environment = var.environment
    }
  }
}

# ------------------------------------------------------------------------------
# Auto Scaling Group: keeps the right number of servers running
# ------------------------------------------------------------------------------
resource "aws_autoscaling_group" "app" {
  name                = "${var.environment}-utc-app-asg"
  vpc_zone_identifier = var.private_subnet_ids
  # compact() drops the API target group when it is left empty
  target_group_arns = compact([var.target_group_arn, var.api_target_group_arn])

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  # Replace a server when the load balancer says it is unhealthy
  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = aws_launch_template.app.latest_version
  }

  # When the recipe changes (for example a new website version), swap the
  # servers for fresh ones a few at a time so the site stays up
  instance_refresh {
    strategy = "Rolling"

    preferences {
      min_healthy_percentage = 50
    }
  }

  # The scaling policies change this number, so Terraform must not reset it
  lifecycle {
    ignore_changes = [desired_capacity]
  }

  # Servers copy the website from S3 at boot, so the files must be there first
  depends_on = [aws_s3_object.site, aws_s3_object.backend]
}

# ------------------------------------------------------------------------------
# CPU based scaling
# ------------------------------------------------------------------------------
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "${var.environment}-utc-scale-out"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown               = 300
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "${var.environment}-utc-scale-in"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 300
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-utc-app-cpu-high"
  alarm_description   = "Average app server CPU is high: add one server"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  comparison_operator = "GreaterThanThreshold"
  threshold           = var.scale_out_cpu
  period              = 120
  evaluation_periods  = 2
  alarm_actions       = [aws_autoscaling_policy.scale_out.arn, var.sns_topic_arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.environment}-utc-app-cpu-low"
  alarm_description   = "Average app server CPU is low: remove one server"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  comparison_operator = "LessThanThreshold"
  threshold           = var.scale_in_cpu
  period              = 120
  evaluation_periods  = 5
  alarm_actions       = [aws_autoscaling_policy.scale_in.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = {
    Environment = var.environment
  }
}

# Email the team whenever a server is added or removed
resource "aws_autoscaling_notification" "app" {
  group_names = [aws_autoscaling_group.app.name]
  topic_arn   = var.sns_topic_arn

  notifications = [
    "autoscaling:EC2_INSTANCE_LAUNCH",
    "autoscaling:EC2_INSTANCE_TERMINATE",
    "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
    "autoscaling:EC2_INSTANCE_TERMINATE_ERROR",
  ]
}
