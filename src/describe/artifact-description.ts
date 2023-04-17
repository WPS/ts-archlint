export interface ArtifactDescription {
    name: string
    mayUseAllBelow?: true
    mayBeUsedFromAllAbove?: true
    include?: string[]
    exclude?: string[]
    mayUse?: string[]
}