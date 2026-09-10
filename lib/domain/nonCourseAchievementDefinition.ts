/** A credit-bearing curriculum item that is not a catalog course. */
export interface NonCourseAchievementDefinition {
  /** Stable curriculum identity; this is not a fabricated course code. */
  id: string;
  name: string;
  /** Fixed curriculum credits, or null when the source does not specify them. */
  credits: number | null;
}
