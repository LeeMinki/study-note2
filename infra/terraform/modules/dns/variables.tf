variable "domain_name" {
  description = "루트 도메인명 (예: study-note.example.com). www는 자동으로 루트로 리디렉션."
  type        = string
}

variable "ec2_public_ip" {
  description = "EC2 인스턴스의 공인 IP 주소. compute 모듈의 public_ip 출력값을 전달."
  type        = string
}

variable "name_prefix" {
  description = "태그 및 리소스명 접두어."
  type        = string
}

variable "dns_ttl" {
  description = "DNS 레코드 TTL(초). 초기 설정 시 낮게 유지해 IP 변경 대응 속도를 높인다."
  type        = number
  default     = 300
}
