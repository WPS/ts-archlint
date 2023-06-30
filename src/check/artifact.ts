import {PathPattern} from "./path-pattern";
import {ArtifactDescription} from "../describe/artifact-description";

export class Artifact {
    readonly name: string
    private readonly connectedTo: Set<string>
    private readonly includePatterns: PathPattern[]
    readonly children: Artifact[]

    static createFrom(descriptions: ArtifactDescription[], parentNames: string[] = []): Artifact[] {
        const artifacts: Artifact[] = descriptions.map(it => new Artifact(it, parentNames))

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
            target.connectTo(result[i])
        }
    }

    private static applyMayBeUsedFromAbove(targetIndex: number, result: Artifact[]): void {
        const target = result[targetIndex]

        for (let i = targetIndex - 1; i >= 0; i--) {
            result[i].connectTo(target)
        }
    }

    private constructor(description: ArtifactDescription, parentNames: string[]) {
        this.name = this.toFullName(description.name, parentNames)
        const mayUse = this.toStringArray(description.mayUse)
        this.connectedTo = new Set([...mayUse, ...mayUse.map(it => this.toFullName(it, parentNames))])
        this.connectedTo.add(this.name)

        this.includePatterns = this.toStringArray(description.include).map(it => new PathPattern(it))

        this.children = Artifact.createFrom(description.children || [], [...parentNames, this.name])
    }

    private toFullName(name: string, parentNames: string[]): string {
        return [...parentNames, name].join(".")
    }

    findMatching(path: string): Artifact[] {
        if (!this.includePatterns.some(it => it.matches(path))) {
            return []
        }

        const result: Artifact[] = [this]
        for (const child of this.children) {
            result.push(...child.findMatching(path))
        }
        return result
    }

    isConnectedTo({name}: Artifact): boolean {
        return this.connectedTo.has(name)
    }

    connectTo(artifact: Artifact): void {
        this.connectedTo.add(artifact.name)
        for (const child of artifact.children) {
            this.connectTo(child)
        }

        for (const child of this.children) {
            child.connectTo(artifact)
        }
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