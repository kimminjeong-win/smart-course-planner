import { describe, expect, it } from "vitest";
import type { LocalPlan } from "../../plan/types";
import type { Program } from "../../programs";
import { compileAudit } from "../compile";

const plan: LocalPlan = {
  schemaVersion: 3,
  programIds: ["test"],
  specializationIds: {},
  stream: "regular",
  startTermId: 1239,
  slots: [],
  updatedAt: "2026-09-10T00:00:00.000Z",
};

describe("legacy audit boundary for courseCreditPool", () => {
  it("fails closed instead of treating LocalPlan projections as earned credits", () => {
    const program: Program = {
      kind: "flexible",
      name: "Canonical-only credit pool",
      asOf: "2026",
      rules: {
        kind: "courseCreditPool",
        courses: ["test101"],
        minCredits: 3,
      },
    };

    expect(() => compileAudit(program, plan)).toThrow(
      "courseCreditPool requires canonical earned-credit evidence",
    );
  });
});
