import type { AcademicTerm } from "./academicTerm";

/** The result of one recorded course attempt. */
export const STUDENT_COURSE_STATUSES = [
  "passed",
  "failed",
  "inProgress",
  "transfer",
  "withdrawn",
  "unknown",
] as const;

export type StudentCourseStatus = (typeof STUDENT_COURSE_STATUSES)[number];

/**
 * One student's historical attempt at a course.
 *
 * The record deliberately keeps the transcript identity alongside an optional
 * catalog link: historical and transferred courses need not exist in the
 * current course catalog. Multiple records may refer to the same course.
 */
export interface StudentCourseRecord<TTerm extends string = string> {
  /** Null when the transcript course has not been matched to a catalog entry. */
  courseDefinitionId: string | null;
  courseCode: string;
  /** Course name as recorded by the source, which may differ from the catalog. */
  courseName: string;
  /** Credits recorded for this attempt; null when the source does not provide them. */
  credits: number | null;
  /** Null when no reliable teaching period can be recovered from the source. */
  term: AcademicTerm<TTerm> | null;
  /** Verbatim grade notation; null when the source supplies no grade. */
  rawGrade: string | null;
  status: StudentCourseStatus;
}
