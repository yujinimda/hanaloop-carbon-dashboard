import { z } from 'zod'

export const ActivityTypeSchema = z.enum(['전기', '원소재', '운송'])
export type ActivityType = z.infer<typeof ActivityTypeSchema>

export const ActivitySchema = z.object({
  id: z.string().min(1),
  date: z.string().date(),
  type: ActivityTypeSchema,
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  unit: z.string().min(1),
})
export type Activity = z.infer<typeof ActivitySchema>

export const EmissionFactorSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  matchKey: z.string().min(1),
  factor: z.number().nonnegative(),
  unit: z.string().min(1),
  validFrom: z.string().date(),
})
export type EmissionFactor = z.infer<typeof EmissionFactorSchema>

export const EmissionResultSchema = z.object({
  activityId: z.string().min(1),
  date: z.iso.date(),
  type: ActivityTypeSchema,
  description: z.string().min(1),
  amount: z.number(),
  activityUnit: z.string().min(1),
  factor: z.number(),
  emission: z.number(),
})
export type EmissionResult = z.infer<typeof EmissionResultSchema>

export const MonthlyTotalSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  total: z.number(),
  byType: z.object({
    전기: z.number(),
    원소재: z.number(),
    운송: z.number(),
  }),
})
export type MonthlyTotal = z.infer<typeof MonthlyTotalSchema>

export const NewActivityInputSchema = ActivitySchema.omit({ id: true })
export type NewActivityInput = z.infer<typeof NewActivityInputSchema>
