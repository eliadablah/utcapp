# ------------------------------------------------------------------------------
# EC2 instance role (IAM-001)
# A badge the servers wear instead of carrying AWS keys.
# ------------------------------------------------------------------------------
resource "aws_iam_role" "app" {
  name               = "${var.environment}-utc-app-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json

  tags = {
    Name        = "${var.environment}-utc-app-role"
    Environment = var.environment
  }
}

# Session Manager: log in to servers without SSH keys or an open port 22
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent: send logs and metrics
resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_role_policy" "app" {
  name   = "${var.environment}-utc-app-policy"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app.json
}

# The instance profile is the clip that attaches the role to an EC2 server
resource "aws_iam_instance_profile" "app" {
  name = "${var.environment}-utc-app-profile"
  role = aws_iam_role.app.name
}
