import type { CourseAuditEvidence } from "./courseEvidence";
import type { NonCourseAchievementCreditEvidence } from "./nonCourseAchievementEvidence";

export interface CreditAggregationInput<
  TCourseTerm extends string = string,
  TAchievementTerm extends string = string,
> {
  courseEvidence: readonly CourseAuditEvidence<TCourseTerm>[];
  nonCourseAchievementEvidence: readonly NonCourseAchievementCreditEvidence<TAchievementTerm>[];
}

export type CreditContribution =
  | {
      source: "course";
      identity: string;
      courseCode: string;
      credits: number;
    }
  | {
      source: "nonCourseAchievement";
      identity: string;
      achievementRecordId: string;
      achievementDefinitionId: string;
      credits: number;
    };

export type CreditAggregationUncertainty =
  | {
      kind: "missingCourseCredits";
      courseCode: string;
    }
  | {
      kind: "conflictingCourseCredits";
      courseCode: string;
      reportedCredits: number[];
    }
  | {
      kind: "repeatedCoursePolicyRequired";
      courseCode: string;
      attemptCount: number;
      reportedCredits: number;
    }
  | {
      kind: "transferPolicyRequired";
      courseCode: string;
      reportedCredits: (number | null)[];
    }
  | {
      kind: "achievementCreditsIndeterminate";
      evidenceId: string;
      achievementDefinitionId: string;
      reportedCredits: number | null;
    }
  | {
      kind: "conflictingAchievementEvidence";
      evidenceId: string;
    };

export interface CreditAggregationResult {
  knownEarnedCredits: number;
  contributions: CreditContribution[];
  uncertainties: CreditAggregationUncertainty[];
}

function achievementEvidenceSignature<TTerm extends string>(
  evidence: NonCourseAchievementCreditEvidence<TTerm>,
): string {
  const { sourceRecord, credit } = evidence;
  return JSON.stringify({
    achievementDefinitionId: sourceRecord.achievementDefinitionId,
    achievementName: sourceRecord.achievementName,
    credits: sourceRecord.credits,
    term: sourceRecord.term,
    status: sourceRecord.status,
    credit,
  });
}

/**
 * Sum only credits confirmed by canonical evidence.
 * Existing evidence is grouped conservatively and remains unchanged.
 */
export function aggregateEarnedCredits<
  TCourseTerm extends string,
  TAchievementTerm extends string,
>(
  input: CreditAggregationInput<TCourseTerm, TAchievementTerm>,
): CreditAggregationResult {
  const contributions: CreditContribution[] = [];
  const uncertainties: CreditAggregationUncertainty[] = [];
  const courseEvidenceByCode = new Map<
    string,
    CourseAuditEvidence<TCourseTerm>[]
  >();

  for (const item of input.courseEvidence) {
    const code = item.sourceRecord.courseCode;
    const records = courseEvidenceByCode.get(code);
    if (records) records.push(item);
    else courseEvidenceByCode.set(code, [item]);
  }

  for (const [courseCode, evidence] of courseEvidenceByCode) {
    const policyRequired = evidence.filter(
      ({ completion, credit }) =>
        completion === "policyRequired" ||
        credit.eligibility === "policyRequired",
    );
    if (policyRequired.length > 0) {
      uncertainties.push({
        kind: "transferPolicyRequired",
        courseCode,
        reportedCredits: [
          ...new Set(
            policyRequired.map(({ credit }) => credit.reportedCredits),
          ),
        ],
      });
    }

    const earned = evidence.filter(
      ({ completion, credit }) =>
        completion === "earned" && credit.eligibility === "eligible",
    );
    if (earned.length === 0) continue;

    const reportedCredits = earned.map(({ credit }) => credit.reportedCredits);
    if (reportedCredits.some((credits) => credits === null)) {
      uncertainties.push({ kind: "missingCourseCredits", courseCode });
      continue;
    }

    const distinctCredits = [
      ...new Set(
        reportedCredits.filter(
          (credits): credits is number => credits !== null,
        ),
      ),
    ];
    if (distinctCredits.length !== 1) {
      uncertainties.push({
        kind: "conflictingCourseCredits",
        courseCode,
        reportedCredits: distinctCredits,
      });
      continue;
    }

    const credits = distinctCredits[0];
    contributions.push({
      source: "course",
      identity: `course:${courseCode}`,
      courseCode,
      credits,
    });

    if (earned.length > 1) {
      uncertainties.push({
        kind: "repeatedCoursePolicyRequired",
        courseCode,
        attemptCount: earned.length,
        reportedCredits: credits,
      });
    }
  }

  const achievementEvidenceById = new Map<
    string,
    NonCourseAchievementCreditEvidence<TAchievementTerm>[]
  >();
  for (const item of input.nonCourseAchievementEvidence) {
    const records = achievementEvidenceById.get(item.evidenceId);
    if (records) records.push(item);
    else achievementEvidenceById.set(item.evidenceId, [item]);
  }

  for (const [evidenceId, evidence] of achievementEvidenceById) {
    const signatures = new Set(evidence.map(achievementEvidenceSignature));
    if (signatures.size !== 1) {
      uncertainties.push({
        kind: "conflictingAchievementEvidence",
        evidenceId,
      });
      continue;
    }

    const item = evidence[0];
    if (item.credit.state === "notEarned") continue;

    if (
      item.credit.state === "indeterminate" ||
      item.credit.earnedCredits === null ||
      item.credit.earnedCredits !== item.credit.reportedCredits
    ) {
      uncertainties.push({
        kind: "achievementCreditsIndeterminate",
        evidenceId,
        achievementDefinitionId: item.sourceRecord.achievementDefinitionId,
        reportedCredits: item.credit.reportedCredits,
      });
      continue;
    }

    contributions.push({
      source: "nonCourseAchievement",
      identity: evidenceId,
      achievementRecordId: item.sourceRecord.id,
      achievementDefinitionId: item.sourceRecord.achievementDefinitionId,
      credits: item.credit.earnedCredits,
    });
  }

  return {
    knownEarnedCredits: contributions.reduce(
      (total, contribution) => total + contribution.credits,
      0,
    ),
    contributions,
    uncertainties,
  };
}
