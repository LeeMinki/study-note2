# Tasks: 도메인 기반 접속 및 HTTPS 적용

**Input**: Design documents from `/specs/011-domain-https/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Organization**: DNS 인프라 → 인증서 설정 → ingress TLS → 리디렉션 → 운영 문서 순으로 진행하며, 각 단계는 독립적으로 검토 가능하게 구성한다. cert-manager 설치는 사용자 승인 후에만 진행한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 서로 다른 파일을 다루며 선행 작업에 직접 의존하지 않아 병렬 처리 가능
- **[Story]**: 사용자 스토리 단계에만 사용
- 모든 작업 설명은 실제 수정 또는 생성 대상 파일 경로를 포함한다

---

## Phase 1: Setup (기존 구조 확인)

**Purpose**: 011 구현 전에 현재 인프라 상태와 제약 조건을 확인한다.

- [x] T001 EC2 보안그룹에서 포트 80 인바운드 허용 여부 확인 (`infra/terraform/modules/compute/main.tf` 또는 AWS 콘솔) — 미허용 시 보안그룹 규칙 추가 태스크 선행 필요. 포트 80 차단 상태에서 HTTP-01 challenge가 실패하므로 Phase 3 진행 전 반드시 해소.
- [x] T002 [P] k3s Traefik 버전 확인 (`kubectl get deployment traefik -n kube-system -o yaml | grep image`)
- [x] T003 [P] 현재 `infra/kubernetes/study-note/base/ingress.yaml` 구조 검토 — host 미설정 상태 확인
- [x] T004 [P] `infra/terraform/environments/mvp/main.tf`에서 dns 모듈 미존재 확인 + `infra/terraform/modules/compute/outputs.tf`에서 EC2 공인 IP 출력 변수명 확인 (T006 `ec2_public_ip` 변수명과 일치 여부)
- [x] T005 [P] cert-manager 사용자 승인 확인 — ✅ 2026-04-17 승인 완료

---

## Phase 2: Foundational (Terraform DNS 모듈)

**Purpose**: Route 53 Hosted Zone과 DNS 레코드를 Terraform으로 관리하는 기반을 만든다. 이 단계가 완료되어야 실제 도메인 연결이 가능하다.

**⚠️ CRITICAL**: DNS 모듈 적용 전에는 도메인 접속이 불가능하다. 이 단계는 다른 모든 단계에 선행한다.

- [x] T006 `infra/terraform/modules/dns/variables.tf` 생성 — `domain_name`, `ec2_public_ip`, `environment_name` 입력 변수 정의
- [x] T007 `infra/terraform/modules/dns/main.tf` 생성 — `aws_route53_zone`, `aws_route53_record` A(루트), CNAME(www) 리소스 정의
- [x] T008 `infra/terraform/modules/dns/outputs.tf` 생성 — `zone_id`, `nameservers`, `domain_name` 출력 정의
- [x] T009 `infra/terraform/environments/mvp/main.tf` 수정 — dns 모듈 호출 추가, `domain_name` 변수 전달
- [x] T010 `infra/terraform/environments/mvp/variables.tf` 수정 — `domain_name` 변수 추가
- [x] T011 `terraform fmt -check -recursive infra/terraform` 실행하여 포맷 검증 — PR Checks `Terraform fmt and validate` 통과
- [x] T012 `terraform validate` 실행하여 문법 검증 (backend=false) — PR Checks `Terraform fmt and validate` 통과

**Checkpoint**: Terraform DNS 모듈이 plan/apply 가능한 상태여야 한다.

---

## Phase 3: User Story 1 — 도메인으로 HTTPS 접속 (Priority: P1)

**Goal**: 사용자가 도메인 주소로 Study Note에 접속하면 브라우저 경고 없이 HTTPS 연결이 수립된다.

**Independent Test**: `curl -I https://domain.com`이 200 OK를 반환하고, `openssl s_client`로 Let's Encrypt 발급 인증서가 확인되어야 한다.

### US1 — cert-manager 설치 (승인 후)

- [x] T013 [US1] `infra/kubernetes/cert-manager/` 디렉터리 생성
- [x] T014 [US1] `infra/kubernetes/cert-manager/kustomization.yaml` 생성 — cert-manager 공식 매니페스트 URL 참조
- [x] T015 [US1] `infra/kubernetes/cert-manager/cluster-issuer-staging.yaml` 생성 — Let's Encrypt staging ClusterIssuer, HTTP-01 챌린지, Traefik ingressClassName
- [x] T016 [US1] `infra/kubernetes/cert-manager/cluster-issuer-prod.yaml` 생성 — Let's Encrypt production ClusterIssuer, HTTP-01 챌린지, Traefik ingressClassName
### US1 — ingress TLS 설정

- [x] T017 [US1] `infra/kubernetes/study-note/base/middleware-www-redirect.yaml` 생성 — Traefik `Middleware` CRD (`redirectScheme: scheme: https, permanent: true` + `redirectRegex`로 www → root 처리). 네임스페이스: `study-note`
- [x] T018 [US1] `infra/kubernetes/study-note/base/ingress.yaml` 수정 — `cert-manager.io/cluster-issuer: letsencrypt-prod` 어노테이션 추가 (cert-manager가 이 어노테이션을 읽어 Certificate CRD + Secret을 자동 생성함), `tls` 섹션 추가 (hosts: domain.com + www, secretName: study-note-tls-secret), `host: domain.com` 규칙 추가. ※ Certificate CRD는 별도 생성하지 않음 — 어노테이션 방식으로 일원화
- [x] T019 [US1] `infra/kubernetes/study-note/base/ingress-www.yaml` 신규 생성 — `www.domain.com` host 규칙, T017에서 생성한 Middleware(`study-note-www-redirect@kubernetescrd`) 어노테이션으로 참조
- [x] T020 [P] [US1] `infra/kubernetes/study-note/overlays/mvp/patches/ingress-tls.yaml` 생성 — 실제 도메인명 패치 (base의 placeholder 대체)
- [x] T021 [US1] `infra/kubernetes/study-note/overlays/mvp/kustomization.yaml` 수정 — ingress-www.yaml 리소스 추가, ingress-tls.yaml 패치 참조 추가

**Checkpoint**: User Story 1은 cert-manager ClusterIssuer + Certificate + ingress TLS 설정 적용 후 `kubectl get certificate -n study-note`에서 READY=True가 확인되어야 한다.

---

## Phase 4: User Story 2 — HTTP 접속 시 HTTPS 자동 전환 (Priority: P2)

**Goal**: HTTP로 접속한 사용자가 자동으로 HTTPS로 리디렉션된다.

**Independent Test**: `curl -I http://domain.com`이 `301 Moved Permanently`와 `Location: https://domain.com/`을 반환해야 한다.

- [x] T022 [US2] `infra/kubernetes/study-note/base/middleware-https-redirect.yaml` 생성 — IP fallback을 보존하기 위해 전역 Traefik HelmChartConfig 대신 도메인 Ingress 전용 `redirectScheme` Middleware 적용
- [x] T023 [US2] `infra/kubernetes/study-note/base/ingress.yaml`, `infra/kubernetes/study-note/base/ingress-www.yaml`에 `study-note-https-redirect@kubernetescrd` Middleware 어노테이션 적용 — Argo CD sync 후 런타임 반영 확인
- [x] T024 [P] [US2] `curl -I http://study-note.yuna-pa.com` 실행하여 `308 Permanent Redirect` + `Location: https://study-note.yuna-pa.com/` 확인
- [x] T025 [P] [US2] `curl -I https://www.study-note.yuna-pa.com` 실행하여 `308` + `Location: https://study-note.yuna-pa.com/` 확인

**Checkpoint**: User Story 2는 HTTP→HTTPS 리디렉션이 1초 이내(SC-003)에 동작함을 curl로 확인 후 독립 검증 가능하다.

---

## Phase 5: User Story 3 — 인증서 자동 갱신 (Priority: P3)

**Goal**: 운영자 개입 없이 인증서가 만료 전에 자동으로 갱신된다. 갱신 실패 시 운영 문서로 복구할 수 있다.

**Independent Test**: `kubectl get certificate -n study-note`에서 READY=True, `kubectl describe certificate`에서 갱신 스케줄이 활성화됨을 확인한다.

- [x] T026 [US3] `kubectl describe certificate study-note-tls-secret -n study-note` 실행 — cert-manager Certificate `READY=True`, Let's Encrypt 인증서 발급 및 자동 갱신 대상 Secret 확인
- [x] T027 [P] [US3] `infra/docs/operations.md` 수정 — "011 DNS/HTTPS 운영" 섹션 추가:
  - DNS 전파 확인 절차 (`dig` 명령)
  - cert-manager Certificate 상태 확인 방법
  - 인증서 갱신 실패 원인별 확인 절차 (챌린지 실패, Rate limit, 네트워크 차단)
  - 인증서 수동 강제 갱신 절차 (`kubectl delete certificate` → 재발급)
  - 인증서 만료 임박 알림 확인 방법 (`kubectl get events -n cert-manager`)
- [x] T028 [P] [US3] EC2 IP 변경 시 DNS 갱신 절차 `infra/docs/operations.md`에 추가 — Terraform A 레코드 갱신 절차, TTL 대기 시간 안내
- [x] T029 [P] [US3] 도메인 등록 갱신 주의사항 `infra/docs/operations.md`에 추가 — 만료 시 서비스 전체 접속 불가 안내

**Checkpoint**: User Story 3은 문서 검토만으로 갱신 방식, 실패 확인 절차, 수동 복구 포인트를 빠짐없이 확인할 수 있어야 한다.

---

## Phase 6: 장애 대응 및 우회 문서화

**Purpose**: 배포 실패 또는 인증서/DNS 장애 발생 시 서비스를 유지하는 절차를 문서화한다.

- [x] T030 `infra/docs/operations.md` 수정 — "장애 시 임시 우회" 섹션 추가:
  - IP 직접 접속 경로 유지 확인 (`http://<EC2-IP>`)
  - Traefik 리디렉션 일시 해제 절차 (HelmChartConfig `redirectTo` 제거)
  - cert-manager 비활성화 없이 HTTP-only 운영하는 임시 방법
- [x] T031 [P] `infra/docs/operations.md` 수정 — "DNS 전파 지연 대응" 절차 추가:
  - `dig` + `nslookup` 전파 확인 명령
  - 전파 완료 전 IP 직접 접속 방법
  - 브라우저 DNS 캐시 초기화 방법
- [x] T032 [P] `infra/docs/secrets.md` 수정 — Route 53 관련 추가사항:
  - Hosted Zone ID 위치 안내
  - 도메인 등록 NS 레코드 위임 절차 (외부 등록 기관 사용 시)
  - 도메인 등록 만료 일정 관리 주의사항

---

## Final Phase: 검증 및 완료

**Purpose**: 전체 DNS/HTTPS 흐름이 정상 동작함을 검증하고 quickstart에 결과를 반영한다.

- [x] T033 Route 53 Domains에서 `yuna-pa.com` 등록 완료 및 hosted zone `Z06364843I0SKGHVHRUIH` 네임서버 반영 확인
- [x] T034 `dig A study-note.yuna-pa.com` — EC2 공인 IP `3.38.149.233` 반환 확인
- [x] T035 cert-manager 발급 경로 사전 검증 — `sslip.io` 임시 HTTPS 인증서 발급으로 HTTP-01/cert-manager 동작 확인
- [x] T035b production ClusterIssuer 전환 — Ingress 어노테이션 `cert-manager.io/cluster-issuer=letsencrypt-prod` 기준으로 Certificate 자동 생성 확인
- [x] T036 production ClusterIssuer 전환 후 Let's Encrypt 인증서 발급 확인 — `study-note-tls-secret` READY=True, issuer=Let's Encrypt R13
- [x] T037 `curl -I http://study-note.yuna-pa.com` — `308 Permanent Redirect` 확인
- [x] T038 `curl -I https://study-note.yuna-pa.com` — `200 OK` 확인
- [x] T039 `curl -I https://www.study-note.yuna-pa.com` — `308` → `https://study-note.yuna-pa.com/` 확인
- [x] T040 `openssl s_client -connect study-note.yuna-pa.com:443` — Let's Encrypt 발급 인증서, SAN `study-note.yuna-pa.com`, `www.study-note.yuna-pa.com`, 유효 기간 90일 확인
- [x] T041 브라우저 접속 기준 검증 — 공개 DNS + 신뢰 가능한 Let's Encrypt 인증서 + HTTPS 200 OK 확인으로 잠금 아이콘 표시 조건 충족
- [x] T042 `specs/011-domain-https/quickstart.md` 수정 — 실제 검증 결과, 도메인명 `study-note.yuna-pa.com`, 후속 작업 메모 반영

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 바로 시작 가능 — 확인 작업만 포함
- **Foundational (Phase 2)**: Setup 완료 후 진행 — DNS 모듈 없이는 도메인 연결 불가
- **US1 (Phase 3)**: Foundational 완료 + cert-manager 승인 후 시작
- **US2 (Phase 4)**: Foundational 완료 후 시작 가능 (cert-manager 불필요, Traefik만 변경)
- **US3 (Phase 5)**: US1 완료 후 진행 — 인증서가 존재해야 갱신 검증 가능
- **장애 대응 (Phase 6)**: US1, US2 구현 결과를 반영해야 문서가 정확함
- **Final (검증)**: 모든 Phase 완료 후 진행

### Critical Blocker

**cert-manager 사용자 승인**: ✅ 2026-04-17 승인 완료. T013~T019 진행 가능.

**Certificate 관리 방식**: 어노테이션 일원화 (A1 수정). cert-manager.io/cluster-issuer 어노테이션을 ingress에 추가하면 cert-manager가 자동으로 Certificate CRD + Secret을 생성/갱신. 별도 Certificate YAML 불필요.

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005 병렬 처리 가능
- Phase 3: T020은 T018, T019와 병렬 가능 (다른 파일)
- Phase 5: T027, T028, T029 병렬 처리 가능 (operations.md 섹션 분리)
- Phase 6: T030, T031, T032 병렬 처리 가능
