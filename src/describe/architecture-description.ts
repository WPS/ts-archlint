import {ArtifactDescription} from "./artifact-description";

export interface ArchitectureDescription {
    name: string
    exclude?: string[]
    artifacts: ArtifactDescription[]
}

