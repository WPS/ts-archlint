export interface ArtifactDescription {
  name: string
  mayUseAllBelow?: true
  mayBeUsedFromAllAbove?: true
  include?: string | string[]
  mayUse?: string | string[]
  children?: ArtifactDescription[]
}