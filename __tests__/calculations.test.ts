import {
  calculateEmission,
  calculateAllEmissions,
  aggregateByMonth,
  aggregateByType,
  monthOverMonthChange,
  formatEmission,
} from '@/lib/calculations';
import type { Activity, EmissionFactor } from '@/lib/types';

const factors: EmissionFactor[] = [
  { id: 'ef-001', category: '전기', matchKey: '전기:한국전력', factor: 0.456, unit: 'kgCO₂e / kWh', validFrom: '2025-01-01' },
  { id: 'ef-002', category: '플라스틱 1', matchKey: '원소재:플라스틱 1', factor: 2.3, unit: 'kgCO₂e / kg', validFrom: '2025-01-01' },
  { id: 'ef-004', category: '트럭', matchKey: '운송:트럭', factor: 3.5, unit: 'kgCO₂e / ton-km', validFrom: '2025-01-01' },
];

const activities: Activity[] = [
  { id: 'a-001', date: '2025-01-01', type: '전기', description: '한국전력', amount: 110, unit: 'kWh' },
  { id: 'a-002', date: '2025-01-01', type: '원소재', description: '플라스틱 1', amount: 230, unit: 'kg' },
  { id: 'a-003', date: '2025-01-01', type: '운송', description: '트럭', amount: 41, unit: 'ton-km' },
  { id: 'a-004', date: '2025-02-01', type: '전기', description: '한국전력', amount: 120, unit: 'kWh' },
];

describe('calculateEmission', () => {
  it('전기 배출량을 정확히 계산한다', () => {
    const result = calculateEmission(activities[0], factors);
    // 110 kWh × 0.456 = 50.16 kgCO₂e
    expect(result.emission).toBeCloseTo(50.16);
  });

  it('원소재 배출량을 정확히 계산한다', () => {
    const result = calculateEmission(activities[1], factors);
    // 230 kg × 2.3 = 529 kgCO₂e
    expect(result.emission).toBeCloseTo(529);
  });

  it('운송 배출량을 정확히 계산한다', () => {
    const result = calculateEmission(activities[2], factors);
    // 41 ton-km × 3.5 = 143.5 kgCO₂e
    expect(result.emission).toBeCloseTo(143.5);
  });

  it('매칭 배출계수가 없으면 0을 반환한다', () => {
    const unknown: Activity = { id: 'x', date: '2025-01-01', type: '전기', description: '알 수 없음', amount: 100, unit: 'kWh' };
    const result = calculateEmission(unknown, factors);
    expect(result.emission).toBe(0);
  });
});

describe('aggregateByMonth', () => {
  it('같은 달의 배출량을 합산한다', () => {
    const results = calculateAllEmissions(activities.slice(0, 3), factors);
    const monthly = aggregateByMonth(results);
    expect(monthly).toHaveLength(1);
    // 50.16 + 529 + 143.5 = 722.66
    expect(monthly[0].total).toBeCloseTo(722.66);
    expect(monthly[0].month).toBe('2025-01');
  });

  it('월별로 byType을 올바르게 집계한다', () => {
    const results = calculateAllEmissions(activities.slice(0, 3), factors);
    const monthly = aggregateByMonth(results);
    expect(monthly[0].byType['전기']).toBeCloseTo(50.16);
    expect(monthly[0].byType['원소재']).toBeCloseTo(529);
    expect(monthly[0].byType['운송']).toBeCloseTo(143.5);
  });
});

describe('aggregateByType', () => {
  it('카테고리별 총량을 집계한다', () => {
    const results = calculateAllEmissions(activities, factors);
    const byType = aggregateByType(results);
    // 전기: 50.16 + 54.72
    expect(byType['전기']).toBeCloseTo(104.88);
    expect(byType['원소재']).toBeCloseTo(529);
    expect(byType['운송']).toBeCloseTo(143.5);
  });
});

describe('monthOverMonthChange', () => {
  it('전월 대비 변화율을 계산한다', () => {
    const results = calculateAllEmissions(activities, factors);
    const monthly = aggregateByMonth(results);
    const change = monthOverMonthChange(monthly, '2025-02');
    // 2025-02: 54.72, 2025-01: 722.66 → 감소
    expect(change).toBeLessThan(0);
  });

  it('이전 달이 없으면 null 반환', () => {
    const results = calculateAllEmissions(activities, factors);
    const monthly = aggregateByMonth(results);
    expect(monthOverMonthChange(monthly, '2025-01')).toBeNull();
  });
});

describe('formatEmission', () => {
  it('1000 미만은 kgCO₂e로 표시', () => {
    expect(formatEmission(722.66)).toBe('722.66 kgCO₂e');
  });

  it('1000 이상은 tCO₂e로 표시', () => {
    expect(formatEmission(1500)).toBe('1.50 tCO₂e');
  });
});
