variable "name_prefix" {
  description = "Name prefix for IAM resources."
  type        = string
}

variable "github_owner" {
  description = "GitHub repository owner."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
}

variable "github_branch" {
  description = "Branch allowed to assume the GitHub deployment role."
  type        = string
}
