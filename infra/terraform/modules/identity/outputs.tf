output "instance_profile_name" {
  description = "Instance profile name for the MVP EC2 instance."
  value       = aws_iam_instance_profile.instance.name
}

output "deployment_role_arn" {
  description = "GitHub Actions OIDC deployment role ARN."
  value       = aws_iam_role.github_deploy.arn
}
