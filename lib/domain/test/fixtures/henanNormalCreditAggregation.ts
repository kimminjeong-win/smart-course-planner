import type {
  StandardTerm,
  StudentAchievementRecord,
  StudentCourseRecord,
} from "../..";
import { HNU_COMPUTER_SCIENCE_COURSES } from "./henanNormalComputerScience2022";
import { HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS } from "./henanNormalNonCourseAchievements";
import { HNU_SYNTHETIC_STUDENT_COURSE_RECORDS } from "./henanNormalSyntheticStudentRecords";

const operatingSystems = HNU_COMPUTER_SCIENCE_COURSES.find(
  ({ code }) => code === "JS010300805",
);
if (!operatingSystems) throw new Error("missing HNU operating-systems fixture");

const passedWithUnknownCredits: StudentCourseRecord<StandardTerm> = {
  courseDefinitionId: operatingSystems.id,
  courseCode: operatingSystems.code,
  courseName: operatingSystems.name,
  credits: null,
  term: { calendarYear: 2024, term: "second" },
  rawGrade: "合格",
  status: "passed",
};

/** Synthetic aggregation scenario; it does not describe a real student. */
export const HNU_SYNTHETIC_CREDIT_AGGREGATION_COURSE_RECORDS: StudentCourseRecord<StandardTerm>[] =
  [
    ...HNU_SYNTHETIC_STUDENT_COURSE_RECORDS,
    { ...HNU_SYNTHETIC_STUDENT_COURSE_RECORDS[0] },
    passedWithUnknownCredits,
  ];

/** Synthetic aggregation scenario; the repeated fact models duplicate ingestion. */
export const HNU_SYNTHETIC_CREDIT_AGGREGATION_ACHIEVEMENTS: StudentAchievementRecord<StandardTerm>[] =
  [
    ...HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS,
    HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS[0],
  ];
