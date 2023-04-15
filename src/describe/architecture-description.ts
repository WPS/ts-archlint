import {Artifact} from "./artifact";

export type ArtifactPath = string

export interface ArchitectureDescription {
    name: string
    artifacts: Artifact[]
}

