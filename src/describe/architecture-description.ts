import { ArtifactDescription } from './artifact-description'
import { ImportRemaps } from '../common/import-remaps'

export interface ArchitectureDescription {
  name: string;
  include?: string[];
  exclude?: string[];
  failOnUnassigned?: boolean;
  tsConfigImportRemaps?: ImportRemaps;
  artifacts: ArtifactDescription[];
}
