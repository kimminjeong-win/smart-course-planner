import type { StandardTerm, StudentCourseRecord } from "../..";
import { HNU_COMPUTER_SCIENCE_COURSES } from "./henanNormalComputerScience2022";

function courseRecord(
  courseCode: string,
  fields: Pick<
    StudentCourseRecord<StandardTerm>,
    "rawGrade" | "status" | "term"
  > & { credits?: number | null },
): StudentCourseRecord<StandardTerm> {
  const course = HNU_COMPUTER_SCIENCE_COURSES.find(
    ({ code }) => code === courseCode,
  );
  if (!course) throw new Error(`Unknown HNU fixture course: ${courseCode}`);

  return {
    courseDefinitionId: course.id,
    courseCode: course.code,
    courseName: course.name,
    credits: fields.credits === undefined ? course.credits : fields.credits,
    term: fields.term,
    rawGrade: fields.rawGrade,
    status: fields.status,
  };
}

/** Synthetic records for model compatibility tests; they do not describe a real student. */
export const HNU_SYNTHETIC_STUDENT_COURSE_RECORDS: StudentCourseRecord<StandardTerm>[] =
  [
    courseRecord("JS010300301", {
      term: { calendarYear: 2022, term: "first" },
      rawGrade: "82",
      status: "passed",
    }),
    courseRecord("JS010300503", {
      term: { calendarYear: 2023, term: "first" },
      rawGrade: "78",
      status: "passed",
    }),
    courseRecord("JS010300402", {
      term: { calendarYear: 2022, term: "second" },
      rawGrade: "48",
      status: "failed",
    }),
    courseRecord("JS010300402", {
      term: { calendarYear: 2023, term: "second" },
      rawGrade: "75",
      status: "passed",
    }),
    courseRecord("JS010500203", {
      term: { calendarYear: 2023, term: "second" },
      rawGrade: "良好",
      status: "passed",
    }),
    courseRecord("JS030300305", {
      term: { calendarYear: 2024, term: "first" },
      rawGrade: null,
      status: "inProgress",
    }),
    courseRecord("JS010300704", {
      credits: null,
      term: null,
      rawGrade: "转入",
      status: "transfer",
    }),
    courseRecord("JS010300904", {
      term: { calendarYear: 2024, term: "first" },
      rawGrade: "退课",
      status: "withdrawn",
    }),
  ];
