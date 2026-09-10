import type { RuleNode } from "../../requirements/types";
import type { CourseAuditEvidence } from "./courseEvidence";

export type CourseCreditPoolRule = Extract<
  RuleNode,
  { kind: "courseCreditPool" }
>;

export type MinimumCreditEvaluationStatus =
  | "unmet"
  | "partial"
  | "met"
  | "indeterminate";

export type MinimumCreditUncertainty =
  | {
      kind: "missingCredits";
      courseCode: string;
    }
  | {
      kind: "conflictingCredits";
      courseCode: string;
      reportedCredits: number[];
    }
  | {
      kind: "transferPolicyRequired";
      courseCode: string;
      reportedCredits: number | null;
    };

export interface MinimumCreditEvaluation {
  status: MinimumCreditEvaluationStatus;
  earnedCredits: number;
  countedCourseCodes: string[];
  uncertainties: MinimumCreditUncertainty[];
}

/**
 * Evaluate one explicit course pool from earned canonical evidence.
 * Credits are counted once per code; unresolved values fail closed.
 */
export function evaluateMinimumCourseCredits<TTerm extends string>(
  rule: CourseCreditPoolRule,
  evidence: readonly CourseAuditEvidence<TTerm>[],
): MinimumCreditEvaluation {
  const allowed = new Set(rule.courses);
  const byCode = new Map<string, CourseAuditEvidence<TTerm>[]>();

  for (const item of evidence) {
    const code = item.sourceRecord.courseCode;
    if (!allowed.has(code)) continue;
    const records = byCode.get(code);
    if (records) records.push(item);
    else byCode.set(code, [item]);
  }

  let earnedCredits = 0;
  const countedCourseCodes: string[] = [];
  const uncertainties: MinimumCreditUncertainty[] = [];

  for (const code of new Set(rule.courses)) {
    const records = byCode.get(code) ?? [];
    const earned = records.filter(
      ({ completion, credit }) =>
        completion === "earned" && credit.eligibility === "eligible",
    );

    if (earned.length > 0) {
      const values = earned.map(({ credit }) => credit.reportedCredits);
      if (values.some((value) => value === null)) {
        uncertainties.push({ kind: "missingCredits", courseCode: code });
        continue;
      }

      const distinct = [
        ...new Set(values.filter((value): value is number => value !== null)),
      ];
      if (distinct.length !== 1) {
        uncertainties.push({
          kind: "conflictingCredits",
          courseCode: code,
          reportedCredits: distinct,
        });
        continue;
      }

      earnedCredits += distinct[0];
      countedCourseCodes.push(code);
      continue;
    }

    const transfer = records.find(
      ({ completion, credit }) =>
        completion === "policyRequired" ||
        credit.eligibility === "policyRequired",
    );
    if (transfer) {
      uncertainties.push({
        kind: "transferPolicyRequired",
        courseCode: code,
        reportedCredits: transfer.credit.reportedCredits,
      });
    }
  }

  const status: MinimumCreditEvaluationStatus =
    earnedCredits >= rule.minCredits
      ? "met"
      : uncertainties.length > 0
        ? "indeterminate"
        : earnedCredits > 0
          ? "partial"
          : "unmet";

  return { status, earnedCredits, countedCourseCodes, uncertainties };
}
