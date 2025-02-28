import { ArtifactDescription } from './artifact-description';

export type ImportRemaps = {
  [path: string]: string;
};

export interface ArchitectureDescription {
  name: string;
  include?: string[];
  exclude?: string[];
  failOnUnassigned?: boolean;
  tsConfigImportRemaps?: ImportRemaps;
  artifacts: ArtifactDescription[];
}
