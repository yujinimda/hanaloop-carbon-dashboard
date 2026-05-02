/**
 * 가짜 API 레이어
 * - 200~800ms 무작위 지연으로 실제 네트워크 흉내
 * - 쓰기 작업은 15% 확률로 실패 (에러/롤백 UI 테스트용)
 */
import { activities as seedActivities, emissionFactors as seedFactors } from '@/data/seed';
import type { Activity, EmissionFactor, NewActivityInput } from './types';

// 메모리 내 상태 (런타임 동안 유지)
let _activities: Activity[] = [...seedActivities];
const _factors: EmissionFactor[] = [...seedFactors];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const jitter = () => 200 + Math.random() * 600;
const maybeFail = () => Math.random() < 0.15;

export async function fetchActivities(): Promise<Activity[]> {
  await delay(jitter());
  return [..._activities];
}

export async function fetchEmissionFactors(): Promise<EmissionFactor[]> {
  await delay(jitter());
  return [..._factors];
}

export async function createActivity(input: NewActivityInput): Promise<Activity> {
  await delay(jitter());
  if (maybeFail()) {
    throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
  const created: Activity = { ...input, id: crypto.randomUUID() };
  _activities = [..._activities, created];
  return created;
}

export async function deleteActivity(id: string): Promise<void> {
  await delay(jitter());
  if (maybeFail()) {
    throw new Error('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
  _activities = _activities.filter((a) => a.id !== id);
}

/** 테스트용: 상태 초기화 */
export function __resetState() {
  _activities = [...seedActivities];
}
