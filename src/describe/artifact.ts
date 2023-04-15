export interface Artifact {
    name: string
    relaxed?: true
    public?: true
    include?: string[]
    exclude?: string[]
    connectTo?: string[]
}