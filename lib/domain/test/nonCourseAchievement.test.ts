import { describe, expect, it } from "vitest";
import {
  type CourseDefinition,
  type StudentAchievementRecord,
  type StudentCourseRecord,
  studentAchievementRecordsToCreditEvidence,
  studentAchievementRecordToCreditEvidence,
  studentCourseRecordToAuditEvidence,
} from "..";
import { HNU_COMPUTER_SCIENCE_COURSES } from "./fixtures/henanNormalComputerScience2022";
import {
  HNU_NON_COURSE_ACHIEVEMENTS,
  HNU_NON_COURSE_COMPATIBILITY_GAPS,
  HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS,
} from "./fixtures/henanNormalNonCourseAchievements";

function achievementRecord(
  fields: Partial<StudentAchievementRecord> = {},
): StudentAchievementRecord {
  return {
    id: "synthetic:test-achievement:1",
    achievementDefinitionId: "synthetic:test-achievement",
    achievementName: "测试培养环节",
    credits: 6,
    term: null,
    status: "completed",
    ...fields,
  };
}

describe("canonical non-course achievement domain", () => {
  it("represents code-less curriculum items without fabricating CourseDefinition", () => {
    expect(HNU_NON_COURSE_ACHIEVEMENTS).toEqual([
      {
        id: "hnu-2022:educational-practice",
        name: "教育实践",
        credits: 6,
      },
      {
        id: "hnu-2022:graduation-thesis",
        name: "毕业论文（设计）",
        credits: 6,
      },
    ]);
    expect(HNU_NON_COURSE_ACHIEVEMENTS.every((item) => !("code" in item))).toBe(
      true,
    );
    expect(
      HNU_COMPUTER_SCIENCE_COURSES.some(({ name }) =>
        HNU_NON_COURSE_ACHIEVEMENTS.some((item) => item.name === name),
      ),
    ).toBe(false);
  });

  it("keeps coded experiments and course design as CourseDefinition", () => {
    expect(
      HNU_COMPUTER_SCIENCE_COURSES.filter(({ code }) =>
        ["JS010400301", "JS010500602"].includes(code),
      ),
    ).toEqual([
      {
        id: "JS010400301",
        code: "JS010400301",
        name: "程序设计基础实验",
        credits: 1,
      },
      {
        id: "JS010500602",
        code: "JS010500602",
        name: "程序设计基础课程设计",
        credits: 1,
      },
    ]);
  });

  it("keeps curriculum definitions separate from synthetic student facts", () => {
    const definition = HNU_NON_COURSE_ACHIEVEMENTS[0];
    const record = HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS[0];

    expect(record.achievementDefinitionId).toBe(definition.id);
    expect(record).not.toBe(definition);
    expect("status" in definition).toBe(false);

    expect(HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS[1]).toMatchObject({
      achievementDefinitionId: "hnu-2022:graduation-thesis",
      achievementName: "毕业论文（设计）",
      credits: 6,
      status: "inProgress",
    });
  });
});

describe("non-course achievement credit evidence", () => {
  it("emits six earned credits for completed educational practice", () => {
    const record = HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS[0];
    const evidence = studentAchievementRecordToCreditEvidence(record);

    expect(evidence.sourceRecord).toBe(record);
    expect(evidence).toMatchObject({
      evidenceId: "nonCourseAchievement:synthetic:educational-practice:1",
      source: "nonCourseAchievement",
      credit: {
        state: "earned",
        reportedCredits: 6,
        earnedCredits: 6,
      },
    });
  });

  it.each([
    "inProgress",
    "notCompleted",
  ] as const)("does not emit earned credits for %s", (status) => {
    const evidence = studentAchievementRecordToCreditEvidence(
      achievementRecord({ status }),
    );

    expect(evidence.credit).toEqual({
      state: "notEarned",
      reportedCredits: 6,
      earnedCredits: null,
    });
  });

  it("does not fill unknown recorded credits from the curriculum definition", () => {
    const evidence = studentAchievementRecordToCreditEvidence(
      achievementRecord({
        achievementDefinitionId: HNU_NON_COURSE_ACHIEVEMENTS[0].id,
        credits: null,
      }),
    );

    expect(HNU_NON_COURSE_ACHIEVEMENTS[0].credits).toBe(6);
    expect(evidence.credit).toEqual({
      state: "indeterminate",
      reportedCredits: null,
      earnedCredits: null,
    });
  });

  it("projects the same stable achievement identity only once", () => {
    const record = achievementRecord();
    const evidence = studentAchievementRecordsToCreditEvidence([
      record,
      record,
    ]);

    expect(evidence).toHaveLength(1);
    expect(evidence[0].credit.earnedCredits).toBe(6);
  });

  it("keeps existing CourseAuditEvidence semantics unchanged", () => {
    const course: CourseDefinition = {
      id: "TEST101",
      code: "TEST101",
      name: "测试课程",
      credits: 3,
    };
    const record: StudentCourseRecord = {
      courseDefinitionId: course.id,
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      term: null,
      rawGrade: "80",
      status: "passed",
    };

    expect(studentCourseRecordToAuditEvidence(record)).toEqual({
      sourceRecord: record,
      completion: "earned",
      credit: { eligibility: "eligible", reportedCredits: 3 },
    });
  });

  it("retains the composite educational-practice and second-classroom gaps", () => {
    expect(HNU_NON_COURSE_COMPATIBILITY_GAPS.map(({ id }) => id)).toEqual([
      "educational-practice-components",
      "second-classroom-activity-pool",
    ]);
  });
});
