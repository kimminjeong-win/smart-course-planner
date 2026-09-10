import { describe, expect, it } from "vitest";
import {
  aggregateEarnedCredits,
  type StandardTerm,
  type StudentAchievementRecord,
  type StudentCourseRecord,
  studentAchievementRecordToCreditEvidence,
  studentCourseRecordsToAuditEvidence,
  studentCourseRecordToAuditEvidence,
} from "..";
import {
  HNU_SYNTHETIC_CREDIT_AGGREGATION_ACHIEVEMENTS,
  HNU_SYNTHETIC_CREDIT_AGGREGATION_COURSE_RECORDS,
} from "./fixtures/henanNormalCreditAggregation";
import { HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS } from "./fixtures/henanNormalNonCourseAchievements";

function courseRecord(
  courseCode: string,
  status: StudentCourseRecord<StandardTerm>["status"],
  credits: number | null,
): StudentCourseRecord<StandardTerm> {
  return {
    courseDefinitionId: courseCode,
    courseCode,
    courseName: `Synthetic ${courseCode}`,
    credits,
    term: null,
    rawGrade: null,
    status,
  };
}

function achievementRecord(
  fields: Partial<StudentAchievementRecord<StandardTerm>> = {},
): StudentAchievementRecord<StandardTerm> {
  return {
    id: "synthetic:achievement:1",
    achievementDefinitionId: "synthetic:achievement",
    achievementName: "Synthetic achievement",
    credits: 6,
    term: null,
    status: "completed",
    ...fields,
  };
}

function aggregate(
  courseRecords: StudentCourseRecord<StandardTerm>[] = [],
  achievementRecords: StudentAchievementRecord<StandardTerm>[] = [],
) {
  return aggregateEarnedCredits({
    courseEvidence: studentCourseRecordsToAuditEvidence(courseRecords),
    nonCourseAchievementEvidence: achievementRecords.map(
      studentAchievementRecordToCreditEvidence,
    ),
  });
}

describe("canonical credit aggregation", () => {
  it("adds two earned courses", () => {
    const result = aggregate([
      courseRecord("TEST101", "passed", 3),
      courseRecord("TEST102", "passed", 2),
    ]);

    expect(result).toEqual({
      knownEarnedCredits: 5,
      contributions: [
        {
          source: "course",
          identity: "course:TEST101",
          courseCode: "TEST101",
          credits: 3,
        },
        {
          source: "course",
          identity: "course:TEST102",
          courseCode: "TEST102",
          credits: 2,
        },
      ],
      uncertainties: [],
    });
  });

  it.each([
    "failed",
    "inProgress",
    "withdrawn",
  ] as const)("does not count a %s course", (status) => {
    expect(aggregate([courseRecord("TEST101", status, 3)])).toMatchObject({
      knownEarnedCredits: 0,
      contributions: [],
      uncertainties: [],
    });
  });

  it("keeps transfer credits policy-dependent", () => {
    expect(aggregate([courseRecord("TEST101", "transfer", 3)])).toEqual({
      knownEarnedCredits: 0,
      contributions: [],
      uncertainties: [
        {
          kind: "transferPolicyRequired",
          courseCode: "TEST101",
          reportedCredits: [3],
        },
      ],
    });
  });

  it("reports a passed course with missing credits without fabricating a value", () => {
    expect(aggregate([courseRecord("TEST101", "passed", null)])).toEqual({
      knownEarnedCredits: 0,
      contributions: [],
      uncertainties: [{ kind: "missingCourseCredits", courseCode: "TEST101" }],
    });
  });

  it("does not choose between conflicting passed course credits", () => {
    expect(
      aggregate([
        courseRecord("TEST101", "passed", 2),
        courseRecord("TEST101", "passed", 3),
      ]),
    ).toEqual({
      knownEarnedCredits: 0,
      contributions: [],
      uncertainties: [
        {
          kind: "conflictingCourseCredits",
          courseCode: "TEST101",
          reportedCredits: [2, 3],
        },
      ],
    });
  });

  it("counts failed then passed once", () => {
    expect(
      aggregate([
        courseRecord("TEST101", "failed", 3),
        courseRecord("TEST101", "passed", 3),
      ]),
    ).toMatchObject({
      knownEarnedCredits: 3,
      contributions: [{ courseCode: "TEST101", credits: 3 }],
      uncertainties: [],
    });
  });

  it("counts repeated identical passes once and reports the policy gap", () => {
    expect(
      aggregate([
        courseRecord("TEST101", "passed", 3),
        courseRecord("TEST101", "passed", 3),
      ]),
    ).toEqual({
      knownEarnedCredits: 3,
      contributions: [
        {
          source: "course",
          identity: "course:TEST101",
          courseCode: "TEST101",
          credits: 3,
        },
      ],
      uncertainties: [
        {
          kind: "repeatedCoursePolicyRequired",
          courseCode: "TEST101",
          attemptCount: 2,
          reportedCredits: 3,
        },
      ],
    });
  });

  it("counts completed educational practice as six earned credits", () => {
    const educationalPractice = HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS[0];

    expect(aggregate([], [educationalPractice])).toMatchObject({
      knownEarnedCredits: 6,
      contributions: [
        {
          source: "nonCourseAchievement",
          achievementDefinitionId: "hnu-2022:educational-practice",
          credits: 6,
        },
      ],
      uncertainties: [],
    });
  });

  it("does not count an in-progress graduation thesis", () => {
    const graduationThesis = HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS[1];

    expect(aggregate([], [graduationThesis])).toMatchObject({
      knownEarnedCredits: 0,
      contributions: [],
      uncertainties: [],
    });
  });

  it("does not count duplicate achievement evidence twice", () => {
    const record = achievementRecord();
    const evidence = studentAchievementRecordToCreditEvidence(record);
    const result = aggregateEarnedCredits({
      courseEvidence: [],
      nonCourseAchievementEvidence: [evidence, evidence],
    });

    expect(result).toMatchObject({
      knownEarnedCredits: 6,
      contributions: [{ identity: evidence.evidenceId, credits: 6 }],
      uncertainties: [],
    });
  });

  it("reports completed achievement credits that remain unknown", () => {
    expect(aggregate([], [achievementRecord({ credits: null })])).toEqual({
      knownEarnedCredits: 0,
      contributions: [],
      uncertainties: [
        {
          kind: "achievementCreditsIndeterminate",
          evidenceId: "nonCourseAchievement:synthetic:achievement:1",
          achievementDefinitionId: "synthetic:achievement",
          reportedCredits: null,
        },
      ],
    });
  });

  it("adds course and non-course earned credits together", () => {
    expect(
      aggregate([courseRecord("TEST101", "passed", 3)], [achievementRecord()]),
    ).toMatchObject({
      knownEarnedCredits: 9,
      contributions: [
        { source: "course", credits: 3 },
        { source: "nonCourseAchievement", credits: 6 },
      ],
    });
  });

  it("retains known HNU credits alongside independent uncertainties", () => {
    const result = aggregate(
      HNU_SYNTHETIC_CREDIT_AGGREGATION_COURSE_RECORDS,
      HNU_SYNTHETIC_CREDIT_AGGREGATION_ACHIEVEMENTS,
    );

    expect(result.knownEarnedCredits).toBe(18);
    expect(result.contributions.map(({ identity }) => identity)).toEqual([
      "course:JS010300301",
      "course:JS010300503",
      "course:JS010300402",
      "course:JS010500203",
      "nonCourseAchievement:synthetic:educational-practice:1",
    ]);
    expect(result.uncertainties.map(({ kind }) => kind)).toEqual([
      "repeatedCoursePolicyRequired",
      "transferPolicyRequired",
      "missingCourseCredits",
    ]);
  });

  it("does not mutate either source evidence collection", () => {
    const courseEvidence = [
      studentCourseRecordToAuditEvidence(courseRecord("TEST101", "passed", 3)),
    ];
    const achievementEvidence = [
      studentAchievementRecordToCreditEvidence(achievementRecord()),
    ];

    aggregateEarnedCredits({
      courseEvidence,
      nonCourseAchievementEvidence: achievementEvidence,
    });

    expect(courseEvidence).toHaveLength(1);
    expect(achievementEvidence).toHaveLength(1);
  });
});
