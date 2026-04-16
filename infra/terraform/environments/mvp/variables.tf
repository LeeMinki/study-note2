variable "aws_region" {
  description = "Single AWS region for the MVP deployment."
  type        = string
  default     = "ap-northeast-2"
}

variable "environment_name" {
  description = "MVP environment label."
  type        = string
  default     = "mvp"
}

variable "vpc_cidr" {
  description = "CIDR block for the MVP VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the single public subnet."
  type        = string
  default     = "10.42.1.0/24"
}

variable "availability_zone" {
  description = "Availability zone for the single subnet. Leave null to use the first available zone."
  type        = string
  default     = null
}

variable "instance_type" {
  description = "Low-cost EC2 instance type for the k3s single-node MVP."
  type        = string
  default     = "t3.small"
}

variable "ami_id" {
  description = "Linux AMI ID for the EC2 instance. Ubuntu 22.04 LTS is recommended."
  type        = string
}

variable "key_name" {
  description = "Optional EC2 key pair name for emergency SSH access."
  type        = string
  default     = null
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to reach SSH. Use the narrowest possible operator IP range."
  type        = string
}

variable "github_owner" {
  description = "GitHub repository owner used for OIDC trust."
  type        = string
  default     = "LeeMinki"
}

variable "github_repository" {
  description = "GitHub repository name used for OIDC trust."
  type        = string
  default     = "study-note2"
}

variable "github_branch" {
  description = "GitHub branch allowed to assume the deployment role."
  type        = string
  default     = "main"
}
