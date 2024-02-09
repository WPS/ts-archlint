import {PathPattern} from "../assign/path-pattern";
import {ArtifactDescription} from "../describe/artifact-description";
import {Logger} from "../common/logger";

export class Artifact {
    readonly name: string
    private readonly connectedTo: Set<string>
    private readonly includePatterns: PathPattern[]
    readonly children: Artifact[]

    private containedFiles = new Set<string>()

    static createFrom(descriptions: ArtifactDescription[], parentNames: string | null = null): Artifact[] {
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

    private constructor(description: ArtifactDescription, parentName: string | null) {
        Logger.debug(`Creating artifact ${description.name} with parent ${parentName}`)

        this.name = this.joinNames(description.name, parentName)
        const mayUse = this.toStringArray(description.mayUse)
        this.connectedTo = new Set([...mayUse, ...mayUse.map(it => this.joinNames(it, parentName))])
        this.connectedTo.add(this.name)

        this.includePatterns = this.toStringArray(description.include).map(it => new PathPattern(it))

        this.children = Artifact.createFrom(description.children || [], this.name)
    }

    private joinNames(name: string, parentName: string | null): string {
        return [parentName, name].filter(it => it).join(".")
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

    connectTo(other: Artifact): void {
        this.connectedTo.add(other.name)
        for (const otherChild of other.children) {
            this.connectTo(otherChild)
        }

        for (const ownChild of this.children) {
            ownChild.connectTo(other)
        }
    }

    numberOfContainedFiles(): number {
        return this.containedFiles.size
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

    addFile(path: string): void {
        this.containedFiles.add(path)
    }
}