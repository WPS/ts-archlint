export interface ArtifactDescription {
    name: string
    mayUseAllBelow?: true
    mayBeUsedFromAllAbove?: true
    include?: string | string[]
    exclude?: string | string[]
    mayUse?: string | string[]
}