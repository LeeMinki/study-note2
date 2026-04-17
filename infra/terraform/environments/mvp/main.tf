data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  selected_availability_zone = coalesce(var.availability_zone, data.aws_availability_zones.available.names[0])
  name_prefix                = "study-note-${var.environment_name}"
  bootstrap_script           = file("${path.root}/../../scripts/ec2-bootstrap.sh")
}

module "network" {
  source = "../../modules/network"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  public_subnet_cidr = var.public_subnet_cidr
  availability_zone  = local.selected_availability_zone
}

module "identity" {
  source = "../../modules/identity"

  name_prefix       = local.name_prefix
  github_owner      = var.github_owner
  github_repository = var.github_repository
  github_branch     = var.github_branch
}

module "compute" {
  source = "../../modules/compute"

  name_prefix           = local.name_prefix
  ami_id                = var.ami_id
  instance_type         = var.instance_type
  key_name              = var.key_name
  public_subnet_id      = module.network.public_subnet_id
  vpc_id                = module.network.vpc_id
  ssh_ingress_cidr      = var.ssh_ingress_cidr
  instance_profile_name = module.identity.instance_profile_name
  bootstrap_script      = local.bootstrap_script
  associate_public_ip   = true
  root_volume_size_gib  = 30
  root_volume_type      = "gp3"
}

module "dns" {
  source = "../../modules/dns"
  count  = var.domain_name != "" ? 1 : 0

  domain_name   = var.domain_name
  ec2_public_ip = module.compute.public_ip
  name_prefix   = local.name_prefix
}
