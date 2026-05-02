export type ActivityType = '전기' | '원소재' | '운송';

export type Activity = {
  id: string;
  date: string; // "YYYY-MM-DD"
  type: ActivityType;
  description: string; // "한국전력", "플라스틱 1", "트럭"
  amount: number;
  unit: string; // "kWh", "kg", "ton-km"
};

export type EmissionFactor = {
  id: string;
  category: string; // display label
  matchKey: string; // "전기:한국전력" — matches Activity type:description
  factor: number; // kgCO₂e per unit
  unit: string; // "kgCO₂e / kWh"
  validFrom: string; // "2025-01-01"
};

export type EmissionResult = {
  activityId: string;
  date: string;
  type: ActivityType;
  description: string;
  amount: number;
  activityUnit: string;
  factor: number;
  emission: number; // kgCO₂e
};

export type MonthlyTotal = {
  month: string; // "2025-01"
  total: number; // kgCO₂e
  byType: Record<ActivityType, number>;
};

export type NewActivityInput = Omit<Activity, 'id'>;
