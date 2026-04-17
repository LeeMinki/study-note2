output "zone_id" {
  description = "Route 53 Hosted Zone ID."
  value       = aws_route53_zone.main.zone_id
}

output "nameservers" {
  description = "도메인 등록 기관에 입력할 NS 레코드 4개. 외부 등록 기관 사용 시 이 값을 복사해 입력한다."
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "설정된 루트 도메인명."
  value       = var.domain_name
}

output "www_fqdn" {
  description = "www 서브도메인 FQDN."
  value       = aws_route53_record.www.fqdn
}
