import type { RuleNode } from "../requirements/types";

/** A versioned curriculum whose requirements can be audited as a rule tree. */
export interface CurriculumProgram {
  id: string;
  institutionId: string;
  name: string;
  versionLabel: string;
  requirements: RuleNode;
}
