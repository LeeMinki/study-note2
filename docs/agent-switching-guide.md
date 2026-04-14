# Spec Kit 에이전트 전환 가이드 (Codex ↔ Claude Code)

이 문서는 Spec Kit 기반 프로젝트에서 **Claude Code**와 **Codex** 사이를 전환하는 절차를 설명합니다.
기존 `.specify/specs/*` 산출물은 전환 후에도 그대로 유지됩니다.

## 핵심 원칙

에이전트 전환은 **에이전트별 커맨드/스킬 파일**만 교체합니다. 기존 스펙이나 소스 코드는 변경하지 않습니다.

단, `specify init --here --force --ai <agent>` 실행 시 아래 파일이 덮어씌워질 수 있습니다.

- `.specify/memory/constitution.md`

전환 전에 반드시 백업하세요.

---

## 사전 조건

- 명령은 **프로젝트 루트**에서 실행합니다.
- 전환 전에 현재 작업 내용을 커밋합니다.
- `.specify/specs/*` 산출물은 Git에 보존되어 있어야 합니다.

---

## A. Claude Code → Codex

### 1. 현재 상태 백업

```bash
git add .
git commit -m "chore: backup before switching to codex"

cp .specify/memory/constitution.md /tmp/constitution-backup.md
```

### 2. Spec Kit CLI 업데이트

```bash
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git@v0.6.2
specify check
```

### 3. Codex용 프로젝트 재초기화

```bash
specify init --here --force --ai codex --ai-skills
```

### 4. constitution.md 복원

```bash
cp /tmp/constitution-backup.md .specify/memory/constitution.md
# 또는
git restore .specify/memory/constitution.md
```

### 5. Codex 실행

```bash
codex
```

### 6. Spec Kit 커맨드 확인

Codex에서 아래 프롬프트로 Spec Kit 기능을 호출할 수 있습니다.

- `$speckit-constitution`
- `$speckit-specify`
- `$speckit-clarify`
- `$speckit-plan`
- `$speckit-tasks`
- `$speckit-analyze`
- `$speckit-implement`

### 7. 문제 해결

스킬 파일이 설치됐는지 확인합니다.

```bash
find .agents -maxdepth 3 -type f | sort
```

파일이 없으면 Codex를 재시작하세요.

---

## B. Codex → Claude Code

### 1. 현재 상태 백업

```bash
git add .
git commit -m "chore: backup before switching to claude"

cp .specify/memory/constitution.md /tmp/constitution-backup.md
```

### 2. Spec Kit CLI 업데이트

```bash
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git@v0.6.2
specify check
```

### 3. Claude Code용 프로젝트 재초기화

```bash
specify init --here --force --ai claude
```

### 4. constitution.md 복원

```bash
cp /tmp/constitution-backup.md .specify/memory/constitution.md
# 또는
git restore .specify/memory/constitution.md
```

### 5. Claude Code 실행

```bash
claude
```

### 6. Spec Kit 커맨드 확인

`/` 를 입력해 아래 슬래시 커맨드가 표시되는지 확인합니다.

- `/speckit.constitution`
- `/speckit.specify`
- `/speckit.clarify`
- `/speckit.plan`
- `/speckit.tasks`
- `/speckit.analyze`
- `/speckit.implement`

### 7. 문제 해결

커맨드/스킬 파일이 설치됐는지 확인합니다.

```bash
find .claude -maxdepth 4 -type f | sort
```

슬래시 커맨드가 보이지 않으면 Claude Code를 재시작하세요.

---

## 전환 시 변경 범위

### 보존되는 항목

| 항목 | 설명 |
|------|------|
| `.specify/specs/*` | 스펙·플랜·태스크 산출물 |
| 애플리케이션 소스 코드 | 구현 파일 전체 |
| Git 히스토리 | 커밋 이력 |

### 변경되는 항목

| 항목 | 설명 |
|------|------|
| 에이전트별 커맨드/스킬 | `.claude/commands/`, `.agents/skills/` 등 |
| `.specify/scripts/` | 에이전트용 스크립트 |
| `.specify/templates/` | 산출물 템플릿 |
| `.specify/memory/` | 메모리 파일 (constitution.md 포함, 백업 필수) |

---

## 권장 팀 규칙

에이전트를 전환할 때는 아래 순서를 따릅니다.

1. 현재 작업 커밋
2. `constitution.md` 백업
3. `specify init --here --force --ai <target-agent>` 실행
4. `constitution.md` 복원
5. 에이전트 재시작
6. Spec Kit 커맨드 동작 확인
