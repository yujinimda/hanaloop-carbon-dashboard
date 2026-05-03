'use client'

import useSWR from 'swr'
import { fetchActivities } from '@/shared/lib/api'
import { QUERY_KEYS } from '@/shared/constants'
import type { Activity } from '@/shared/types'

export function useActivities() {
  const { data, error, isLoading, mutate } = useSWR<Activity[]>(
    QUERY_KEYS.activities,
    fetchActivities,
  )
  return { activities: data ?? [], error, isLoading, mutate }
}
