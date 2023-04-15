import {ArtifactPath} from "./architecture-description";

export interface Artifact {
    name: string
    relaxed?: true
    public?: true
    include?: string[]
    exclude?: string[]
    connectTo?: ArtifactPath[]
}