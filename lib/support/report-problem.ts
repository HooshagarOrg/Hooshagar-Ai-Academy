import { z } from 'zod'

export const reportProblemSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'توضیح باید حداقل ۱۰ کاراکتر باشد')
    .max(1000, 'توضیح نباید بیشتر از ۱۰۰۰ کاراکتر باشد'),
  path: z.string().max(500).optional(),
  errorName: z.string().max(200).optional().nullable(),
  digest: z.string().max(120).optional().nullable(),
})

export type ReportProblemInput = z.infer<typeof reportProblemSchema>
