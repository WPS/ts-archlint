interface ViolationEdge {
  artifact: string | null
  path: string
}


export interface DependencyViolation {
  from: ViolationEdge & { line: number, artifact: string }
  to: ViolationEdge
}