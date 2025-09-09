import { ArtifactDescription } from '../describe/artifact-description'
import { Logger } from '../common/logger'

export class Artifact {
  readonly name: string
  private readonly mayUseArtifacts: string[] = []
  readonly children: Artifact[]

  static createFrom(descriptions: ArtifactDescription[], ancestors: ArtifactDescription[] = []): Artifact[] {
    const artifacts: Artifact[] = descriptions.map(it => new Artifact(it, ancestors))

    for (let i = 0; i < artifacts.length; i++) {
      if (descriptions[i].mayUseAllBelow) {
        Artifact.applyMayUseAllBelow(i, artifacts)
      }

      if (descriptions[i].mayBeUsedFromAllAbove) {
        Artifact.applyMayBeUsedFromAbove(i, artifacts)
      }
    }

    return artifacts
  }

  private static applyMayUseAllBelow(targetIndex: number, result: Artifact[]): void {
    const target = result[targetIndex]

    for (let i = targetIndex + 1; i < result.length; i++) {
      target.allowUsageIncludingChildren(result[i])
    }
  }

  private static applyMayBeUsedFromAbove(targetIndex: number, result: Artifact[]): void {
    const target = result[targetIndex]

    for (let i = targetIndex - 1; i >= 0; i--) {
      result[i].allowUsageIncludingChildren(target)
    }
  }

  private constructor(description: ArtifactDescription, ancestors: ArtifactDescription[]) {
    const parentName = ancestors.map(it => it.name).join('.')

    Logger.debug(`Creating artifact ${description.name} with parent ${parentName}`)

    this.name = this.joinNames(parentName, description.name)
    const mayUse = this.toStringArray(description.mayUse)
    const parentMayUse = ancestors.flatMap(it => this.toStringArray(it.mayUse))

    this.mayUseArtifacts.push(
      this.name,
      ...mayUse,
      ...parentMayUse,
      ...mayUse.map(it => this.joinNames(parentName, it))
    )
    this.children = Artifact.createFrom(description.children || [], [...ancestors, description])
  }

  private joinNames(parentName: string | null, name: string): string {
    return [parentName, name].filter(it => it).join('.')
  }

  mayUse({name}: Artifact): boolean {
    return this.mayUseArtifacts.some(it => name.startsWith(it))
  }

  private allowUsageIncludingChildren(other: Artifact): void {
    if (!this.mayUseArtifacts.includes(other.name)) {
      this.mayUseArtifacts.push(other.name)
    }

    this.children.forEach(it => it.allowUsageIncludingChildren(other))
  }

  private toStringArray(value: string | string[] | undefined): string[] {
    if (!value) {
      return []
    }

    if ((typeof value === 'string')) {
      return [value]
    } else {
      return value
    }
  }
}
