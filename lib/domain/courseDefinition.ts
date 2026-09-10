/** Stable course identity and credit value, independent of a scheduled class. */
export interface CourseDefinition {
  id: string;
  code: string;
  name: string;
  /** Null means the source does not provide a reliable credit value. */
  credits: number | null;
}
