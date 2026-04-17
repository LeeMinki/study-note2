# Implementation Plan: 도메인 기반 접속 및 HTTPS 적용

**Branch**: `011-domain-https` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-domain-https/spec.md`

## Summary

Route 53 DNS + cert-manager(Let's Encrypt HTTP-01) + k3s Traefik TLS ingress 조합으로 도메인 기반 HTTPS를 구현한다. 기존 EC2/k3s/Argo CD 구조를 유지하며, Terraform에 DNS 모듈을 추가하고 Kubernetes 매니페스트에 TLS와 리디렉션 설정을 반영한다. 인증서는 자동 갱신되며 월 추가 비용은 Route 53 Hosted Zone $0.50 수준이다.

## Technical Context

**Infrastructure**: Terraform HCL, AWS ap-northeast-2, Route 53, 기존 단일 EC2
**Kubernetes**: k3s (단일 노드), Traefik v2 ingress (기존), cert-manager (신규, 사용자 승인 필요)
**Certificate**: Let's Encrypt (무료), ACME HTTP-01 challenge
**DNS**: Route 53 Hosted Zone ($0.50/month) + A record + www CNAME
**Storage**: 인증서는 Kubernetes Secret으로 저장 (cert-manager 관리)
**Target Platform**: AWS ap-northeast-2, WSL Ubuntu 검증
**Performance Goals**: HTTP→HTTPS 리디렉션 1초 이내 (SC-003)
**Constraints**: 인증서 무료, DNS 월 $1 이하, 로드밸런서/CDN/유료 인증서 불가, 기존 k8s 구조 유지
**Scale/Scope**: 단일 루트 도메인, 루트+www 커버, 단일 EC2 환경

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- `/frontend`와 `/backend` 소스 경계 무변경. 이 기능은 인프라(DNS, 인증서, ingress) 레이어만 변경한다.
- 백엔드 API 엔드포인트 무변경. `{ success, data, error }` JSON 응답 계약 유지.
- 저장소 소유권 유지. 백엔드 JSON 파일 스토리지 무변경.
- 식별자 명명 규칙 유지. Kubernetes 리소스 이름은 영문 kebab-case.
- **신규 의존성**: cert-manager (Kubernetes 인증서 관리 오퍼레이터) — **사용자 승인 필요**. 대안(Traefik 내장 ACME)은 Phase 0에서 비교 검토.
- UX 영향 없음. 브라우저 잠금 아이콘만 추가됨.
- 변경은 DNS 모듈, ingress 패치, cert-manager 설치, 운영 문서로 분리해 검토 가능하게 구성.

**Post-Design Re-check**:
- Pass. 변경 파일은 `infra/terraform/modules/dns/`, `infra/kubernetes/cert-manager/`, `infra/kubernetes/study-note/`, `infra/docs/` 범위에 국한.
- Pass. frontend/backend 소스 경계 미침범.
- Pass. API 계약 미변경.
- Pass. cert-manager 승인 절차 포함.

## Project Structure

### Documentation (this feature)

```text
specs/011-domain-https/
├── plan.md              # 이 파일
├── research.md          # Phase 0 출력 — 도구 비교 결정
├── data-model.md        # Phase 1 출력 — DNS 레코드/인증서 데이터 구조
├── quickstart.md        # Phase 1 출력 — 도메인 연결 → HTTPS 검증 절차
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
infra/
├── terraform/
│   ├── modules/
│   │   └── dns/              # 신규: Route 53 Hosted Zone + 레코드
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   └── environments/mvp/
│       ├── main.tf           # 수정: dns 모듈 추가
│       └── variables.tf      # 수정: domain_name 변수 추가
├── kubernetes/
│   ├── cert-manager/         # 신규: cert-manager 설치 + ClusterIssuer
│   │   ├── kustomization.yaml
│   │   └── cluster-issuer.yaml
│   └── study-note/
│       ├── base/
│       │   ├── ingress.yaml           # 수정: TLS 섹션 + cert-manager 어노테이션 추가
│       │   └── ingress-www.yaml       # 신규: www → root 리디렉션 ingress
│       └── overlays/mvp/
│           ├── kustomization.yaml     # 수정: ingress 패치 참조 추가
│           └── patches/
│               └── ingress-tls.yaml   # 신규: 도메인명 패치 (도메인은 overlay에서 주입)
└── docs/
    └── operations.md         # 수정: DNS 설정, 인증서 갱신, 장애 우회 절차 추가
```

## Phase 0 Research Output

Research 결정은 [research.md](research.md)에 기록한다. 핵심 결정:

### DNS 공급자 선택: Route 53

| 항목 | Route 53 | 외부 DNS 공급자 유지 |
|------|----------|-------------------|
| AWS 통합 | 완전 통합 | 별도 계정 관리 |
| Terraform 지원 | 공식 provider | 공급자별 다름 |
| 비용 | $0.50/zone/month | 공급자별 다름 |
| HTTP-01 호환 | 가능 | 가능 |
| **선택** | ✅ 기본 방향 | 대안 |

기존 도메인 등록 기관이 AWS가 아닌 경우: 도메인은 기존 등록 기관에 유지하고, NS 레코드만 Route 53으로 위임하면 된다.

### 인증서 도구 선택: cert-manager

| 항목 | cert-manager | Traefik 내장 ACME |
|------|--------------|-----------------|
| 인증서 저장 | Kubernetes Secret | 파일(/acme.json) 또는 Secret |
| k8s 통합 | 표준 (Certificate CRD) | HelmChartConfig 필요 |
| 자동 갱신 | ✅ 내장 | ✅ 내장 |
| 추가 구성 요소 | cert-manager 오퍼레이터 | 없음 (기존 Traefik) |
| 운영 가시성 | kubectl로 Certificate 상태 확인 | Traefik 로그 확인 |
| **선택** | ✅ 권장 | 대안 (승인 불가 시) |

**cert-manager 설치는 사용자 승인 필요.** 승인 전까지 Phase 3를 진행하지 않는다.

### ACME 챌린지 방식: HTTP-01

| 항목 | HTTP-01 | DNS-01 (Route 53) |
|------|---------|-----------------|
| 포트 80 필요 | ✅ 필요 (EC2 보안그룹 80 허용 확인) | 불필요 |
| IAM 추가 권한 | 불필요 | Route 53 수정 권한 필요 |
| www SAN 지원 | 개별 챌린지 필요 | 와일드카드 가능 |
| 복잡도 | 낮음 | 높음 |
| **선택** | ✅ 기본 방향 | 포트 80 불가 시 대안 |

## Phase 1 Design Output

### DNS 연결 방식

```
사용자 브라우저
    │
    ▼
Route 53 Hosted Zone (domain.com)
    │
    ├── A 레코드: domain.com → EC2 공인 IP
    └── CNAME:   www.domain.com → domain.com
    │
    ▼
EC2 (공인 IP: 3.38.149.233 또는 갱신된 IP)
    │
    ▼
k3s Traefik ingress (port 80/443)
    │
    ├── HTTP :80  → redirect to HTTPS (Traefik HelmChartConfig)
    ├── HTTPS :443 domain.com   → Study Note 앱 (frontend/backend)
    └── HTTPS :443 www.domain.com → redirect to domain.com
```

### DNS 레코드 구조

| 레코드 타입 | 이름 | 값 | TTL |
|------------|------|-----|-----|
| A | `domain.com` | EC2 공인 IP | 300 |
| CNAME | `www.domain.com` | `domain.com` | 300 |

TTL 300초(5분) — 초기 설정 시 낮게 유지해 IP 변경 대응 속도를 높인다. 안정화 후 3600으로 상향 가능.

### 인증서 발급/갱신 전략

```
cert-manager ClusterIssuer (Let's Encrypt Production)
    │
    ▼
Certificate 리소스 생성 (domain.com + www.domain.com SAN)
    │
    ▼
ACME HTTP-01 챌린지
    ├── cert-manager가 임시 Ingress + Service 생성
    ├── Let's Encrypt가 http://domain.com/.well-known/acme-challenge/... 검증
    └── 챌린지 성공 → 인증서 발급
    │
    ▼
Kubernetes Secret (study-note-tls) 에 인증서 저장
    │
    ▼
Traefik이 Secret에서 인증서 로드 → HTTPS 서비스
    │
    ▼
자동 갱신: cert-manager가 만료 30일 전부터 갱신 시도
```

**Staging 먼저 적용**: Let's Encrypt production 전에 staging 클러스터로 발급 테스트 → 인증서 오류 없음 확인 → production 전환.

### ingress/reverse proxy 변경 계획

**1. Traefik HTTP→HTTPS 전역 리디렉션 (HelmChartConfig)**

기존 k3s Traefik을 HelmChartConfig로 재설정하여 port 80 접속 전체를 HTTPS로 리디렉션한다. 별도 Middleware 없이 전역 적용:

```yaml
# infra/kubernetes/kube-system/traefik-config.yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    ports:
      web:
        redirectTo:
          port: websecure
          permanent: true
```

**2. 기존 ingress.yaml 수정 — TLS 추가**

```yaml
# 기존 host 없는 ingress → domain.com host + TLS 추가
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - domain.com
        - www.domain.com
      secretName: study-note-tls
  rules:
    - host: domain.com
      http:
        paths: [기존 경로 그대로]
```

**3. www → root 리디렉션 ingress (신규)**

```yaml
# infra/kubernetes/study-note/base/ingress-www.yaml
# www.domain.com → domain.com redirect (Traefik Middleware)
```

**4. ClusterIssuer + Certificate 리소스 (cert-manager)**

```yaml
# staging 테스트용 ClusterIssuer
# production ClusterIssuer
# Certificate: domain.com + www.domain.com SAN
```

**도메인명 주입 방식**: 실제 도메인명은 `infra/kubernetes/study-note/overlays/mvp/patches/ingress-tls.yaml`에서 kustomize 패치로 주입한다. `base/ingress.yaml`에 도메인 직접 하드코딩하지 않는다.

### 배포 후 검증 절차

```bash
# 1. DNS 전파 확인 (전파 완료까지 수 분~수십 분 소요)
dig domain.com A
dig www.domain.com CNAME

# 2. HTTP→HTTPS 리디렉션 확인
curl -I http://domain.com
# 예상: HTTP/1.1 301 Moved Permanently + Location: https://domain.com/

# 3. HTTPS 접속 확인
curl -I https://domain.com
# 예상: HTTP/1.1 200 OK

# 4. 인증서 정보 확인
openssl s_client -connect domain.com:443 -servername domain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates -issuer

# 5. www 리디렉션 확인
curl -I https://www.domain.com
# 예상: 301 → https://domain.com

# 6. cert-manager Certificate 상태 확인
kubectl get certificate -n study-note
kubectl describe certificate study-note-tls -n study-note
```

### 장애 시 임시 우회 방법

| 장애 유형 | 임시 우회 | 영구 복구 |
|----------|---------|---------|
| DNS 전파 미완료 | IP(`3.38.149.233`)로 직접 HTTP 접속 | DNS TTL 대기 후 재확인 |
| 인증서 발급 실패 | IP로 HTTP 접속 유지 (Traefik 리디렉션 일시 해제) | cert-manager 로그 확인 → 챌린지 재실행 |
| Traefik TLS 오류 | HelmChartConfig에서 redirect 비활성화 | 인증서 Secret 상태 확인 |
| cert-manager 오동작 | 수동 인증서 발급(certbot) → Secret 직접 등록 | cert-manager 재설치 |
| Route 53 설정 오류 | IP 직접 접속 유지 | Route 53 콘솔에서 레코드 수정 |

**핵심**: IP 직접 HTTP 접속은 항상 작동하는 우회 경로다. 기존 EC2 보안그룹 80 포트 허용 상태를 유지한다.

## Complexity Tracking

신규 도입 의존성:
- **cert-manager**: Kubernetes CRD + 오퍼레이터. 설치 전 사용자 승인 필요. 대안(Traefik 내장 ACME)이 있어 블로킹 리스크 낮음.
- **HelmChartConfig (kube-system)**: k3s 기본 지원. 새 패키지 아님.
- **Route 53 Hosted Zone**: AWS 관리형 서비스. $0.50/month 추가 비용.

구성 요소 추가 없이 해결 불가한 요구사항: 인증서 자동 갱신(FR-005)은 cert-manager 또는 Traefik ACME 중 하나가 반드시 필요하다.
