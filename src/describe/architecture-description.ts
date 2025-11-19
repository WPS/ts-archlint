import { ArtifactDescription } from './artifact-description'
import { ImportRemaps } from '../parse/import-remaps'

export type DependencyMapping = { [source: string]: string | string[] }

export interface ArchitectureDescription {
  name: string
  include?: string[]
  exclude?: string[]
  artifacts: ArtifactDescription[]
  failOnUnassigned?: boolean
  ignoreArtifactCycles?: boolean
  ignoreDependencies?: DependencyMapping
  absoluteImportPath?: string
  tsConfigImportRemaps?: ImportRemaps
}
