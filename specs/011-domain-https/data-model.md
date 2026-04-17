# Data Model: 도메인 기반 접속 및 HTTPS 적용

## DNS 레코드 구조

### Route 53 Hosted Zone

| 필드 | 값 |
|------|-----|
| Zone Name | `<DOMAIN>` (예: `study-note.example.com`) |
| Zone Type | Public |
| Terraform 리소스 | `aws_route53_zone.main` |

### DNS 레코드

| 레코드 타입 | 이름 | 값 | TTL | Terraform 리소스 |
|------------|------|-----|-----|-----------------|
| A | `<DOMAIN>` | EC2 공인 IP | 300 | `aws_route53_record.root` |
| CNAME | `www.<DOMAIN>` | `<DOMAIN>` | 300 | `aws_route53_record.www` |

> TTL은 초기 설정 시 300초(5분)로 짧게 유지한다. EC2 IP가 안정화된 이후 3600으로 상향 가능.

## Kubernetes 리소스 구조

### cert-manager 리소스

**ClusterIssuer (Let's Encrypt Staging — 테스트용)**

```
ClusterIssuer: letsencrypt-staging
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: <운영자 이메일>
    privateKeySecretRef: letsencrypt-staging-key
    solvers:
      - http01:
          ingress:
            ingressClassName: traefik
```

**ClusterIssuer (Let's Encrypt Production — 운영용)**

```
ClusterIssuer: letsencrypt-prod
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: <운영자 이메일>
    privateKeySecretRef: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            ingressClassName: traefik
```

**Certificate**

```
Certificate: study-note-tls
  namespace: study-note
  spec:
    secretName: study-note-tls-secret
    issuerRef:
      name: letsencrypt-prod
      kind: ClusterIssuer
    dnsNames:
      - <DOMAIN>
      - www.<DOMAIN>
```

**인증서 Secret (cert-manager 자동 생성)**

```
Secret: study-note-tls-secret
  namespace: study-note
  type: kubernetes.io/tls
  data:
    tls.crt: <cert PEM base64>
    tls.key: <private key PEM base64>
```

### Ingress 리소스

**기존 ingress.yaml 변경 (base)**

```
Ingress: study-note
  namespace: study-note
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  spec:
    ingressClassName: traefik
    tls:
      - hosts:
          - <DOMAIN>
          - www.<DOMAIN>
        secretName: study-note-tls-secret
    rules:
      - host: <DOMAIN>
        http:
          paths:
            - /api → study-note-backend:3001
            - /uploads → study-note-backend:3001
            - / → study-note-frontend:80
      - host: www.<DOMAIN>
        http:
          paths:
            - / → [www redirect middleware]
```

**Traefik HelmChartConfig (kube-system)**

```
HelmChartConfig: traefik
  namespace: kube-system
  ports:
    web:
      redirectTo:
        port: websecure
        permanent: true
```

## Terraform 출력값 (outputs)

| 출력 이름 | 설명 |
|----------|------|
| `route53_zone_id` | Route 53 Hosted Zone ID |
| `route53_nameservers` | 도메인 등록 기관에 설정할 NS 레코드 4개 |
| `domain_name` | 설정된 도메인 이름 |

## 파라미터 주입 구조

도메인명(`<DOMAIN>`)은 환경별로 다를 수 있으므로 kustomize overlay에서 패치로 주입한다:

```
base/ingress.yaml        → host: DOMAIN_PLACEHOLDER (패치 대상)
overlays/mvp/patches/
  ingress-tls.yaml       → 실제 도메인명으로 패치
```

이 구조는 base 매니페스트에 도메인을 직접 하드코딩하지 않아 다른 환경에서 재사용 가능하게 한다.
