import { describe, expect, it } from "vitest";
import { requiredCoursesIn } from "../../requirements/walk";
import {
  HENAN_NORMAL_UNIVERSITY,
  HNU_COMPUTER_SCIENCE_COURSES,
  HNU_COMPUTER_SCIENCE_PROGRAM,
  HNU_RULE_NODE_GAPS,
} from "./fixtures/henanNormalComputerScience2022";

describe("河南师范大学 2022 版计算机科学与技术（师范类）fixture", () => {
  it("represents the source institution", () => {
    expect(HENAN_NORMAL_UNIVERSITY).toEqual({
      id: "henan-normal-university",
      name: "河南师范大学",
    });
  });

  it("represents real courses as CourseDefinition values", () => {
    expect(HNU_COMPUTER_SCIENCE_COURSES).toContainEqual({
      id: "JS010300503",
      code: "JS010300503",
      name: "数据结构",
      credits: 3,
    });
    expect(HNU_COMPUTER_SCIENCE_COURSES).toContainEqual({
      id: "JS010300402",
      code: "JS010300402",
      name: "离散数学",
      credits: 4,
    });
  });

  it("represents the real curriculum identity and version", () => {
    expect(HNU_COMPUTER_SCIENCE_PROGRAM).toMatchObject({
      institutionId: HENAN_NORMAL_UNIVERSITY.id,
      name: "计算机科学与技术专业（师范类）",
      versionLabel: "2022版本v12.0",
    });
  });

  it("expresses the eight named professional core courses as mandatory", () => {
    expect(
      requiredCoursesIn(HNU_COMPUTER_SCIENCE_PROGRAM.requirements),
    ).toEqual([
      "JS010300301",
      "JS010300402",
      "JS010300503",
      "JS010300704",
      "JS010300805",
      "JS010300904",
      "JS010800104",
      "JS030300305",
    ]);
  });

  it("expresses the real Java/C++/C# three-way restricted elective", () => {
    const root = HNU_COMPUTER_SCIENCE_PROGRAM.requirements;
    expect(root.kind).toBe("all");
    if (root.kind !== "all") throw new Error("expected an all root");

    expect(root.children[1]).toEqual({
      kind: "pick",
      description: "Java/C++/C#程序设计三选一",
      selectMin: 1,
      selectMax: 1,
      children: [
        {
          kind: "courses",
          courses: ["JS010500203", "JS010500303", "JS010500403"],
        },
      ],
    });
  });

  it("records source-proven RuleNode gaps instead of encoding approximations", () => {
    expect(HNU_RULE_NODE_GAPS.map((gap) => gap.id)).toEqual([
      "total-graduation-credits",
      "professional-elective-credit-pool",
      "code-less-practice-requirements",
      "second-classroom-credit-pool",
      "recommended-semester",
      "graduation-outcomes",
    ]);
    expect(
      HNU_RULE_NODE_GAPS.find(
        (gap) => gap.id === "professional-elective-credit-pool",
      )?.sourceText,
    ).toBe("专业选修课至少选修21学分");
  });
});
