export function hasStaffCredentials(): boolean {
  return Boolean(process.env.E2E_STAFF_USERNAME && process.env.E2E_STAFF_PASSWORD)
}

export function hasStudentCredentials(): boolean {
  return Boolean(process.env.E2E_STUDENT_NUMBER && process.env.E2E_STUDENT_PIN)
}

export const staffCredentials = {
  username: process.env.E2E_STAFF_USERNAME || '',
  password: process.env.E2E_STAFF_PASSWORD || '',
}

export const studentCredentials = {
  studentNumber: process.env.E2E_STUDENT_NUMBER || '',
  pin: process.env.E2E_STUDENT_PIN || '',
}
