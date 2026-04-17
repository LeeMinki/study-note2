# Research: Test and Quality Checks

## Decision: MVP 테스트 범위는 작게 시작한다

**Rationale**: 현재 프로젝트는 배포 가능한 MVP이고, 최근 실제 회귀는 인증, JSON 저장, 이미지 업로드 인증 헤더, Markdown 렌더링처럼 제한된 영역에서 발생했다. 이 영역을 먼저 자동 검증하면 적은 테스트로도 회귀 방지 효과가 크다.

**Alternatives considered**:

- Full E2E first: 실제 사용자 흐름 재현력은 높지만 브라우저 러너, 테스트 데이터, 운영 환경 분리 비용이 커서 이번 MVP 범위와 맞지 않는다.
- Coverage-first policy: 수치 관리에는 유용하지만 초기에는 테스트 품질보다 숫자 맞추기에 치우칠 위험이 있다.

## Decision: 백엔드 테스트를 우선 도입한다

**Rationale**: 백엔드는 인증, 보호 라우트, JSON envelope, local JSON persistence를 소유한다. 이 영역이 깨지면 프론트엔드가 정상이어도 앱 전체가 실패한다. 또한 backend는 UI 환경 없이도 테스트하기 쉬워 MVP 품질 게이트에 적합하다.

**Alternatives considered**:

- Frontend component tests first: 사용자 관점과 가깝지만 DOM 테스트 도구가 필요할 가능성이 높고 새 의존성 승인 없이는 범위가 커진다.
- Only build checks: 현재보다 나아지는 품질 신호가 부족하고 실제 회귀를 충분히 잡지 못한다.

## Decision: 프론트엔드는 서비스/유틸 테스트부터 시작한다

**Rationale**: 최근 회귀는 API base URL, 이미지 업로드 Authorization 헤더, Markdown fenced code rendering처럼 순수 로직 또는 서비스 호출 조합에서 발생했다. 이 범위는 브라우저 E2E 없이도 비교적 작게 검증할 수 있다.

**Alternatives considered**:

- Full React component testing: 의미는 있지만 DOM adapter/test runner 의존성이 필요할 수 있어 사용자 승인 전제로 미룬다.
- Manual QA only: 반복 회귀 방지에 실패한다.

## Decision: build와 test를 첫 required checks로 둔다

**Rationale**: build는 이미 009에서 PR 필수 신호로 사용 중이고, test는 이번 010의 핵심 가치다. lint/format은 품질에 중요하지만 JS 도구 선택과 의존성 승인이 필요하므로 먼저 구조와 승격 기준을 문서화한다.

**Alternatives considered**:

- lint/format/test 모두 즉시 required: 품질 기준은 강하지만 새 도구 설치와 false positive 정리가 선행되어야 한다.
- test만 required: build 실패를 놓칠 수 있어 현재 배포 가능성 기준과 맞지 않는다.

## Decision: 009 PR Checks workflow를 확장한다

**Rationale**: 009는 이미 PR 검증과 main 배포를 분리했다. 기존 PR workflow에 테스트를 추가하면 운영 배포와 충돌하지 않고 branch protection도 기존 구조를 유지할 수 있다.

**Alternatives considered**:

- 새 workflow 추가: check 이름 분리는 명확하지만 초기 MVP에는 workflow 수가 늘어 관리 부담이 증가한다.
- Deploy Main에 테스트 추가: main 병합 후에야 실패를 알게 되어 PR 품질 게이트 목적과 맞지 않는다.

## Decision: coverage는 측정 가능하되 강제하지 않는다

**Rationale**: 초기 테스트 도입 단계에서는 의미 있는 회귀 검증을 만드는 것이 우선이다. coverage 수치는 참고 지표로는 유용하지만 threshold를 merge gate로 걸면 작은 MVP에서 불필요한 마찰이 커질 수 있다.

**Alternatives considered**:

- Coverage threshold required: 장기적으로는 유용할 수 있으나 초기 테스트 설계가 안정된 뒤 별도 spec에서 결정하는 편이 안전하다.
- Coverage 완전 제외: 향후 추세 파악 기회를 놓칠 수 있어 측정 가능성은 열어둔다.

## Decision: 새 의존성은 계획상 후보로만 둔다

**Rationale**: constitution은 새 패키지 설치 전 사용자 승인을 요구한다. 계획은 Node 내장 기능을 우선 검토하고, Vitest/Jest/Supertest/ESLint/Prettier 같은 도구가 필요하면 implementation 전에 승인 요청을 분리한다.

**Alternatives considered**:

- 지금 도구를 확정하고 설치: 빠르지만 dependency policy 위반이다.
- 도구 없이 shell smoke만 추가: 시작은 쉽지만 유지 가능한 테스트 체계로 확장하기 어렵다.
