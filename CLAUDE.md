@AGENTS.md

# HanaLoop Carbon Dashboard — 프로젝트 헌법

## 1. 프로젝트 정체성

- **제품**: CT-045 컴퓨터 화면 PCF(제품 탄소 발자국) 대시보드
- **사용자**: 실무자(탄소 담당자), 경영자 — 비전문가도 직관적으로 이해 가능해야 함
- **데이터**: 전기/원소재/운송 활동 데이터 + 배출계수 (mock API, 메모리 기반)
- **언어**: UI 텍스트는 한국어, 코드/주석은 영어

## 2. 기술 스택

| 항목          | 버전/선택                                       |
| ------------- | ----------------------------------------------- |
| Framework     | Next.js 16.2.4 (App Router, Turbopack)          |
| Language      | TypeScript 5 (strict)                           |
| Styling       | Tailwind v4 + shadcn/ui (base-nova)             |
| Data Fetching | SWR 2.4                                         |
| Forms         | react-hook-form 7 + @hookform/resolvers + Zod 4 |
| Charts        | recharts 3.8                                    |
| UI Primitives | @base-ui/react (NOT @radix-ui)                  |
| Icons         | lucide-react                                    |
| Toast         | sonner                                          |
| Testing       | vitest 4 + jsdom                                |

**절대 쓰지 말 것**: MUI, @radix-ui/\*, Zustand, Axios, Prisma

## 3. 디렉토리 규칙 (FSD, entity 제외)

```
app/               → Next.js App Router만. layout.tsx, page.tsx, error.tsx
features/
  dashboard/       → KPI 카드, 차트, 테이블
    ui/            → 컴포넌트 (props만, 훅 금지)
    hooks/         → useDerivedEmissions.ts
  activities/      → 활동 CRUD 폼
    ui/            → ActivityForm, ActivityFormDialog
    hooks/         → useCreateActivity, useDeleteActivity
shared/
  ui/              → shadcn 컴포넌트. 절대 수정 금지.
  types/           → Zod 스키마 + z.infer 타입. 유일한 타입 출처.
  lib/             → calculations.ts, api.ts, utils.ts (순수 함수)
  constants/       → QUERY_KEYS, CHART_COLORS, GHG_SCOPE, ACTIVITY_UNITS
  hooks/           → useActivities.ts, useEmissionFactors.ts
data/              → seed.ts (정적 시드 데이터, 수정 금지)
__tests__/         → vitest 테스트
docs/              → 아키텍처 문서
.claude/           → Claude Code 설정
```

**레이어 규칙**:

- `features/` 간 상호 임포트 금지
- `features/` → `shared/` 임포트 가능
- `app/` → `features/`, `shared/` 임포트 가능
- `shared/` → 외부만 (다른 shared 레이어 임포트 주의)

## 4. TypeScript & Zod 규칙

**타입은 Zod 스키마에서만 나온다**:

```typescript
// shared/types/index.ts만 타입 정의
export const ActivitySchema = z.object({ ... })
export type Activity = z.infer<typeof ActivitySchema>

// 다른 파일에서는 import만
import type { Activity } from '@/shared/types'
```

**절대 금지**:

- `interface` 선언 (테스트 파일 제외)
- `type MyType = { ... }` 직접 선언
- `z.object()` 를 컴포넌트 파일 내에서 인라인 정의

**Zod v4 주의사항**:

- `z.string().nonempty()` 없음 → `z.string().min(1)` 사용
- `z.record(KeySchema, ValueSchema)` — 키 타입 명시 필수

## 5. SWR 데이터 패칭 규칙

**SWR 키는 QUERY_KEYS만**:

```typescript
// ✅ 올바름
useSWR(QUERY_KEYS.activities, fetchActivities)

// ❌ 금지
useSWR('activities', fetchActivities)
useSWR('/api/activities', fetchActivities)
```

**훅 패턴**:

```typescript
// shared/hooks/useActivities.ts
'use client'
export function useActivities() {
  const { data, error, isLoading, mutate } = useSWR<Activity[]>(
    QUERY_KEYS.activities,
    fetchActivities,
  )
  return { activities: data ?? [], error, isLoading, mutate }
}
// data ?? [] — 절대 undefined 반환하지 않음
```

**뮤테이션 패턴**:

```typescript
// 성공 시 반드시 mutate로 캐시 무효화
await mutate(QUERY_KEYS.activities)
// 낙관적 업데이트: mutate(key, optimisticData, { revalidate: true })
```

## 6. 컴포넌트 규칙

**'use client' 사용 기준**:

- SWR 훅, useState, useEffect, 이벤트 핸들러 → `'use client'`
- 순수 표시용(props만) → 서버 컴포넌트 (디렉티브 없음)

**컴포넌트 파일 패턴**:

```typescript
// features/dashboard/ui/KpiCard.tsx
type KpiCardProps = {
  label: string
  value: string
  trend?: 'up' | 'down' | null
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  return (...)
}
```

**규칙**:

- Named exports only (app/ 제외)
- props 타입은 컴포넌트 위에 `type`으로 선언
- shadcn `@base-ui/react` 사용 — `@radix-ui/*` 임포트 절대 금지
- CVA는 다중 variant가 있을 때만 사용

## 7. GHG Scope 도메인 규칙

활동 유형과 GHG Scope의 매핑은 `shared/constants/index.ts`의 `GHG_SCOPE`가 유일한 출처:

```typescript
export const GHG_SCOPE = {
  전기: 'Scope 2', // 간접 배출 — 구매 전력
  원소재: 'Scope 3', // 가치사슬 — 업스트림
  운송: 'Scope 3', // 가치사슬 — 운송
} as const
```

UI에서 Scope 라벨을 하드코딩하지 않음. 항상 `GHG_SCOPE[activity.type]` 사용.

## 8. 테스트 규칙

**3-case 패턴** (순수 함수 / 스키마 검증):

1. ✅ 성공 케이스
2. ❌ 에러 케이스 (잘못된 입력, 누락된 계수)
3. 🔲 경계값 (1000kg 임계값, 빈 배열)

**테스트 위치**: `__tests__/` 아래, `lib/` 구조 미러링

## 9. 커밋 규칙

conventional commits 강제 (commitlint):

```
feat: add kpi card component #4
fix: handle missing emission factor #2
chore: setup prettier config #1
refactor: migrate types to zod schemas #2
docs: add architecture.md #1
test: add schema validation tests #2
```

형식: `type: lowercase description #issue-number`

- 마침표 없음, 72자 이내, 명령형

## 10. 워크플로우

**커밋 전 체크**: `pnpm type-check && pnpm lint && pnpm test`
**PR 전 체크**: `pnpm build`
**자동화**: `/ship` 명령어 사용 (`.claude/commands/ship.md` 참고)
