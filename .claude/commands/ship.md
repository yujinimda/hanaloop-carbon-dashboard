# /ship — 로컬 CI 검증 + PR 생성

커밋 전 모든 검증을 통과한 후 PR을 생성하고 위키를 업데이트합니다.

## 실행 순서

### 1. Type Check

```bash
pnpm type-check
```

실패 시: 오류 표시 후 중단. 절대 건너뛰지 않음.

### 2. Lint

```bash
pnpm lint
```

실패 시: `pnpm lint:fix` 자동 시도 → 재검사 후 성공 시 수정된 파일 스테이징. 여전히 실패하면 중단.

### 3. Tests

```bash
pnpm test
```

실패 시: 실패한 테스트 출력 후 중단.

### 4. Build

```bash
pnpm build
```

실패 시: 빌드 오류 표시 후 중단.

### 5. Format Check

```bash
pnpm format:check
```

실패 시: `pnpm format` 실행 후 수정된 파일 스테이징.

### 6. Git Status 확인

- 변경사항 없으면: 사용자에게 알림 후 중단
- 변경사항 있으면: 계속 진행

### 7. Commit

- 수정된 파일들을 분석하여 conventional commit 메시지 초안 작성
- 사용자 확인 후 커밋
- 형식: `type: description #issue-number`

### 8. Push

```bash
git push -u origin <branch>
```

### 9. PR 생성

```bash
gh pr create --title "..." --body "..."
```

- PR body: 변경 요약, 테스트 체크리스트, `Closes #issue-number`
- main 브랜치에는 force push 절대 금지

### 10. Wiki Sync

PR 생성 후 GitHub Wiki 업데이트:

```bash
# wiki repo: yujinimda/hanaloop-carbon-dashboard.wiki
# 관련 토픽 페이지 업데이트 (PR 전용 페이지 생성 금지)
# Home.md에 새 토픽 있으면 링크 추가
```

## 주의사항

- main 브랜치에서 실행 시: feature 브랜치 생성 먼저 제안
- 어떤 검증도 건너뛰지 않음 (`--no-verify` 절대 금지)
- 이슈 번호 없이 PR 생성 금지
