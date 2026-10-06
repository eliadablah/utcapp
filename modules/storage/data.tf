# Looks up the AWS account number, used to make the bucket name unique worldwide
data "aws_caller_identity" "current" {}
