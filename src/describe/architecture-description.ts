import {ArtifactDescription} from './artifact-description'

export interface ArchitectureDescription {
  name: string
  include?: string[]
  exclude?: string[]
  failOnUnassigned?: boolean
  artifacts: ArtifactDescription[]
}