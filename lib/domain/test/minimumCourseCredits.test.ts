import { describe, expect, it } from "vitest";
import type { RuleNode } from "../../requirements/types";
import {
  evaluateMinimumCourseCredits,
  type StandardTerm,
  type StudentCourseRecord,
  studentCourseRecordsToAuditEvidence,
} from "..";
import {
  HNU_COMPUTER_SCIENCE_COURSES,
  HNU_COMPUTER_SCIENCE_PROGRAM,
  HNU_CURRICULUM_SOURCE_AMBIGUITIES,
  HNU_TEACHER_EDUCATION_ELECTIVE_CODES,
} from "./fixtures/henanNormalComputerScience2022";

function teacherEducationRule(): Extract<
  RuleNode,
  { kind: "courseCreditPool" }
> {
  const root = HNU_COMPUTER_SCIENCE_PROGRAM.requirements;
  if (root.kind !== "all") throw new Error("expected fixture all root");
  const rule = root.children.find((node) => node.kind === "courseCreditPool");
  if (!rule) throw new Error("missing teacher-education credit pool");
  return rule;
}

function record(
  courseCode: string,
  status: StudentCourseRecord<StandardTerm>["status"] = "passed",
  credits?: number | null,
): StudentCourseRecord<StandardTerm> {
  const course = HNU_COMPUTER_SCIENCE_COURSES.find(
    ({ code }) => code === courseCode,
  );
  if (!course) throw new Error(`missing HNU course: ${courseCode}`);
  return {
    courseDefinitionId: course.id,
    courseCode: course.code,
    courseName: course.name,
    credits: credits === undefined ? course.credits : credits,
    term: { calendarYear: 2024, term: "first" },
    rawGrade: status === "passed" ? "80" : null,
    status,
  };
}

function evaluate(records: StudentCourseRecord<StandardTerm>[]) {
  return evaluateMinimumCourseCredits(
    teacherEducationRule(),
    studentCourseRecordsToAuditEvidence(records),
  );
}

describe("河南师大教师教育选修最低学分", () => {
  it("uses the twelve coded courses and the source-stated three-credit threshold", () => {
    const rule = teacherEducationRule();

    expect(rule.courses).toEqual(HNU_TEACHER_EDUCATION_ELECTIVE_CODES);
    expect(rule.minCredits).toBe(3);
    expect(rule.description).toBe("教师教育选修课至少选修3学分");
  });

  it("is unmet with zero earned credits", () => {
    expect(evaluate([])).toMatchObject({ status: "unmet", earnedCredits: 0 });
  });

  it("is partial below the threshold", () => {
    expect(evaluate([record("JY000900401")])).toMatchObject({
      status: "partial",
      earnedCredits: 0.5,
    });
  });

  it("is met exactly at three credits", () => {
    expect(
      evaluate([record("JY000900605"), record("JY000900102")]),
    ).toMatchObject({ status: "met", earnedCredits: 3 });
  });

  it("remains met above three credits", () => {
    expect(
      evaluate([record("JY000900605"), record("JS010900105")]),
    ).toMatchObject({ status: "met", earnedCredits: 4 });
  });

  it.each([
    "failed",
    "inProgress",
    "withdrawn",
    "unknown",
  ] as const)("does not count a %s record", (status) => {
    expect(evaluate([record("JY000900605", status)])).toMatchObject({
      status: "unmet",
      earnedCredits: 0,
    });
  });

  it("counts only the passed attempt after a failed attempt", () => {
    expect(
      evaluate([
        record("JY000900605", "failed"),
        record("JY000900605", "passed"),
      ]),
    ).toMatchObject({
      status: "partial",
      earnedCredits: 2,
      countedCourseCodes: ["JY000900605"],
    });
  });

  it("does not count two passed attempts twice", () => {
    expect(
      evaluate([
        record("JY000900605", "passed"),
        record("JY000900605", "passed"),
      ]),
    ).toMatchObject({
      status: "partial",
      earnedCredits: 2,
      countedCourseCodes: ["JY000900605"],
    });
  });

  it("does not auto-count transfer credit even when it reports a number", () => {
    expect(evaluate([record("JY000900605", "transfer", 2)])).toEqual({
      status: "indeterminate",
      earnedCredits: 0,
      countedCourseCodes: [],
      uncertainties: [
        {
          kind: "transferPolicyRequired",
          courseCode: "JY000900605",
          reportedCredits: 2,
        },
      ],
    });
  });

  it("does not fill a null credit value from CourseDefinition", () => {
    expect(evaluate([record("JY000900605", "passed", null)])).toEqual({
      status: "indeterminate",
      earnedCredits: 0,
      countedCourseCodes: [],
      uncertainties: [{ kind: "missingCredits", courseCode: "JY000900605" }],
    });
  });

  it("does not choose silently between conflicting passed credit values", () => {
    expect(
      evaluate([
        record("JY000900605", "passed", 1),
        record("JY000900605", "passed", 2),
      ]),
    ).toEqual({
      status: "indeterminate",
      earnedCredits: 0,
      countedCourseCodes: [],
      uncertainties: [
        {
          kind: "conflictingCredits",
          courseCode: "JY000900605",
          reportedCredits: [1, 2],
        },
      ],
    });
  });

  it("retains the professional-elective 17/21-credit source ambiguity", () => {
    expect(HNU_CURRICULUM_SOURCE_AMBIGUITIES).toEqual([
      {
        id: "professional-elective-credit-total",
        sources: [
          {
            location: "表2 课程结构及学分构成表",
            text: "专业教育课程：选修17学分",
          },
          {
            location: "表3 专业教育课程选修部分备注",
            text: "专业选修课至少选修21学分",
          },
        ],
        disposition: "未编码为可执行毕业规则，等待培养单位确认统计口径。",
      },
    ]);
  });
});
