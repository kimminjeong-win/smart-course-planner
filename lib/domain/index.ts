export {
  type AcademicTerm,
  STANDARD_TERMS,
  type StandardTerm,
} from "./academicTerm";
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
