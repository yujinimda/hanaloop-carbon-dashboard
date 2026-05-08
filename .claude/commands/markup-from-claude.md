# /markup-from-claude — Claude Artifact 시안을 프로젝트 컨벤션으로 마크업하고 3단 검수

Claude Artifact 결과물(JSX/HTML 코드 또는 PNG)을 받아 FSD/디자인 토큰/Zod/SWR 컨벤션에 맞게 마크업한 뒤, 자동 사전 검사 → 구조/비주얼/통합 3단 검수를 거쳐 PR 직전까지 끌고 간다.

## 인자

```
/markup-from-claude <claude-export-path-or-route> [--route /<path>] [--feature <feature-name>]
```

- `claude-export/<route>.jsx` (코드) 또는 `claude-export/<route>.png` (참고 이미지)이 있어야 함.
- `--route` 명시 안 되면 시안 파일명에서 추론 (`activities-list.jsx` → `/activities`).
- `--feature` 명시 안 되면 라우트에서 추론.

## 실행 순서

### 0. 준비

- 현재 브랜치가 `master`/`main`이면 `feat/<feature>-markup` 브랜치 생성.
- `claude-export/` 에 시안 자산이 실제로 있는지 확인. 없으면 사용자에게 안내 후 중단.
- `WIREFRAME.md` 가 해당 라우트 의도를 담고 있는지 확인. 없거나 비어있으면 사용자에게 작성 요청 후 중단 — 비주얼 검수 기준이 없으면 검수 불가.

### 1. 인벤토리 갱신

```bash
pnpm design:inventory
```

`COMPONENT_INVENTORY.md` 가 최신화되어야 검수자가 중복을 정확히 잡을 수 있음.

### 2. 시안 분석

`claude-export/<route>.{jsx,tsx,html,png}` 를 읽고:

- 어떤 영역(헤더, KPI 카드, 차트, 테이블, 폼)이 있는지.
- 각 영역이 `COMPONENT_INVENTORY.md` 의 어떤 primitive로 매핑되는지.
- 새로 만들어야 할 composite 컴포넌트(예: `KpiCard`, `EmissionTrendChart`)는 어디에 둘지(`features/<feature>/ui/`).

### 3. 마크업 (FSD + 토큰 + Zod 컨벤션)

- 컴포넌트는 `features/<feature>/ui/` 또는 기존 `shared/ui/` primitive 조합으로.
- 색상은 `app/globals.css` 토큰(`bg-primary`, `text-muted-foreground` 등)만. hex/rgb/임의값 금지.
- 폼은 `react-hook-form` + `@hookform/resolvers/zod` + `shared/types` 의 Zod 스키마.
- 데이터 패칭은 `shared/hooks/useActivities` 등 기존 훅으로. 새 훅 필요 시 `shared/hooks/use<X>.ts` 생성.
- 클라이언트 인터랙션 있는 파일만 최상단에 `'use client'`.
- 절대 `interface` 선언 금지(테스트 제외). 도메인 타입은 `z.infer` 로만.
- `@radix-ui/*` 임포트 금지 — `@base-ui/react` 사용.

### 4. 자동 사전 검사

```bash
pnpm design:pre-review
```

실패 시 → 출력된 위반(파일/줄)을 직접 수정하고 다시 실행. 통과할 때까지 반복.

### 5. 1차 — 구조 검수

`reviewer-structural` 서브에이전트 호출. 입력으로 다음을 전달:

- 변경된 파일 목록
- 변경된 파일들의 diff 또는 전체 내용
- `COMPONENT_INVENTORY.md` 경로

검수자가 YAML 출력. `verdict: REJECT` 면 → 6단계 건너뛰고 11단계(재작업 루프)로.

### 6. 스크린샷 캡처

```bash
pnpm dev   # 백그라운드
pnpm design:screenshot --routes <route>
```

`screenshots/<route>/{375,768,1280}-{light,dark}.png` 6장 생성.

### 7. 픽셀 diff (시안 PNG가 있을 때만)

```bash
pnpm design:pixel-diff --route <route>
```

`diff/<route>.png` 생성. mismatch 비율 기록.

### 8. 2차 — 비주얼 검수

`reviewer-visual` 서브에이전트 호출. 입력:

- `claude-export/<route>.png`
- `screenshots/<route>/*.png` 6장
- `diff/<route>.png` + mismatch 비율
- `WIREFRAME.md`

YAML 출력. REJECT면 → 11단계로.

### 9. 빌드 / 타입 / 린트 / 테스트

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm build
```

각 출력을 캡처해서 다음 검수자에게 전달.

### 10. 3차 — 통합 검수

`reviewer-integration` 서브에이전트 호출. 입력:

- 변경된 파일 diff
- 9단계의 콘솔 출력 4종

YAML 출력. REJECT면 → 11단계로.

### 11. 재작업 루프

1차/2차/3차 중 하나라도 REJECT면:

- 해당 검수자의 `required_actions` 를 받아 그대로 수정 작업.
- 수정 후 4단계(자동 사전 검사)부터 다시.
- **최대 3회 반복**. 3회 초과 시 사용자에게 에스컬레이션하고 상세 사유 출력 후 중단.

### 12. PR 생성

3개 검수자 모두 PASS면:

- `git add -A && git commit -m "feat: <feature> markup #<issue>"` (conventional commits, CLAUDE.md §9 형식 준수).
- `git push -u origin <branch>`
- `gh pr create` — body에 다음 포함:
  - 시안 출처 (`claude-export/<route>.png`)
  - 3단 검수 통과 요약 (각 stage의 verdict + 주요 notes)
  - 반응형 스크린샷 6장 첨부 (드래그&드롭 안내)
  - `Closes #<issue>` 또는 관련 이슈

## 주의사항

- **검수 단계를 건너뛰지 말 것**. `--no-verify` 같은 우회 절대 금지.
- **`shared/ui/` 수정 금지** — shadcn은 frozen.
- 시안 파일이 없으면 즉시 중단. 추측해서 마크업하지 않는다.
- 새 npm 의존성은 사용자 승인 전엔 추가하지 않는다 (3차 검수자가 차단함).
- 라우트가 새로 생기는 경우 `app/<route>/page.tsx` 도 같이 추가.
- `/ship` 커맨드와는 다른 목적: `/ship` 은 일반 변경 PR, `/markup-from-claude` 는 디자인-주도 신규 화면.
