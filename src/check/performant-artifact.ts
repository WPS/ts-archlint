import {PathPattern} from "./path-pattern";
import {Artifact} from "../describe/artifact";

export class PerformantArtifact {
    readonly name: string
    private readonly connectedTo: Set<string>
    private readonly includePatterns: PathPattern[]
    private readonly excludePatterns: PathPattern[]

    constructor(artifact: Artifact) {
        this.name = artifact.name
        this.connectedTo = new Set(artifact.connectTo || [])
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