import {PathPattern} from "./path-pattern";
import {ArtifactDescription} from "../describe/artifact-description";

export class Artifact {
    readonly name: string
    private readonly connectedTo: Set<string>
    private readonly includePatterns: PathPattern[]
    private readonly excludePatterns: PathPattern[]

    static createFrom(artifacts: ArtifactDescription[]): Artifact[] {
        const result = artifacts.map(it => new Artifact(it))

        for (let i = 0; i < result.length; i++) {
            if (artifacts[i].mayUseAllBelow) {
                Artifact.applyMayUseAllBelow(i, result)
            }

            if (artifacts[i].mayBeUsedFromAllAbove) {
                Artifact.applyMayBeUsedFromAbove(i, result)
            }
        }

        return result
    }

    private static applyMayUseAllBelow(targeIndex: number, result: Artifact[]): void {
        const target = result[targeIndex]

        for (let i = targeIndex + 1; i < result.length; i++) {
            target.connectTo(result[i])
        }
    }

    private static applyMayBeUsedFromAbove(targeIndex: number, result: Artifact[]): void {
        const target = result[targeIndex]

        for (let i = targeIndex - 1; i >= 0; i--) {
            result[i].connectTo(target)
        }
    }

    private constructor(artifact: ArtifactDescription) {
        this.name = artifact.name
        this.connectedTo = new Set(artifact.mayUse || [])
        this.connectedTo.add(artifact.name)

        this.includePatterns = (artifact.include || []).map(it => new PathPattern(it))
        this.excludePatterns = (artifact.exclude || []).map(it => new PathPattern(it))
    }

    matches(path: string): boolean {
        if (this.excludePatterns.some(it => it.matches(path))) {
            return false
        }

        if (this.includePatterns.some(it => it.matches(path))) {
            return true
        }
        return false
    }

    isConnectedTo({name}: Artifact): boolean {
        return this.connectedTo.has(name)
    }

    connectTo(artifact: Artifact): void {
        this.connectedTo.add(artifact.name)
    }
}