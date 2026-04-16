variable "name_prefix" {
  description = "Name prefix for compute resources."
  type        = string
}

variable "ami_id" {
  description = "AMI ID for the EC2 instance."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
}

variable "key_name" {
  description = "Optional EC2 key pair name."
  type        = string
  default     = null
}

variable "public_subnet_id" {
  description = "Public subnet ID for the EC2 instance."
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for security group placement."
  type        = string
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to reach SSH."
  type        = string
}

variable "instance_profile_name" {
  description = "IAM instance profile name."
  type        = string
}

variable "bootstrap_script" {
  description = "User data script content."
  type        = string
}

variable "associate_public_ip" {
  description = "Whether to associate a public IP."
  type        = bool
  default     = true
}

variable "root_volume_size_gib" {
  description = "Root EBS volume size in GiB."
  type        = number
  default     = 30
}

variable "root_volume_type" {
  description = "Root EBS volume type."
  type        = string
  default     = "gp3"
}
