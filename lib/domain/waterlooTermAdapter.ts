import {
  type TermId,
  type TermInfo,
  type TermSeason,
  termInfo,
} from "../terms";
import type { AcademicTerm } from "./academicTerm";

const WATERLOO_TERM = {
  Winter: "winter",
  Spring: "spring",
  Fall: "fall",
} as const satisfies Record<TermSeason, string>;

export type WaterlooTerm = (typeof WATERLOO_TERM)[keyof typeof WATERLOO_TERM];

/** Preserve the calendar year encoded by the legacy UW term identifier. */
export function waterlooTermToAcademicTerm(
  term: Pick<TermInfo, "year" | "season">,
): AcademicTerm<WaterlooTerm> {
  return {
    calendarYear: term.year,
    term: WATERLOO_TERM[term.season],
  };
}

/** Decode a legacy UWFlow term ID at the domain boundary. */
export function waterlooTermIdToAcademicTerm(
  termId: TermId,
): AcademicTerm<WaterlooTerm> | null {
  const term = termInfo(termId);
  return term ? waterlooTermToAcademicTerm(term) : null;
}
