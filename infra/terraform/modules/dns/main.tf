resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name        = "${var.name_prefix}-zone"
    Environment = var.name_prefix
  }
}

# 루트 도메인 → EC2 공인 IP
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = var.dns_ttl
  records = [var.ec2_public_ip]
}

# www → 루트 도메인 CNAME
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "CNAME"
  ttl     = var.dns_ttl
  records = [var.domain_name]
}
