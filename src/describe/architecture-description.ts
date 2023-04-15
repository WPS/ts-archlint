import {Artifact} from "./artifact";

export interface ArchitectureDescription {
    name: string
    exclude?: string[]
    artifacts: Artifact[]
}

