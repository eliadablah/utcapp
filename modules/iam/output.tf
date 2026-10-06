output "instance_profile_name" {
  description = "Name of the instance profile to attach to the app servers"
  value       = aws_iam_instance_profile.app.name

  # Hand the badge out only once every permission is attached, so a server
  # never boots before it is allowed to read S3
  depends_on = [
    aws_iam_role_policy.app,
    aws_iam_role_policy_attachment.ssm,
    aws_iam_role_policy_attachment.cloudwatch,
  ]
}

output "role_arn" {
  description = "ARN of the app server role"
  value       = aws_iam_role.app.arn
}
