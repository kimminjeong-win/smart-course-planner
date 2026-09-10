import type { StudentAchievementRecord } from "../studentAchievementRecord";

export const ACHIEVEMENT_CREDIT_STATES = [
  "earned",
  "notEarned",
  "indeterminate",
] as const;

export type AchievementCreditState = (typeof ACHIEVEMENT_CREDIT_STATES)[number];

/** Credit evidence projected from one non-course student fact. */
export interface NonCourseAchievementCreditEvidence<
  TTerm extends string = string,
> {
  /** Namespaced stable identity used to prevent duplicate ingestion from double-counting. */
  evidenceId: string;
  source: "nonCourseAchievement";
  /** Retained by reference so the evidence does not replace the student fact. */
  sourceRecord: StudentAchievementRecord<TTerm>;
  credit: {
    state: AchievementCreditState;
    /** Source-reported value, even when it has not yet been earned. */
    reportedCredits: number | null;
    /** Numeric earned contribution; null means not earned or not determinable. */
    earnedCredits: number | null;
  };
}

export function studentAchievementRecordToCreditEvidence<TTerm extends string>(
  record: StudentAchievementRecord<TTerm>,
): NonCourseAchievementCreditEvidence<TTerm> {
  const state: AchievementCreditState =
    record.status === "completed"
      ? record.credits === null
        ? "indeterminate"
        : "earned"
      : "notEarned";

  return {
    evidenceId: `nonCourseAchievement:${record.id}`,
    source: "nonCourseAchievement",
    sourceRecord: record,
    credit: {
      state,
      reportedCredits: record.credits,
      earnedCredits: state === "earned" ? record.credits : null,
    },
  };
}

/**
 * Project student facts once per stable record identity.
 * The source records remain untouched; duplicate ingestion cannot add credit twice.
 */
export function studentAchievementRecordsToCreditEvidence<TTerm extends string>(
  records: readonly StudentAchievementRecord<TTerm>[],
): NonCourseAchievementCreditEvidence<TTerm>[] {
  const seen = new Set<string>();
  const evidence: NonCourseAchievementCreditEvidence<TTerm>[] = [];

  for (const record of records) {
    const item = studentAchievementRecordToCreditEvidence(record);
    if (seen.has(item.evidenceId)) continue;
    seen.add(item.evidenceId);
    evidence.push(item);
  }

  return evidence;
}
