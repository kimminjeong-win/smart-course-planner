import type { CourseDefinition, CurriculumProgram, Institution } from "../..";

// Source: 河南师范大学计算机科学与技术专业（师范类）本科人才培养方案，2022版本v12.0。
export const HENAN_NORMAL_UNIVERSITY: Institution = {
  id: "henan-normal-university",
  name: "河南师范大学",
};

// Representative core and restricted-elective rows from the curriculum table.
export const HNU_COMPUTER_SCIENCE_COURSES: CourseDefinition[] = [
  {
    id: "JS010300301",
    code: "JS010300301",
    name: "程序设计基础",
    credits: 3,
  },
  {
    id: "JS010300402",
    code: "JS010300402",
    name: "离散数学",
    credits: 4,
  },
  {
    id: "JS010300503",
    code: "JS010300503",
    name: "数据结构",
    credits: 3,
  },
  {
    id: "JS010300704",
    code: "JS010300704",
    name: "计算机组成原理",
    credits: 3,
  },
  {
    id: "JS010300805",
    code: "JS010300805",
    name: "操作系统",
    credits: 3,
  },
  {
    id: "JS010300904",
    code: "JS010300904",
    name: "算法设计与分析",
    credits: 2,
  },
  {
    id: "JS010800104",
    code: "JS010800104",
    name: "计算机学科课程教学论",
    credits: 2,
  },
  {
    id: "JS030300305",
    code: "JS030300305",
    name: "计算机网络",
    credits: 3,
  },
  {
    id: "JS010500203",
    code: "JS010500203",
    name: "Java程序设计",
    credits: 2,
  },
  {
    id: "JS010500303",
    code: "JS010500303",
    name: "C++程序设计",
    credits: 2,
  },
  {
    id: "JS010500403",
    code: "JS010500403",
    name: "C#程序设计",
    credits: 2,
  },
  {
    id: "JY000900102",
    code: "JY000900102",
    name: "中学生心理辅导",
    credits: 1,
  },
  {
    id: "JY000900202",
    code: "JY000900202",
    name: "学前儿童心理辅导",
    credits: 1,
  },
  {
    id: "JY000900304",
    code: "JY000900304",
    name: "中学生品德发展与道德教育",
    credits: 1,
  },
  {
    id: "JY000900401",
    code: "JY000900401",
    name: "特殊教育概论",
    credits: 0.5,
  },
  {
    id: "JY000900504",
    code: "JY000900504",
    name: "教育政策与法规",
    credits: 1,
  },
  {
    id: "JY000900605",
    code: "JY000900605",
    name: "教师专业发展",
    credits: 2,
  },
  {
    id: "JY000900703",
    code: "JY000900703",
    name: "基础教育改革研究",
    credits: 1,
  },
  {
    id: "JS010900105",
    code: "JS010900105",
    name: "计算机学科教学设计",
    credits: 2,
  },
  {
    id: "JY000901003",
    code: "JY000901003",
    name: "中外基础教育比较",
    credits: 2,
  },
  {
    id: "JY000901106",
    code: "JY000901106",
    name: "教育科研方法",
    credits: 1,
  },
  {
    id: "JY000901206",
    code: "JY000901206",
    name: "中学综合实践活动设计",
    credits: 1,
  },
  {
    id: "JS010900206",
    code: "JS010900206",
    name: "中学信息技术学科课程标准与教材研究",
    credits: 1,
  },
];

const CORE_COURSE_CODES = [
  "JS010300301",
  "JS010300503",
  "JS010300402",
  "JS010300904",
  "JS010300704",
  "JS010300805",
  "JS030300305",
  "JS010800104",
];

// Curriculum table pp. 13-14: the coded teacher-education electives governed
// by the note “教师教育选修课至少选修3学分”. The code-less 360 forum is excluded.
export const HNU_TEACHER_EDUCATION_ELECTIVE_CODES = [
  "JY000900102",
  "JY000900202",
  "JY000900304",
  "JY000900401",
  "JY000900504",
  "JY000900605",
  "JY000900703",
  "JS010900105",
  "JY000901003",
  "JY000901106",
  "JY000901206",
  "JS010900206",
];

export const HNU_COMPUTER_SCIENCE_PROGRAM: CurriculumProgram = {
  id: "computer-science-and-technology-teacher-education-2022-v12",
  institutionId: HENAN_NORMAL_UNIVERSITY.id,
  name: "计算机科学与技术专业（师范类）",
  versionLabel: "2022版本v12.0",
  requirements: {
    kind: "all",
    children: [
      {
        kind: "all",
        description: "专业核心课程",
        children: [{ kind: "courses", courses: CORE_COURSE_CODES }],
      },
      {
        kind: "pick",
        description: "Java/C++/C#程序设计三选一",
        selectMin: 1,
        selectMax: 1,
        children: [
          {
            kind: "courses",
            courses: ["JS010500203", "JS010500303", "JS010500403"],
          },
        ],
      },
      {
        kind: "courseCreditPool",
        description: "教师教育选修课至少选修3学分",
        courses: HNU_TEACHER_EDUCATION_ELECTIVE_CODES,
        minCredits: 3,
      },
    ],
  },
};

/** Conflicting statements retained verbatim instead of choosing one silently. */
export const HNU_CURRICULUM_SOURCE_AMBIGUITIES = [
  {
    id: "professional-elective-credit-total",
    sources: [
      {
        location: "表2 课程结构及学分构成表",
        text: "专业教育课程：选修17学分",
      },
      {
        location: "表3 专业教育课程选修部分备注",
        text: "专业选修课至少选修21学分",
      },
    ],
    disposition: "未编码为可执行毕业规则，等待培养单位确认统计口径。",
  },
] as const;

/** Requirements present in the source but not encoded into the RuleNode fixture. */
export const HNU_RULE_NODE_GAPS = [
  {
    id: "total-graduation-credits",
    sourceText: "学生至少修满170学分方可毕业（含实践48学分）",
    reason: "RuleNode has no institution-wide total-credit rule.",
  },
  {
    id: "professional-elective-credit-pool",
    sourceText: "表2列专业教育课程选修17学分；表3备注专业选修课至少选修21学分",
    reason:
      "The source has a 17/21-credit ambiguity, so no executable threshold is selected.",
  },
  {
    id: "code-less-practice-requirements",
    sourceText: "教育实践6学分；毕业论文（设计）6学分",
    reason:
      "The source assigns no course codes, while courses leaves reference course codes.",
  },
  {
    id: "second-classroom-credit-pool",
    sourceText: "第二课堂包含三类活动，学生修读不低于4学分",
    reason: "The activities are not catalog courses addressable by RuleNode.",
  },
  {
    id: "recommended-semester",
    sourceText: "课程计划表为课程标注建议修读学期",
    reason: "RuleNode has no machine-readable scheduling recommendation.",
  },
  {
    id: "graduation-outcomes",
    sourceText:
      "毕业要求包括师德规范、教育情怀、学科素养、教学能力、班级指导、综合育人、学会反思、沟通合作",
    reason: "These are competency outcomes, not course-completion rules.",
  },
] as const;
