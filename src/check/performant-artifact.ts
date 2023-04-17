import {PathPattern} from "./path-pattern";
import {Artifact} from "../describe/artifact";

export class PerformantArtifact {
    readonly name: string
    private readonly connectedTo: Set<string>
    private readonly includePatterns: PathPattern[]
    private readonly excludePatterns: PathPattern[]

    static createFrom(artifacts: Artifact[]): PerformantArtifact[] {
        const result = artifacts.map(it => new PerformantArtifact(it))

        for (let i = 0; i < result.length; i++) {
            if (artifacts[i].mayUseAllBelow) {
                PerformantArtifact.applyMayUseAllBelow(i, result)
            }

            if (artifacts[i].mayBeUsedFromAllAbove) {
                PerformantArtifact.applyMayBeUsedFromAbove(i, result)
            }
        }

        return result
    }

    private static applyMayUseAllBelow(targeIndex: number, result: PerformantArtifact[]): void {
        const target = result[targeIndex]

        for (let i = targeIndex + 1; i < result.length; i++) {
            target.connectTo(result[i])
        }
    }

    private static applyMayBeUsedFromAbove(targeIndex: number, result: PerformantArtifact[]): void {
        const target = result[targeIndex]

        for (let i = targeIndex - 1; i >= 0; i--) {
            result[i].connectTo(target)
        }
    }

    private constructor(artifact: Artifact) {
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

    isConnectedTo({name}: PerformantArtifact): boolean {
        return this.connectedTo.has(name)
    }

    connectTo(artifact: PerformantArtifact): void {
        this.connectedTo.add(artifact.name)
    }
}