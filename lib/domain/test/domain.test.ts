import { describe, expect, it } from "vitest";
import {
  type AcademicTerm,
  type Institution,
  STANDARD_TERMS,
  type StandardTerm,
  waterlooTermIdToAcademicTerm,
  waterlooTermToAcademicTerm,
} from "..";

describe("institution-neutral domain models", () => {
  it("represents an institution by stable identity and display name", () => {
    const institution: Institution = {
      id: "example-university",
      name: "Example University",
    };

    expect(institution).toEqual({
      id: "example-university",
      name: "Example University",
    });
  });

  it("supports study, summer, and practice terms", () => {
    expect(STANDARD_TERMS).toEqual(["first", "second", "summer", "practice"]);

    const term: AcademicTerm<StandardTerm> = {
      calendarYear: 2026,
      term: "practice",
    };
    expect(term).toEqual({ calendarYear: 2026, term: "practice" });
  });
});

describe("Waterloo term adapter", () => {
  it("converts a decoded Waterloo term without leaking TermInfo metadata", () => {
    expect(waterlooTermToAcademicTerm({ year: 2025, season: "Fall" })).toEqual({
      calendarYear: 2025,
      term: "fall",
    });
  });

  it.each([
    [1261, { calendarYear: 2026, term: "winter" }],
    [1265, { calendarYear: 2026, term: "spring" }],
    [1269, { calendarYear: 2026, term: "fall" }],
  ] as const)("converts legacy term ID %i", (termId, expected) => {
    expect(waterlooTermIdToAcademicTerm(termId)).toEqual(expected);
  });

  it("returns null for an invalid legacy term ID", () => {
    expect(waterlooTermIdToAcademicTerm(9999)).toBeNull();
  });
});
