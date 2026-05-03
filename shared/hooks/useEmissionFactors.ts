'use client'

import useSWR from 'swr'
import { fetchEmissionFactors } from '@/shared/lib/api'
import { QUERY_KEYS } from '@/shared/constants'
import type { EmissionFactor } from '@/shared/types'

export function useEmissionFactors() {
  const { data, error, isLoading, mutate } = useSWR<EmissionFactor[]>(
    QUERY_KEYS.emissionFactors,
    fetchEmissionFactors,
  )
  return { factors: data ?? [], error, isLoading, mutate }
}
