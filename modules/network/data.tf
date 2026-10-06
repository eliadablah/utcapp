data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Select only the specified number of AZs requested
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}