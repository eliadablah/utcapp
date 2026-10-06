# ------------------------------------------------------------------------------
# SNS notifications (OBS-001)
# ------------------------------------------------------------------------------
resource "aws_sns_topic" "main" {
  name = "utc-auto-scaling"

  tags = {
    Name        = "utc-auto-scaling"
    Environment = var.environment
  }
}

# AWS emails a confirmation link; nothing is delivered until it is clicked
resource "aws_sns_topic_subscription" "email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.main.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# ------------------------------------------------------------------------------
# Log group for the web server logs
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "httpd" {
  name              = "/utc-app/${var.environment}/httpd"
  retention_in_days = 14

  tags = {
    Environment = var.environment
  }
}

# ------------------------------------------------------------------------------
# Alarms
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  alarm_name          = "${var.environment}-utc-unhealthy-hosts"
  alarm_description   = "At least one app server is failing the load balancer health check"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "UnHealthyHostCount"
  statistic           = "Maximum"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  period              = 60
  evaluation_periods  = 3
  alarm_actions       = [aws_sns_topic.main.arn]
  ok_actions          = [aws_sns_topic.main.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "db_cpu_high" {
  alarm_name          = "${var.environment}-utc-db-cpu-high"
  alarm_description   = "Database CPU has been above 80% for 10 minutes"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  comparison_operator = "GreaterThanThreshold"
  threshold           = 80
  period              = 300
  evaluation_periods  = 2
  alarm_actions       = [aws_sns_topic.main.arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "db_storage_low" {
  alarm_name          = "${var.environment}-utc-db-storage-low"
  alarm_description   = "Database has less than 2 GB of free disk space"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  statistic           = "Average"
  comparison_operator = "LessThanThreshold"
  threshold           = 2147483648 # 2 GB, in bytes
  period              = 300
  evaluation_periods  = 1
  alarm_actions       = [aws_sns_topic.main.arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_identifier
  }

  tags = {
    Environment = var.environment
  }
}
