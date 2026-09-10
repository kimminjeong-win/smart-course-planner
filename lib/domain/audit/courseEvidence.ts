import type {
  StudentCourseRecord,
  StudentCourseStatus,
} from "../studentCourseRecord";

export const AUDIT_COMPLETION_STATES = [
  "earned",
  "inProgress",
  "notEarned",
  "policyRequired",
] as const;

export type AuditCompletionState = (typeof AUDIT_COMPLETION_STATES)[number];

export const AUDIT_CREDIT_ELIGIBILITIES = [
  "eligible",
  "notEligible",
  "policyRequired",
] as const;

export type AuditCreditEligibility =
  (typeof AUDIT_CREDIT_ELIGIBILITIES)[number];

/** Evidence derived from one course record, before institution policy is applied. */
export interface CourseAuditEvidence<TTerm extends string = string> {
  /** Retained by reference so the evidence never replaces the historical fact. */
  sourceRecord: StudentCourseRecord<TTerm>;
  /** Whether this attempt can prove completion of a course requirement. */
  completion: AuditCompletionState;
  credit: {
    /** Whether the recorded credit value may contribute to an earned total. */
    eligibility: AuditCreditEligibility;
    /** Source-reported value, not a computed or policy-approved contribution. */
    reportedCredits: number | null;
  };
}

function completionFor(status: StudentCourseStatus): AuditCompletionState {
  switch (status) {
    case "passed":
      return "earned";
    case "inProgress":
      return "inProgress";
    case "transfer":
      return "policyRequired";
    case "failed":
    case "withdrawn":
    case "unknown":
      return "notEarned";
  }
}

function creditEligibilityFor(
  status: StudentCourseStatus,
): AuditCreditEligibility {
  switch (status) {
    case "passed":
      return "eligible";
    case "transfer":
      return "policyRequired";
    case "failed":
    case "inProgress":
    case "withdrawn":
    case "unknown":
      return "notEligible";
  }
}

/** Convert one immutable student fact into policy-neutral audit evidence. */
export function studentCourseRecordToAuditEvidence<TTerm extends string>(
  record: StudentCourseRecord<TTerm>,
): CourseAuditEvidence<TTerm> {
  return {
    sourceRecord: record,
    completion: completionFor(record.status),
    credit: {
      eligibility: creditEligibilityFor(record.status),
      reportedCredits: record.credits,
    },
  };
}

/** Convert records independently; repeated attempts remain separate evidence. */
export function studentCourseRecordsToAuditEvidence<TTerm extends string>(
  records: readonly StudentCourseRecord<TTerm>[],
): CourseAuditEvidence<TTerm>[] {
  return records.map(studentCourseRecordToAuditEvidence);
}

/**
 * Course-code completion candidates for earned-only audits.
 * A set prevents repeated passes from filling the same course requirement twice
 * without deleting either attempt from the evidence collection.
 */
export function earnedCompletionCourseCodes<TTerm extends string>(
  evidence: readonly CourseAuditEvidence<TTerm>[],
): ReadonlySet<string> {
  return new Set(
    evidence
      .filter(({ completion }) => completion === "earned")
      .map(({ sourceRecord }) => sourceRecord.courseCode),
  );
}
