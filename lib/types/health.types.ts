// Types for Student Health System

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export type CheckupType = 
  | 'vision'
  | 'hearing'
  | 'dental'
  | 'growth'
  | 'general'
  | 'vaccination'
  | 'mental_health'

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese'

export type VisitOutcome = 
  | 'sent_home'
  | 'returned_to_class'
  | 'referred_to_doctor'
  | 'called_parent'
  | 'emergency'
  | 'observation'

export type VisitSeverity = 'mild' | 'moderate' | 'severe'

export type VaccinationStatus = 'done' | 'pending' | 'overdue'

// Student Health Record
export interface StudentHealthRecord {
  id: string
  studentId: string
  schoolId: string
  bloodType: BloodType | null
  chronicDiseases: string[]
  allergies: {
    food: string[]
    drug: string[]
    environmental: string[]
  }
  medications: Array<{
    name: string
    dosage: string
    frequency: string
  }>
  sportsRestrictions: string[]
  specialNeeds: string | null
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
  familyDoctor: {
    name: string
    phone: string
  } | null
  insurance: {
    company: string
    number: string
  } | null
  createdAt: string
  updatedAt: string
}

// Health Checkup
export interface HealthCheckup {
  id: string
  studentId: string
  schoolId: string
  checkupDate: string
  checkupType: CheckupType
  
  // Vision results
  visionRightEye: string | null
  visionLeftEye: string | null
  needsGlasses: boolean | null
  glassesPrescription: string | null
  colorBlindness: boolean | null
  
  // Hearing results
  hearingRightEar: string | null
  hearingLeftEar: string | null
  needsHearingAid: boolean | null
  
  // Dental results
  dentalCavities: number | null
  dentalTreatmentNeeded: boolean | null
  dentalHygieneScore: number | null // 1-5
  
  // Growth results
  heightCm: number | null
  weightKg: number | null
  bmi: number | null
  bmiCategory: BMICategory | null
  growthPercentile: number | null
  
  // Vaccination
  vaccineName: string | null
  vaccineDoseNumber: number | null
  
  // General findings
  generalFindings: string | null
  recommendations: string | null
  
  // Followup
  needsFollowup: boolean
  followupDate: string | null
  followupNote: string | null
  followupCompleted: boolean
  followupCompletedAt: string | null
  
  actionsTaken: string[]
  
  examinedBy: string
  examinerTitle: string | null
  
  attachments: Array<{
    type: string
    url: string
    name: string
  }>
  
  createdAt: string
}

// Health Visit (Infirmary)
export interface HealthVisit {
  id: string
  studentId: string
  schoolId: string
  visitDate: string
  
  symptoms: string[]
  temperature: number | null
  bloodPressure: string | null
  pulseRate: number | null
  
  diagnosis: string | null
  treatmentGiven: string | null
  medicationGiven: string[]
  restTimeMinutes: number | null
  
  severity: VisitSeverity | null
  outcome: VisitOutcome | null
  notes: string | null
  
  parentNotified: boolean
  parentNotifiedAt: string | null
  parentResponse: string | null
  
  attendedBy: string
  createdAt: string
}

// Vaccination Schedule
export interface VaccinationSchedule {
  id: string
  vaccineName: string
  vaccineNameEn: string
  recommendedAgeMonths: number
  doseNumber: number
  isMandatory: boolean
  description: string | null
  sideEffects: string | null
}

// Student Vaccination
export interface StudentVaccination {
  id: string
  studentId: string
  schoolId: string
  vaccineScheduleId: string | null
  vaccineName: string
  doseNumber: number
  vaccinationDate: string
  vaccinatedAt: string | null
  batchNumber: string | null
  expiryDate: string | null
  sideEffects: string | null
  certificateUrl: string | null
  recordedBy: string
  createdAt: string
}

// Nutrition Record
export interface NutritionRecord {
  id: string
  studentId: string
  schoolId: string
  recordDate: string
  breakfastConsumed: boolean | null
  snackConsumed: boolean | null
  lunchConsumed: boolean | null
  mealQualityScore: number | null // 1-5
  appetiteIssues: boolean
  dietRestrictions: string[]
  notes: string | null
  recordedBy: string
  createdAt: string
}

// Health Schedule
export interface HealthScheduleItem {
  id: string
  schoolId: string
  classId: string | null
  scheduleDate: string
  scheduleTime: string | null
  checkupType: CheckupType
  title: string
  description: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: string
}

// Growth Data Point for Charts
export interface GrowthDataPoint {
  age: number
  height?: number
  weight?: number
  bmi?: number
  p3?: number
  p15?: number
  p50?: number
  p85?: number
  p97?: number
}

// Health Stats
export interface SchoolHealthStats {
  totalStudents: number
  studentsWithRecords: number
  pendingFollowups: number
  checkupsThisMonth: number
  visitsThisMonth: number
  incompleteVaccinations: number
}

// Config objects
export const CHECKUP_TYPE_CONFIG: Record<CheckupType, {
  label: string
  labelEn: string
  icon: string
  color: string
}> = {
  vision: { label: 'بینایی‌سنجی', labelEn: 'Vision', icon: 'Eye', color: 'blue' },
  hearing: { label: 'شنوایی‌سنجی', labelEn: 'Hearing', icon: 'Ear', color: 'purple' },
  dental: { label: 'معاینه دندان', labelEn: 'Dental', icon: 'Activity', color: 'pink' },
  growth: { label: 'قد و وزن', labelEn: 'Growth', icon: 'TrendingUp', color: 'green' },
  general: { label: 'معاینه عمومی', labelEn: 'General', icon: 'Stethoscope', color: 'teal' },
  vaccination: { label: 'واکسیناسیون', labelEn: 'Vaccination', icon: 'Syringe', color: 'orange' },
  mental_health: { label: 'سلامت روان', labelEn: 'Mental Health', icon: 'Heart', color: 'red' },
}

export const BMI_CATEGORY_CONFIG: Record<BMICategory, {
  label: string
  labelEn: string
  color: string
}> = {
  underweight: { label: 'کم‌وزن', labelEn: 'Underweight', color: 'yellow' },
  normal: { label: 'طبیعی', labelEn: 'Normal', color: 'green' },
  overweight: { label: 'اضافه وزن', labelEn: 'Overweight', color: 'orange' },
  obese: { label: 'چاقی', labelEn: 'Obese', color: 'red' },
}

export const VISIT_OUTCOME_CONFIG: Record<VisitOutcome, {
  label: string
  labelEn: string
}> = {
  sent_home: { label: 'اعزام به منزل', labelEn: 'Sent Home' },
  returned_to_class: { label: 'بازگشت به کلاس', labelEn: 'Returned to Class' },
  referred_to_doctor: { label: 'ارجاع به پزشک', labelEn: 'Referred to Doctor' },
  called_parent: { label: 'تماس با والدین', labelEn: 'Called Parent' },
  emergency: { label: 'اورژانس', labelEn: 'Emergency' },
  observation: { label: 'تحت نظر', labelEn: 'Observation' },
}

export const SEVERITY_CONFIG: Record<VisitSeverity, {
  label: string
  labelEn: string
  color: string
}> = {
  mild: { label: 'خفیف', labelEn: 'Mild', color: 'green' },
  moderate: { label: 'متوسط', labelEn: 'Moderate', color: 'yellow' },
  severe: { label: 'شدید', labelEn: 'Severe', color: 'red' },
}

// Common symptoms for quick selection
export const COMMON_SYMPTOMS = [
  'سردرد',
  'تب',
  'دل درد',
  'حالت تهوع',
  'سرگیجه',
  'ضعف',
  'گلو درد',
  'سرفه',
  'آبریزش بینی',
  'درد عضلانی',
  'درد مفصل',
  'خارش',
  'بثورات پوستی',
  'درد چشم',
  'درد گوش',
]

// Common absence reasons for nutrition
export const DIET_RESTRICTIONS = [
  'آلرژی غذایی',
  'رژیم دیابتی',
  'محدودیت گلوتن',
  'محدودیت لاکتوز',
  'گیاه‌خواری',
  'حلال',
]





























