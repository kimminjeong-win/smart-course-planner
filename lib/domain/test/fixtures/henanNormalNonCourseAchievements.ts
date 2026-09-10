import type {
  NonCourseAchievementDefinition,
  StandardTerm,
  StudentAchievementRecord,
} from "../..";

// Source: 河南师范大学计算机科学与技术专业（师范类）2022版培养方案，表3第21页。
export const HNU_NON_COURSE_ACHIEVEMENTS: NonCourseAchievementDefinition[] = [
  {
    id: "hnu-2022:educational-practice",
    name: "教育实践",
    credits: 6,
  },
  {
    id: "hnu-2022:graduation-thesis",
    name: "毕业论文（设计）",
    credits: 6,
  },
];

/** Synthetic facts for compatibility tests; they do not describe a real student. */
export const HNU_SYNTHETIC_STUDENT_ACHIEVEMENTS: StudentAchievementRecord<StandardTerm>[] =
  [
    {
      id: "synthetic:educational-practice:1",
      achievementDefinitionId: "hnu-2022:educational-practice",
      achievementName: "教育实践",
      credits: 6,
      // The source curriculum spans semesters 5-7; no single completion term is inferred.
      term: null,
      status: "completed",
    },
    {
      id: "synthetic:graduation-thesis:1",
      achievementDefinitionId: "hnu-2022:graduation-thesis",
      achievementName: "毕业论文（设计）",
      credits: 6,
      term: { calendarYear: 2025, term: "second" },
      status: "inProgress",
    },
  ];

export const HNU_NON_COURSE_COMPATIBILITY_GAPS = [
  {
    id: "educational-practice-components",
    sourceText:
      "教育实践6学分，由教育实践合见习3周、校内实习2周、校外实习8周、校内研习5周组成",
    disposition: "本轮仅表达顶层固定学分项目；子活动完成度与周数要求尚未建模。",
  },
  {
    id: "second-classroom-activity-pool",
    sourceText:
      "第二课堂含360课外训练6学分、创新创业实践3学分、学科竞赛3学分，学生修读不低于4学分",
    disposition: "这是多类活动的最低学分池，不将其伪装成单个固定学分项目。",
  },
] as const;
