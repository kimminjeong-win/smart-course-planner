import { describe, expect, it } from "vitest";
import type { CatalogCourse } from "../../courses/types";
import { type Program, TERM_LETTERS } from "../../programs";
import type { RuleNode } from "../../requirements/types";
import type { CourseDefinition, CurriculumProgram } from "..";
import {
  WATERLOO_INSTITUTION_ID,
  waterlooCatalogCourseToCourseDefinition,
  waterlooProgramToCurriculumProgram,
} from "../compat/waterlooCurriculum";

const catalogCourse = (units?: number): CatalogCourse => ({
  id: 8605,
  code: "actsc127",
  name: "Introduction to Global Capital Markets",
  prereqs: null,
  coreqs: null,
  antireqs: null,
  rating: null,
  sections: [],
  ...(units === undefined ? {} : { units }),
});

describe("curriculum domain models", () => {
  it("represents a course independently of sections and ratings", () => {
    const course: CourseDefinition = {
      id: "course-1",
      code: "CS101",
      name: "Introduction to Computing",
      credits: 3,
    };

    expect(course).toEqual({
      id: "course-1",
      code: "CS101",
      name: "Introduction to Computing",
      credits: 3,
    });
  });

  it("represents a versioned program with the shared rule tree", () => {
    const requirements: RuleNode = {
      kind: "courses",
      courses: ["cs101"],
    };
    const program: CurriculumProgram = {
      id: "computer-science",
      institutionId: "example-university",
      name: "Computer Science",
      versionLabel: "2025",
      requirements,
    };

    expect(program.requirements).toBe(requirements);
  });
});

describe("Waterloo curriculum compatibility adapter", () => {
  it("maps only stable CatalogCourse fields", () => {
    expect(waterlooCatalogCourseToCourseDefinition(catalogCourse(0.5))).toEqual(
      {
        id: "8605",
        code: "actsc127",
        name: "Introduction to Global Capital Markets",
        credits: 0.5,
      },
    );
  });

  it("preserves an unknown legacy unit value as unknown credits", () => {
    expect(
      waterlooCatalogCourseToCourseDefinition(catalogCourse()).credits,
    ).toBeNull();
  });

  it("maps a flexible Program without copying its requirements tree", () => {
    const rules: RuleNode = {
      kind: "pick",
      selectMin: 1,
      children: [{ kind: "courses", courses: ["cs115", "cs135"] }],
    };
    const legacy: Program = {
      kind: "flexible",
      name: "Computer Science",
      asOf: "2026-07-04",
      catalog: { id: "catalog-id", year: "2026-2027" },
      rules,
    };

    const canonical = waterlooProgramToCurriculumProgram(
      "computer-science",
      legacy,
    );

    expect(canonical).toEqual({
      id: "computer-science",
      institutionId: WATERLOO_INSTITUTION_ID,
      name: "Computer Science",
      versionLabel: "2026-2027",
      requirements: rules,
    });
    expect(canonical.requirements).toBe(rules);
  });

  it("keeps every engineering term rule as an ordered child", () => {
    const termRules = Object.fromEntries(
      TERM_LETTERS.map((term) => [
        term,
        { kind: "courses", courses: [`course-${term}`] } satisfies RuleNode,
      ]),
    ) as Extract<Program, { kind: "engineering" }>["terms"];
    const legacy: Program = {
      kind: "engineering",
      name: "Systems Design Engineering",
      asOf: "2026-07-04",
      terms: termRules,
    };

    const canonical = waterlooProgramToCurriculumProgram("syde", legacy);

    expect(canonical.requirements).toEqual({
      kind: "all",
      children: TERM_LETTERS.map((term) => termRules[term]),
    });
    if (canonical.requirements.kind !== "all") {
      throw new Error("expected an all root");
    }
    for (const [index, term] of TERM_LETTERS.entries()) {
      expect(canonical.requirements.children[index]).toBe(termRules[term]);
    }
  });

  it("falls back to the legacy as-of date when catalog version is absent", () => {
    const legacy: Program = {
      kind: "flexible",
      name: "Mathematics",
      asOf: "2026-07-04",
      rules: { kind: "all", children: [] },
    };

    expect(
      waterlooProgramToCurriculumProgram("mathematics", legacy).versionLabel,
    ).toBe("2026-07-04");
  });
});
