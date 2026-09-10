import type { AcademicTerm } from "./academicTerm";

export const STUDENT_ACHIEVEMENT_STATUSES = [
  "completed",
  "inProgress",
  "notCompleted",
] as const;

export type StudentAchievementStatus =
  (typeof STUDENT_ACHIEVEMENT_STATUSES)[number];

/** One student's actual participation in a non-course curriculum item. */
export interface StudentAchievementRecord<TTerm extends string = string> {
  /** Stable identity for this fact within the student's record set. */
  id: string;
  achievementDefinitionId: string;
  /** Name recorded with the fact, retained independently of later definition edits. */
  achievementName: string;
  /** Credits reported for this fact; null means that no value was established. */
  credits: number | null;
  /** Null when the activity spans terms or no reliable completion term is known. */
  term: AcademicTerm<TTerm> | null;
  status: StudentAchievementStatus;
}
