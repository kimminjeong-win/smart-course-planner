import { describe, expect, it } from "vitest";
import { describeRule } from "../describe";
import { type RuleNode, RuleNodeSchema } from "../types";
import { requiredCoursesIn, walkRule } from "../walk";

const creditPool = {
  kind: "courseCreditPool",
  courses: ["A101", "B202"],
  minCredits: 3,
} as const satisfies RuleNode;

describe("courseCreditPool requirement", () => {
  it("validates an explicit course set and positive credit threshold", () => {
    expect(RuleNodeSchema.safeParse(creditPool).success).toBe(true);
    expect(
      RuleNodeSchema.safeParse({ ...creditPool, minCredits: 0 }).success,
    ).toBe(false);
  });

  it("describes the credit dimension rather than a course count", () => {
    expect(describeRule(creditPool)).toBe(
      "Complete at least 3 credits from the following courses",
    );
  });

  it("composes recursively without making every pool option mandatory", () => {
    const tree: RuleNode = {
      kind: "all",
      children: [
        { kind: "courses", courses: ["CORE100"] },
        {
          kind: "pick",
          selectMin: 1,
          children: [creditPool, { kind: "courses", courses: ["ALT100"] }],
        },
      ],
    };
    const visited: RuleNode["kind"][] = [];

    walkRule(tree, (node) => visited.push(node.kind));

    expect(visited).toEqual([
      "all",
      "courses",
      "pick",
      "courseCreditPool",
      "courses",
    ]);
    expect(requiredCoursesIn(tree)).toEqual(["CORE100"]);
  });
});
