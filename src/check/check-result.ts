import { DependencyViolation } from './dependency-violation'
import { FileToArtifactAssignment } from '../assign/file-to-artifact-assignment'

export type CheckResult = Readonly<{
  architectureName: string
  violations: DependencyViolation[]
  failedBecauseUnassigned: boolean
  assignment: FileToArtifactAssignment
}>
