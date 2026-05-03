import { ActivitySchema, EmissionFactorSchema, NewActivityInputSchema } from '@/shared/types'

describe('ActivitySchema', () => {
  it('✅ 올바른 활동 데이터를 파싱한다', () => {
    const valid = {
      id: 'a-001',
      date: '2025-01-01',
      type: '전기',
      description: '한국전력',
      amount: 110,
      unit: 'kWh',
    }
    const result = ActivitySchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('❌ 알 수 없는 type을 거부한다', () => {
    const invalid = {
      id: 'a-001',
      date: '2025-01-01',
      type: '가스', // not in enum
      description: '도시가스',
      amount: 50,
      unit: 'm3',
    }
    expect(ActivitySchema.safeParse(invalid).success).toBe(false)
  })

  it('🔲 amount가 음수이면 거부한다 (경계값)', () => {
    const invalid = {
      id: 'a-001',
      date: '2025-01-01',
      type: '전기',
      description: '한국전력',
      amount: -1,
      unit: 'kWh',
    }
    expect(ActivitySchema.safeParse(invalid).success).toBe(false)
  })
})

describe('EmissionFactorSchema', () => {
  it('✅ 올바른 배출계수를 파싱한다', () => {
    const valid = {
      id: 'ef-001',
      category: '전기',
      matchKey: '전기:한국전력',
      factor: 0.456,
      unit: 'kgCO₂e / kWh',
      validFrom: '2025-01-01',
    }
    expect(EmissionFactorSchema.safeParse(valid).success).toBe(true)
  })

  it('❌ validFrom이 잘못된 날짜 형식이면 거부한다', () => {
    const invalid = {
      id: 'ef-001',
      category: '전기',
      matchKey: '전기:한국전력',
      factor: 0.456,
      unit: 'kgCO₂e / kWh',
      validFrom: '2025/01/01', // wrong separator
    }
    expect(EmissionFactorSchema.safeParse(invalid).success).toBe(false)
  })

  it('🔲 빈 matchKey를 거부한다 (경계값)', () => {
    const invalid = {
      id: 'ef-001',
      category: '전기',
      matchKey: '',
      factor: 0.456,
      unit: 'kgCO₂e / kWh',
      validFrom: '2025-01-01',
    }
    expect(EmissionFactorSchema.safeParse(invalid).success).toBe(false)
  })
})

describe('NewActivityInputSchema', () => {
  it('✅ id 없이 통과한다', () => {
    const valid = {
      date: '2025-01-01',
      type: '운송',
      description: '트럭',
      amount: 41,
      unit: 'ton-km',
    }
    expect(NewActivityInputSchema.safeParse(valid).success).toBe(true)
  })

  it('❌ id가 포함되어도 strict 검증이 아니므로 통과 (Omit 동작 확인)', () => {
    const withId = {
      id: 'a-001',
      date: '2025-01-01',
      type: '운송',
      description: '트럭',
      amount: 41,
      unit: 'ton-km',
    }
    const result = NewActivityInputSchema.safeParse(withId)
    expect(result.success).toBe(true)
    if (result.success) {
      expect('id' in result.data).toBe(false)
    }
  })

  it('🔲 description이 빈 문자열이면 거부한다 (경계값)', () => {
    const invalid = {
      date: '2025-01-01',
      type: '원소재',
      description: '',
      amount: 100,
      unit: 'kg',
    }
    expect(NewActivityInputSchema.safeParse(invalid).success).toBe(false)
  })
})
