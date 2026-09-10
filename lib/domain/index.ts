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
export type { CourseDefinition } from "./courseDefinition";
export type { CurriculumProgram } from "./curriculumProgram";
export type { Institution } from "./institution";
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
