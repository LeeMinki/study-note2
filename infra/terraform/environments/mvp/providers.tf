provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "study-note"
      Environment = var.environment_name
      ManagedBy   = "terraform"
      Scope       = "low-cost-mvp"
    }
  }
}
