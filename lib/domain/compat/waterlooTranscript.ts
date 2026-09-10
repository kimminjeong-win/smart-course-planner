import { termLabelToTermId } from "../../terms";
import type {
  ParsedCourse,
  CourseStatus as WaterlooCourseStatus,
} from "../../transcript/types";
import type {
  StudentCourseRecord,
  StudentCourseStatus,
} from "../studentCourseRecord";
import {
  type WaterlooTerm,
  waterlooTermIdToAcademicTerm,
} from "../waterlooTermAdapter";

const DEFINITE_FAILURE_GRADES = new Set(["F", "NCR"]);
const WITHDRAWAL_GRADES = new Set(["W", "WD"]);

function waterlooSkippedStatus(rawGrade: string): StudentCourseStatus {
  const normalizedGrade = rawGrade.trim().toUpperCase();

  if (DEFINITE_FAILURE_GRADES.has(normalizedGrade)) return "failed";
  if (WITHDRAWAL_GRADES.has(normalizedGrade)) return "withdrawn";

  const numericGrade = Number(normalizedGrade);
  if (normalizedGrade !== "" && Number.isFinite(numericGrade)) {
    return numericGrade < 50 ? "failed" : "unknown";
  }

  // Waterloo's legacy "skipped" bucket also contains AU, INC, and DNW.
  // Keeping the raw grade preserves the exact source meaning; the canonical
  // status remains unknown rather than pretending those are all failures.
  return "unknown";
}

function waterlooStatusToStudentCourseStatus(
  status: WaterlooCourseStatus,
  rawGrade: string,
): StudentCourseStatus {
  switch (status) {
    case "passed":
      return "passed";
    case "inProgress":
      return "inProgress";
    case "transfer":
      return "transfer";
    case "skipped":
      return waterlooSkippedStatus(rawGrade);
    case "unrecognized":
      return "unknown";
  }
}

function waterlooTermLabelToAcademicTerm(termLabel: string) {
  const termId = termLabelToTermId(termLabel);
  return termId === null ? null : waterlooTermIdToAcademicTerm(termId);
}

/**
 * Adapt one legacy transcript row without consulting the current catalog.
 * Missing credits and catalog identity remain explicitly unknown.
 */
export function waterlooParsedCourseToStudentCourseRecord(
  course: ParsedCourse,
): StudentCourseRecord<WaterlooTerm> {
  return {
    courseDefinitionId: null,
    courseCode: course.code,
    courseName: course.name,
    credits: null,
    term: waterlooTermLabelToAcademicTerm(course.termLabel),
    rawGrade: course.rawGrade === "" ? null : course.rawGrade,
    status: waterlooStatusToStudentCourseStatus(course.status, course.rawGrade),
  };
}
