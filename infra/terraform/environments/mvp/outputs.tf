output "public_endpoint" {
  description = "Public IP endpoint for the MVP EC2 instance."
  value       = module.compute.public_ip
}

output "instance_id" {
  description = "EC2 instance ID for the MVP runtime."
  value       = module.compute.instance_id
}

output "vpc_id" {
  description = "VPC ID for the MVP environment."
  value       = module.network.vpc_id
}

output "public_subnet_id" {
  description = "Public subnet ID for the MVP environment."
  value       = module.network.public_subnet_id
}

output "deployment_role_arn" {
  description = "GitHub Actions OIDC role ARN for deployment workflow."
  value       = module.identity.deployment_role_arn
}
