export function canNotifyTargetUser(options: {
  callerRole: string
  callerSchoolId: string | null
  targetSchoolId: string | null
}): boolean {
  if (options.callerRole === 'platform_admin') return true
  if (!options.callerSchoolId || !options.targetSchoolId) return false
  return options.callerSchoolId === options.targetSchoolId
}
