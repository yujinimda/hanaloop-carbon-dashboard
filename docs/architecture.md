# Architecture

## Overview

CT-045 컴퓨터 화면 제품의 PCF(Product Carbon Footprint) 대시보드.
순수 프론트엔드 — DB 없음, mock API로 메모리 기반 데이터 관리.

## Data Flow

```
data/seed.ts
    ↓
shared/lib/api.ts (mock, 200-800ms delay, 15% fail)
    ↓
shared/hooks/ (SWR: useActivities, useEmissionFactors)
    ↓
features/dashboard/hooks/useDerivedEmissions.ts
    ↓ (useMemo)
shared/lib/calculations.ts (순수 함수)
    ↓
features/dashboard/ui/ (KpiCard, charts, table)
```

## FSD Layer Structure

```
app/               → 라우팅만
features/          → 비즈니스 기능 (dashboard, activities)
shared/            → 재사용 가능한 모든 것
data/              → 정적 시드 데이터
```

**의존성 방향**: `app → features → shared` (단방향)

## GHG Scope Classification

| 활동 유형 | GHG Scope | 이유 |
|----------|-----------|------|
| 전기 (한국전력) | Scope 2 | 간접 배출 — 구매 전력 |
| 원소재 (플라스틱1, 2) | Scope 3 | 가치사슬 — 업스트림 원료 |
| 운송 (트럭) | Scope 3 | 가치사슬 — 아웃바운드 물류 |

## Type System

모든 타입은 Zod 스키마에서 파생 (`shared/types/index.ts`):

```
ActivitySchema → Activity
EmissionFactorSchema → EmissionFactor
EmissionResultSchema → EmissionResult
NewActivityInputSchema → NewActivityInput (= ActivitySchema.omit({id}))
```

배출계수 매칭 키: `"${type}:${description}"` 패턴 (e.g., "전기:한국전력")

## SWR Cache Strategy

```
QUERY_KEYS.activities        → useActivities()
QUERY_KEYS.emissionFactors   → useEmissionFactors()
```

뮤테이션 후 `mutate(QUERY_KEYS.activities)` 호출로 캐시 무효화.
낙관적 업데이트: 삭제 시 즉시 UI에서 제거 → 실패 시 롤백.

## Component Hierarchy

```
app/page.tsx ('use client')
  └── features/dashboard/ui/DashboardPage.tsx
        ├── KpiCard × 3  (total PCF, MoM, Scope 2/3 split)
        ├── EmissionTrendChart  (monthly BarChart, stacked)
        ├── BreakdownChart  (PieChart by type)
        ├── ActivityTable  (shadcn Table + GHG Scope column)
        │     └── delete button → useDeleteActivity
        └── ActivityFormDialog  (shadcn Dialog)
              └── ActivityForm  (react-hook-form + Zod)
                    └── useCreateActivity
```

## Design Trade-offs

### Trade-off 1: DB 없이 mock API
- **선택**: 메모리 기반 mock (`shared/lib/api.ts`)
- **이유**: 2일 제약, 로컬 실행 단순성 (yarn dev 한 번으로 끝), 평가 핵심이 시각화/UX
- **희생**: 새로고침 시 데이터 초기화, 실제 영속성 없음
- **확장 경로**: `shared/lib/api.ts` 인터페이스 유지하면서 실제 fetch로 교체 가능

### Trade-off 2: FSD (entity 레이어 제외)
- **선택**: app / features / shared 3-layer
- **이유**: entity 레이어는 다수 도메인 객체가 공유될 때 가치. 이 프로젝트는 Activity/EmissionFactor가 공유 대상 → shared/types로 충분
- **이득**: 레이어 수 줄여 온보딩 비용 감소, features 간 명확한 경계

### Trade-off 3: SWR vs TanStack Query
- **선택**: SWR
- **이유**: 이 프로젝트는 서버 상태 캐싱 + 뮤테이션이 전부. TanStack Query의 복잡한 기능(infinite queries, prefetching 등) 불필요. SWR이 번들 사이즈 작고 API 단순.
- **희생**: Optimistic update API가 TanStack Query보다 덜 편리

### Trade-off 4: 낙관적 업데이트 (삭제)
- **선택**: 즉시 UI에서 제거 → 실패 시 롤백
- **이유**: 15% 실패율의 mock API로 에러 처리 시연 + UX 응답성 향상
- **희생**: 롤백 로직 복잡성 증가
