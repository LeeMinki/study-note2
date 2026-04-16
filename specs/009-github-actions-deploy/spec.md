# Feature Specification: GitHub Actions Automatic Deployment

**Feature Branch**: `009-github-actions-deploy`
**Created**: 2026-04-16
**Status**: Draft
**Input**: User description: "Study Note의 AWS 배포 환경이 준비된 이후, GitHub Actions 기반 자동배포 구조를 추가하고 싶다."

## Clarifications

### Session 2026-04-16

- Q: PR 단계와 main merge 후 단계의 책임은 어떻게 구분하는가? → A: PR 단계는 검증만 수행하고 production 배포를 하지 않으며, main merge 후에만 이미지 publish와 배포 반영을 수행한다.
- Q: GitHub Actions workflow 구성은 어떤 방향으로 제한하는가? → A: 비용과 단순성을 위해 최소 workflow 수를 우선하며, PR 검증 workflow와 main 배포 workflow의 두 흐름을 기본으로 한다.
- Q: AWS 인증과 이미지 저장소는 어떤 기준을 따르는가? → A: AWS 인증은 GitHub OIDC를 우선하고, ECR repository는 008에서 정의된 `study-note-backend`, `study-note-frontend` 구조를 따른다.
- Q: Argo CD 자동 배포 범위는 어디까지인가? → A: GitOps 동기화 구조는 유지하되, 고급 롤백 자동화, 대규모 관측성, 멀티 환경 운영 기능은 이번 범위에서 제외한다.
- Q: required status checks와 실패 대응은 어떻게 명확히 하는가? → A: branch protection에 연결 가능한 check 이름을 명확히 정하고, 실패 시 수동 복구 포인트와 재실행 기준을 운영 문서에 포함한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - PR 검증으로 배포 전 문제 발견 (Priority: P1)

개발자는 Study Note 코드를 수정한 뒤 PR을 열면, 운영 배포를 실행하지 않고도 변경사항이 기본적으로 빌드 가능하고 배포 명세가 깨지지 않았는지 자동 검증 결과를 확인할 수 있어야 한다.

**Why this priority**: PR 단계에서 기본 문제를 발견하지 못하면 main 병합 후 운영 배포 실패로 이어지므로, 자동배포보다 먼저 안전한 검증 흐름이 필요하다.

**Independent Test**: 변경사항이 포함된 PR을 열고, GitHub에서 검증 작업의 성공 또는 실패 상태가 표시되는지 확인한다. 이 테스트는 운영 환경에 새 버전을 배포하지 않아야 한다.

**Acceptance Scenarios**:

1. **Given** 개발자가 PR을 생성한 상태에서, **When** 자동 검증이 실행되면, **Then** PR 화면에서 필수 검증의 성공 또는 실패 상태를 확인할 수 있어야 한다.
2. **Given** 변경사항에 빌드 또는 배포 명세 오류가 있는 상태에서, **When** PR 검증이 실행되면, **Then** 검증은 실패하고 개발자가 실패 지점을 확인할 수 있어야 한다.
3. **Given** PR 검증이 실행되는 상태에서, **When** 검증이 완료되더라도, **Then** 운영 배포 환경에는 새 버전이 반영되지 않아야 한다.

---

### User Story 2 - main 병합 후 자동 배포 (Priority: P2)

운영자는 PR이 검토되고 main 브랜치에 병합되면, 별도의 수동 서버 작업 없이 최신 애플리케이션 버전이 준비된 AWS 배포 환경에 반영되는 흐름을 사용할 수 있어야 한다.

**Why this priority**: main 병합 후 수동 배포가 필요하면 릴리스 누락과 운영 실수가 발생하기 쉽다. MVP 환경에서도 반복 가능한 자동 릴리스 흐름이 필요하다.

**Independent Test**: main에 변경사항을 병합한 뒤 GitHub에서 배포 작업이 실행되고, 배포 환경의 공개 접속 경로에서 최신 버전이 확인되는지 검증한다.

**Acceptance Scenarios**:

1. **Given** PR이 main에 병합된 상태에서, **When** 자동 배포 흐름이 시작되면, **Then** 최신 애플리케이션 버전이 배포 대상에 반영되어야 한다.
2. **Given** 배포 작업이 완료된 상태에서, **When** 운영자가 GitHub 배포 기록을 확인하면, **Then** 성공 또는 실패 여부와 실패 단계가 확인 가능해야 한다.
3. **Given** 새 이미지 또는 배포 상태 반영이 실패한 상태에서, **When** 운영자가 실패 기록을 확인하면, **Then** 인증, 이미지 게시, 배포 동기화 중 어느 구간에서 실패했는지 구분할 수 있어야 한다.

---

### User Story 3 - 안전한 AWS 접근과 운영 문서화 (Priority: P3)

운영자는 장기 AWS access key를 GitHub secrets에 저장하지 않고도 자동 배포가 AWS 리소스에 접근하도록 구성하고, 실패 시 확인할 위치와 조치 순서를 문서로 따라갈 수 있어야 한다.

**Why this priority**: 배포 자동화가 동작하더라도 장기 키 저장이나 불명확한 운영 절차는 보안 위험과 복구 지연을 만든다.

**Independent Test**: GitHub 저장소 설정과 운영 문서를 검토해 장기 AWS access key 없이 배포 인증이 구성되었는지, 실패 시 확인 절차가 문서화되었는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 자동 배포 설정이 완료된 상태에서, **When** 운영자가 GitHub 저장소의 민감 정보 구성을 확인하면, **Then** 장기 AWS access key가 배포 인증 용도로 저장되어 있지 않아야 한다.
2. **Given** 배포가 실패한 상태에서, **When** 운영자가 운영 문서를 확인하면, **Then** 검증 실패, 인증 실패, 이미지 게시 실패, 배포 반영 실패를 구분해 확인할 수 있어야 한다.

### Edge Cases

- PR 검증은 성공했지만 main 병합 후 배포가 실패한 경우, 운영자는 검증 단계와 배포 단계의 차이를 확인할 수 있어야 한다.
- AWS 인증 신뢰 설정이 잘못된 경우, 배포 작업은 장기 키 대체를 요구하지 않고 실패 원인을 확인 가능하게 남겨야 한다.
- 이미지 저장소에 대상 저장소가 아직 없는 경우에도 첫 배포 흐름은 운영자가 조치할 수 있는 명확한 실패 또는 자동 준비 결과를 제공해야 한다.
- 배포 환경이 이미 준비되어 있지만 애플리케이션 배포 관리 대상이 등록되지 않은 경우, 자동 배포 흐름은 운영자가 누락 지점을 식별할 수 있어야 한다.
- 배포 명세가 잘못되어 운영 환경 반영이 불가능한 경우, PR 검증 단계에서 가능한 한 먼저 발견되어야 한다.
- GitHub에서 배포 변수나 권한이 누락된 경우, 배포 작업은 조용히 성공 처리되지 않고 실패 또는 명확한 스킵 사유를 남겨야 한다.
- 테스트 코드가 아직 없는 상태에서도 최소 검증은 빌드 가능성, 배포 명세 유효성, 이미지 생성 가능성을 확인해야 한다.
- 배포 실패 후 재실행이 필요한 경우, 운영자는 실패 구간별로 GitHub Actions 재실행, 배포 상태 재동기화, 인프라 설정 확인 중 어떤 수동 복구 포인트를 사용할지 문서에서 확인할 수 있어야 한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 PR 생성 또는 업데이트 시 운영 배포 없이 기본 검증을 자동 실행해야 한다.
- **FR-002**: PR 검증은 빌드 컴파일러 수준의 정적 점검(TypeScript 컴파일 등 빌드 오류 검출 포함), 애플리케이션 빌드 가능성, 컨테이너 이미지 생성 가능성, 배포 명세와 YAML 기본 유효성을 확인해야 한다. 별도 lint 도구는 010에서 결정한다.
- **FR-003**: PR 검증 결과는 GitHub PR 화면에서 성공, 실패, 진행 중 상태로 확인 가능해야 한다.
- **FR-004**: 시스템은 branch protection의 required status checks로 연결할 수 있도록 `PR Checks` 흐름과 `Terraform fmt and validate`, `App and image build`, `Kubernetes manifest sanity` check 이름을 명확히 제공해야 한다.
- **FR-005**: 시스템은 main 브랜치 병합 후에만 최신 애플리케이션 버전을 빌드하고 이미지 저장소에 게시해야 한다.
- **FR-006**: 시스템은 main 브랜치 병합 후에만 배포 환경이 최신 이미지 또는 릴리스 상태를 참조하도록 배포 상태를 갱신해야 한다.
- **FR-007**: 시스템은 008에서 준비된 AWS 단일 EC2, k3s, Argo CD 기반 배포 환경을 전제로 동작해야 한다.
- **FR-008**: 시스템은 AWS 접근 시 장기 access key 저장보다 GitHub OIDC 기반 단기 신뢰 인증을 우선해야 한다.
- **FR-009**: 시스템은 GitHub에 저장되는 배포 설정값과 민감 정보의 위치, 용도, 금지 항목을 문서화해야 하며, 장기 AWS access key를 배포 인증 기본 경로로 요구하지 않아야 한다.
- **FR-010**: 시스템은 이미지 저장소 게시, 배포 상태 갱신, 배포 동기화의 성공 또는 실패 여부를 GitHub에서 확인 가능하게 해야 한다.
- **FR-011**: 시스템은 main 병합 후 배포 흐름이 재귀적으로 무한 반복되지 않도록 자동 갱신 커밋 또는 배포 트리거 조건을 통제해야 한다.
- **FR-012**: 시스템은 배포 실패 시 검증 실패, 인증 실패, 이미지 게시 실패, 배포 상태 갱신 실패, 운영 환경 반영 실패를 구분해 확인할 수 있는 운영 문서를 제공해야 한다.
- **FR-013**: 시스템은 비용과 운영 복잡도를 낮게 유지하기 위해 008의 단일 환경 배포 구조를 유지해야 하며, 멀티 환경 분리는 이번 범위에 포함하지 않아야 한다.
- **FR-014**: 시스템은 본격적인 테스트 코드 도입을 이번 범위의 필수 작업으로 요구하지 않아야 한다.
- **FR-015**: 시스템은 고급 롤백 자동화와 대규모 관측성 스택 도입을 이번 범위에서 제외해야 한다.
- **FR-016**: 시스템은 자동배포 준비가 완료되었는지 확인할 수 있는 운영자 체크 절차를 제공해야 한다.
- **FR-017**: 시스템은 비용과 단순성을 위해 최소 workflow 수를 우선해야 하며, PR 검증 흐름과 main 배포 흐름을 분리하되 불필요한 추가 workflow를 만들지 않아야 한다.
- **FR-018**: 시스템은 ECR repository를 008에서 정의한 `study-note-backend`, `study-note-frontend` 구조와 호환되게 사용해야 한다.
- **FR-019**: 시스템은 Argo CD의 GitOps 동기화 구조를 유지해야 하며, 이번 범위에서 고급 운영 기능을 추가하지 않아야 한다.
- **FR-020**: 시스템은 실패 시 수동 복구 포인트와 재실행 기준을 운영 문서에 포함해야 한다.

### Constitution Alignment *(mandatory)*

- **CA-001**: 이번 기능은 `/frontend`와 `/backend` 코드를 배포 대상으로만 다루며, 프론트엔드가 백엔드 소스 파일을 직접 import하거나 참조하게 만들지 않는다. 프론트엔드와 백엔드 통신 방식은 기존 HTTP API 경계를 유지한다.
- **CA-002**: 이번 기능은 기본적으로 애플리케이션 API 계약을 변경하지 않는다. 신규 백엔드 엔드포인트가 추가되거나 변경되는 경우 모든 JSON 응답은 `{ success: boolean, data: any, error: string | null }` 형식을 유지해야 한다.
- **CA-003**: 자동배포 구현 중 저장소 패키지나 새 도구 설치가 필요하면 즉시 설치하지 않고 사용자 승인을 먼저 받아야 한다. 가능한 경우 기존 의존성과 현재 준비된 도구를 우선 사용한다.
- **CA-004**: 이번 기능은 배포 자동화와 운영 확인 흐름을 다루며, Study Note의 사용자 화면 UX를 변경하지 않는다. 기존 인라인 편집 중심 UX 원칙은 유지된다.
- **CA-005**: 데이터 저장과 접근 책임은 계속 백엔드가 가진다. 자동배포는 배포 단위와 운영 절차를 바꾸는 것이며, 프론트엔드가 저장소 또는 백엔드 파일에 직접 접근하게 만들어서는 안 된다.

### Key Entities *(include if feature involves data)*

- **Validation Workflow**: PR에서 실행되는 검증 흐름으로, 운영 배포 없이 변경사항의 기본 품질과 배포 가능성을 판단한다.
- **Deployment Workflow**: main 병합 후 실행되는 릴리스 흐름으로, 최신 애플리케이션 버전을 게시하고 운영 환경에 반영한다.
- **Deployment Credential Trust**: GitHub가 AWS에 접근하기 위해 사용하는 단기 신뢰 관계로, 장기 access key 저장을 대체한다.
- **Image Release**: 배포 가능한 애플리케이션 버전 단위로, frontend와 backend 각각의 게시 상태와 식별 가능한 버전 정보를 포함한다.
- **GitOps State**: 운영 환경이 참조해야 하는 배포 상태 정보로, 최신 이미지 또는 릴리스 버전을 선언적으로 나타낸다.
- **Deployment Run Record**: GitHub에서 확인 가능한 실행 기록으로, 성공/실패 상태와 실패 단계 식별 정보를 포함한다.
- **Operations Guide**: 자동배포 설정값, required checks 연결 방법, 실패 시 확인 포인트를 설명하는 운영 문서다.
- **Required Check Set**: branch protection에 연결 가능한 PR 검증 결과 집합으로, `Terraform fmt and validate`, `App and image build`, `Kubernetes manifest sanity`를 포함한다.
- **Recovery Point**: 배포 실패 후 운영자가 수동으로 확인하거나 재실행할 수 있는 기준 지점으로, 검증 재실행, 이미지 게시 재시도, GitOps 상태 확인, 운영 환경 동기화 확인을 포함한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: PR 생성 후 10분 이내에 기본 검증 결과가 GitHub PR 화면에 성공 또는 실패 상태로 표시된다.
- **SC-002**: PR 검증은 운영 배포를 실행하지 않고도 빌드 가능성과 배포 명세 기본 오류를 확인할 수 있다.
- **SC-003**: main 병합 후 15분 이내에 최신 버전 배포 흐름이 시작되고, 성공 또는 실패 여부가 GitHub 실행 기록에 남는다.
- **SC-004**: 정상 배포 시 운영자는 공개 접속 경로에서 main에 병합된 최신 변경사항을 확인할 수 있다.
- **SC-005**: 배포 실패 시 운영자는 5분 이내에 실패 구간이 인증, 이미지 게시, 배포 상태 갱신, 운영 환경 반영 중 어디인지 구분할 수 있다.
- **SC-006**: GitHub 저장소에는 배포 인증 용도의 장기 AWS access key가 저장되지 않는다.
- **SC-007**: 운영 문서만 보고 branch protection required checks 후보, 배포 변수, 실패 확인 순서를 빠짐없이 확인할 수 있다.
- **SC-008**: PR 검증 workflow는 production 배포 또는 이미지 publish 없이 완료되어야 한다.
- **SC-009**: main 병합 후 배포 workflow는 `study-note-backend`와 `study-note-frontend` 이미지 게시 및 GitOps 상태 갱신 결과를 GitHub 실행 기록에 남겨야 한다.
- **SC-010**: 운영 문서에는 실패 구간별 재실행 기준과 수동 확인 포인트가 포함되어야 한다.

## Assumptions

- 008에서 정의한 AWS 단일 리전, 단일 EC2, k3s, Argo CD 기반 MVP 배포 환경이 준비되어 있거나 동일한 구조로 준비될 수 있다.
- 첫 자동배포 대상은 단일 운영 환경이며 dev, staging, prod 분리는 후속 spec에서 다룬다.
- 테스트 코드가 아직 없으므로 초기 검증은 빌드 가능성, 이미지 생성 가능성, 배포 명세 기본 검증 중심으로 구성한다.
- GitHub 저장소는 PR 기반 변경 검토와 main 병합 흐름을 사용한다.
- 컨테이너 이미지 저장소와 AWS 접근 신뢰 구성은 008에서 선택한 저비용 MVP 방향을 따른다.
- GitHub Actions workflow는 `PR Checks`와 `Deploy Main`의 두 흐름을 기본으로 하며, 추가 workflow는 planning 단계에서 필요성이 명확할 때만 검토한다.
- ECR repository 이름은 008 구조와 호환되는 `study-note-backend`, `study-note-frontend`를 기본으로 한다.
- Argo CD는 GitOps 동기화에만 사용하고, 고급 롤백 자동화와 본격 운영 관측성은 후속 spec으로 남긴다.
- 운영자는 GitHub Actions 실행 기록과 008 운영 문서를 확인할 수 있다.
- 주요 개발 및 검증 흐름은 WSL Ubuntu 기준 명령과 문서를 우선한다.
