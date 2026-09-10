import type { CatalogCourse } from "../../courses/types";
import { type Program, TERM_LETTERS } from "../../programs";
import type { RuleNode } from "../../requirements/types";
import type { CourseDefinition } from "../courseDefinition";
import type { CurriculumProgram } from "../curriculumProgram";

export const WATERLOO_INSTITUTION_ID = "uwaterloo";

export function waterlooCatalogCourseToCourseDefinition(
  course: CatalogCourse,
): CourseDefinition {
  return {
    id: String(course.id),
    code: course.code,
    name: course.name,
    credits: course.units ?? null,
  };
}

function waterlooProgramRequirements(program: Program): RuleNode {
  if (program.kind === "flexible") return program.rules;

  return {
    kind: "all",
    children: TERM_LETTERS.map((term) => program.terms[term]),
  };
}

export function waterlooProgramToCurriculumProgram(
  id: string,
  program: Program,
): CurriculumProgram {
  return {
    id,
    institutionId: WATERLOO_INSTITUTION_ID,
    name: program.name,
    versionLabel:
      program.catalog?.year ?? program.catalog?.title ?? program.asOf,
    requirements: waterlooProgramRequirements(program),
  };
}
