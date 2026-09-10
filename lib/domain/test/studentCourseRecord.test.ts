import { describe, expect, it } from "vitest";
import type { ParsedCourse } from "../../transcript/types";
import type { StudentCourseRecord } from "..";
import { waterlooParsedCourseToStudentCourseRecord } from "../compat/waterlooTranscript";

function parsedCourse(overrides: Partial<ParsedCourse> = {}): ParsedCourse {
  return {
    code: "cs135",
    name: "Designing Functional Programs 0.50 0.50 85",
    termLabel: "Fall 2023",
    status: "passed",
    rawGrade: "85",
    ...overrides,
  };
}

describe("StudentCourseRecord", () => {
  it("preserves non-numeric grade notation without requiring a catalog match", () => {
    const record: StudentCourseRecord<"first"> = {
      courseDefinitionId: null,
      courseCode: "JSJ101",
      courseName: "计算机导论",
      credits: 2,
      term: { calendarYear: 2025, term: "first" },
      rawGrade: "优秀",
      status: "passed",
    };

    expect(record.rawGrade).toBe("优秀");
    expect(record.courseDefinitionId).toBeNull();
  });

  it("allows repeated attempts to coexist without domain-level deduplication", () => {
    const attempts: StudentCourseRecord[] = [
      {
        courseDefinitionId: "course-1",
        courseCode: "CS101",
        courseName: "Introduction to Computing",
        credits: 3,
        term: { calendarYear: 2024, term: "first" },
        rawGrade: "45",
        status: "failed",
      },
      {
        courseDefinitionId: "course-1",
        courseCode: "CS101",
        courseName: "Introduction to Computing",
        credits: 3,
        term: { calendarYear: 2025, term: "first" },
        rawGrade: "78",
        status: "passed",
      },
    ];

    expect(attempts).toHaveLength(2);
    expect(attempts.map(({ status }) => status)).toEqual(["failed", "passed"]);
  });
});

describe("Waterloo transcript compatibility adapter", () => {
  it("preserves a passing row and converts a recognized Waterloo term", () => {
    expect(waterlooParsedCourseToStudentCourseRecord(parsedCourse())).toEqual({
      courseDefinitionId: null,
      courseCode: "cs135",
      courseName: "Designing Functional Programs 0.50 0.50 85",
      credits: null,
      term: { calendarYear: 2023, term: "fall" },
      rawGrade: "85",
      status: "passed",
    });
  });

  it.each([
    ["49", "failed"],
    ["F", "failed"],
    ["NCR", "failed"],
    ["W", "withdrawn"],
    ["WD", "withdrawn"],
    ["AU", "unknown"],
    ["INC", "unknown"],
    ["DNW", "unknown"],
  ] as const)("maps a skipped %s grade to %s", (rawGrade, status) => {
    expect(
      waterlooParsedCourseToStudentCourseRecord(
        parsedCourse({ status: "skipped", rawGrade }),
      ).status,
    ).toBe(status);
  });

  it("maps an in-progress row and represents its absent grade as null", () => {
    const record = waterlooParsedCourseToStudentCourseRecord(
      parsedCourse({ status: "inProgress", rawGrade: "" }),
    );

    expect(record.status).toBe("inProgress");
    expect(record.rawGrade).toBeNull();
  });

  it("keeps transfer credit while leaving its non-academic term unknown", () => {
    const record = waterlooParsedCourseToStudentCourseRecord(
      parsedCourse({
        termLabel: "Transfer Credit",
        status: "transfer",
        rawGrade: "TR",
      }),
    );

    expect(record.status).toBe("transfer");
    expect(record.term).toBeNull();
    expect(record.rawGrade).toBe("TR");
  });

  it("does not guess an unrecognized term", () => {
    expect(
      waterlooParsedCourseToStudentCourseRecord(
        parsedCourse({ termLabel: "Historical record" }),
      ).term,
    ).toBeNull();
  });

  it("maps a legacy unrecognized result to unknown without dropping it", () => {
    const record = waterlooParsedCourseToStudentCourseRecord(
      parsedCourse({
        code: "legacy999",
        status: "unrecognized",
        rawGrade: "XYZ",
      }),
    );

    expect(record.courseCode).toBe("legacy999");
    expect(record.status).toBe("unknown");
    expect(record.rawGrade).toBe("XYZ");
    expect(record.credits).toBeNull();
  });
});
