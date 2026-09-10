/** Common teaching-period identifiers available to institution-neutral features. */
export const STANDARD_TERMS = [
  "first",
  "second",
  "summer",
  "practice",
] as const;

export type StandardTerm = (typeof STANDARD_TERMS)[number];

/**
 * An institution-labelled teaching period anchored to a calendar year.
 * Institutions may use the standard identifiers or supply their own terms.
 */
export interface AcademicTerm<TTerm extends string = string> {
  calendarYear: number;
  term: TTerm;
}
