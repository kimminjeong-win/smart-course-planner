export {
  type AcademicTerm,
  STANDARD_TERMS,
  type StandardTerm,
} from "./academicTerm";
export {
  AUDIT_COMPLETION_STATES,
  AUDIT_CREDIT_ELIGIBILITIES,
  type AuditCompletionState,
  type AuditCreditEligibility,
  type CourseAuditEvidence,
  earnedCompletionCourseCodes,
  studentCourseRecordsToAuditEvidence,
  studentCourseRecordToAuditEvidence,
} from "./audit/courseEvidence";
export {
  type CourseCreditPoolRule,
  evaluateMinimumCourseCredits,
  type MinimumCreditEvaluation,
  type MinimumCreditEvaluationStatus,
  type MinimumCreditUncertainty,
} from "./audit/minimumCourseCredits";
export {
  ACHIEVEMENT_CREDIT_STATES,
  type AchievementCreditState,
  type NonCourseAchievementCreditEvidence,
  studentAchievementRecordsToCreditEvidence,
  studentAchievementRecordToCreditEvidence,
} from "./audit/nonCourseAchievementEvidence";
export type { CourseDefinition } from "./courseDefinition";
export type { CurriculumProgram } from "./curriculumProgram";
export type { Institution } from "./institution";
export type { NonCourseAchievementDefinition } from "./nonCourseAchievementDefinition";
export {
  STUDENT_ACHIEVEMENT_STATUSES,
  type StudentAchievementRecord,
  type StudentAchievementStatus,
} from "./studentAchievementRecord";
export {
  STUDENT_COURSE_STATUSES,
  type StudentCourseRecord,
  type StudentCourseStatus,
} from "./studentCourseRecord";
export {
  type WaterlooTerm,
  waterlooTermIdToAcademicTerm,
  waterlooTermToAcademicTerm,
} from "./waterlooTermAdapter";
