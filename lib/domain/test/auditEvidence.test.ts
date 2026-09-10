import { describe, expect, it } from "vitest";
import type { RuleNode } from "../../requirements/types";
import {
  earnedCompletionCourseCodes,
  type StudentCourseRecord,
  studentCourseRecordsToAuditEvidence,
  studentCourseRecordToAuditEvidence,
} from "..";
import { HNU_COMPUTER_SCIENCE_PROGRAM } from "./fixtures/henanNormalComputerScience2022";
import { HNU_SYNTHETIC_STUDENT_COURSE_RECORDS } from "./fixtures/henanNormalSyntheticStudentRecords";

function describedRule(description: string): RuleNode {
  const root = HNU_COMPUTER_SCIENCE_PROGRAM.requirements;
  if (root.kind !== "all") throw new Error("expected fixture all root");
  const rule = root.children.find(
    (child) => "description" in child && child.description === description,
  );
  if (!rule) throw new Error(`missing fixture rule: ${description}`);
  return rule;
}

describe("canonical course audit evidence", () => {
  it.each([
    ["passed", "earned", "eligible"],
    ["failed", "notEarned", "notEligible"],
    ["inProgress", "inProgress", "notEligible"],
    ["transfer", "policyRequired", "policyRequired"],
    ["withdrawn", "notEarned", "notEligible"],
    ["unknown", "notEarned", "notEligible"],
  ] as const)("maps %s to completion %s and credit %s", (status, completion, eligibility) => {
    const sourceRecord: StudentCourseRecord = {
      courseDefinitionId: null,
      courseCode: "TEST101",
      courseName: "Test Course",
      credits: 3,
      term: null,
      rawGrade: null,
      status,
    };

    const evidence = studentCourseRecordToAuditEvidence(sourceRecord);

    expect(evidence.sourceRecord).toBe(sourceRecord);
    expect(evidence.completion).toBe(completion);
    expect(evidence.credit).toEqual({
      eligibility,
      reportedCredits: 3,
    });
  });

  it("keeps transfer identity and unknown credits policy-dependent", () => {
    const transfer = HNU_SYNTHETIC_STUDENT_COURSE_RECORDS.find(
      ({ status }) => status === "transfer",
    );
    if (!transfer) throw new Error("missing synthetic transfer record");

    const evidence = studentCourseRecordToAuditEvidence(transfer);

    expect(evidence.sourceRecord.status).toBe("transfer");
    expect(evidence.completion).toBe("policyRequired");
    expect(evidence.credit).toEqual({
      eligibility: "policyRequired",
      reportedCredits: null,
    });
  });

  it("retains repeat attempts but exposes one earned course-code candidate", () => {
    const repeats = HNU_SYNTHETIC_STUDENT_COURSE_RECORDS.filter(
      ({ courseCode }) => courseCode === "JS010300402",
    );
    const evidence = studentCourseRecordsToAuditEvidence(repeats);

    expect(evidence).toHaveLength(2);
    expect(evidence.map(({ sourceRecord }) => sourceRecord.status)).toEqual([
      "failed",
      "passed",
    ]);
    expect([...earnedCompletionCourseCodes(evidence)]).toEqual(["JS010300402"]);
  });

  it("does not let two passed attempts fill a course requirement twice", () => {
    const passed = HNU_SYNTHETIC_STUDENT_COURSE_RECORDS.find(
      ({ status }) => status === "passed",
    );
    if (!passed) throw new Error("missing synthetic passed record");

    const evidence = studentCourseRecordsToAuditEvidence([passed, passed]);

    expect(evidence).toHaveLength(2);
    expect(earnedCompletionCourseCodes(evidence).size).toBe(1);
  });
});

describe("Henan Normal curriculum evidence compatibility", () => {
  const evidence = studentCourseRecordsToAuditEvidence(
    HNU_SYNTHETIC_STUDENT_COURSE_RECORDS,
  );
  const earnedCodes = earnedCompletionCourseCodes(evidence);

  it("provides earned candidates for the completed subset of core courses", () => {
    const coreGroup = describedRule("专业核心课程");
    if (coreGroup.kind !== "all") throw new Error("expected core all rule");
    const coreCourses = coreGroup.children[0];
    if (coreCourses.kind !== "courses") {
      throw new Error("expected core courses rule");
    }

    expect(coreCourses.courses.filter((code) => earnedCodes.has(code))).toEqual(
      ["JS010300301", "JS010300503", "JS010300402"],
    );
    expect(earnedCodes.has("JS030300305")).toBe(false);
    expect(earnedCodes.has("JS010300704")).toBe(false);
    expect(earnedCodes.has("JS010300904")).toBe(false);
  });

  it("satisfies the Java/C++/C# pick with one earned option", () => {
    const choice = describedRule("Java/C++/C#程序设计三选一");
    if (choice.kind !== "pick") throw new Error("expected pick rule");
    const options = choice.children.flatMap((child) =>
      child.kind === "courses" ? child.courses : [],
    );
    const earnedOptions = options.filter((code) => earnedCodes.has(code));

    expect(earnedOptions).toEqual(["JS010500203"]);
    expect(earnedOptions.length).toBeGreaterThanOrEqual(choice.selectMin ?? 0);
    expect(earnedOptions.length).toBeLessThanOrEqual(
      choice.selectMax ?? Infinity,
    );
  });
});
