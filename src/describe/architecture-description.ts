import {PathPattern} from "../match/path-pattern";

export type ArtifactPath = string

export interface Artifact {
    relaxed?: true
    public?: true
    include?: PathPattern[]
    exclude?: PathPattern[]
    connectTo?: ArtifactPath[]
    children: { [artifactName: string]: Artifact }
}

export type ArchitectureDescription = {
    name: string
    artifacts: Artifact[]
}
