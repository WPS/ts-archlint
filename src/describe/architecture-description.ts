export type ArtifactPath = string

export interface Artifact {
    name: string
    relaxed?: true
    public?: true
    include?: string[]
    exclude?: string[]
    connectTo?: ArtifactPath[]
    children?: Artifact[]
}

export type ArchitectureDescription = {
    name: string
    artifacts: Artifact[]
}
