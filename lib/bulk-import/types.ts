export type ImportSheetType = 'students' | 'staff'

export type RowStatus = 'pending' | 'valid' | 'warning' | 'error' | 'success' | 'skipped'

export interface StudentImportRow {
  rowNumber: number
  firstName: string
  lastName: string
  nationalCode: string
  grade: number
  className?: string
  parentFirstName?: string
  parentLastName?: string
  parentLoginCode?: string
  parentMobile?: string
  parentRelation?: 'father' | 'mother' | 'guardian'
  status: RowStatus
  errors: string[]
  warnings: string[]
}

export interface StaffImportRow {
  rowNumber: number
  firstName: string
  lastName: string
  nationalCode: string
  role: string
  mobile?: string
  loginCode: string
  status: RowStatus
  errors: string[]
  warnings: string[]
}

export interface ImportOptions {
  schoolId: string
  createParentAccounts: boolean
  skipDuplicates: boolean
  defaultParentPassword?: string
  defaultStaffPassword?: string
}

export interface ImportRowResult {
  rowNumber: number
  name: string
  status: 'success' | 'warning' | 'error' | 'skipped'
  message?: string
  loginCode?: string
  pin?: string
  role?: string
}

export interface ImportSummary {
  success: boolean
  total: number
  successful: number
  warnings: number
  errors: number
  skipped: number
  parentAccounts: number
  details: ImportRowResult[]
}
