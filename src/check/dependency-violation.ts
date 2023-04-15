interface ViolationEdge {
    artifact: string
    path: string
}

export interface DependencyViolation {
    from: ViolationEdge & { line: number }
    to: ViolationEdge
}