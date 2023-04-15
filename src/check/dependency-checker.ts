import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription, Artifact} from "../describe/architecture-description";
import {Dependency} from "../parse/dependency";
import {PathPattern} from "./path-pattern";

export class DependencyChecker {
    private graph: Map<string, Set<string>>

    constructor(private description: ArchitectureDescription) {
        this.graph = this.buildConnectionGraph(description)
    }

    check(path: string, dependency: Dependency): DependencyViolation | undefined {
        const from = this.findArtifact(path)
        if (!from) {
            return undefined
        }

        const to = this.findArtifact(dependency.path)
        if (!to) {
            return undefined
        }


        if (this.areConnected(from, to)) {
            return undefined
        }

        return {
            from: {
                artifact: from.name,
                path,
                line: dependency.line
            },
            to: {
                artifact: to.name,
                path: dependency.path
            }
        }
    }

    private areConnected(from: Artifact, to: Artifact): boolean {
        const connections = this.graph.get(from.name)
        if (!connections) {
            return false
        }
        return connections.has(to.name)
    }

    private findArtifact(path: string): Artifact | undefined {
        return this.description.artifacts.find(it => this.matchesArtifact(path, it))
    }

    private matchesAny(path: string, patterns: string[] | undefined): boolean {
        return patterns != null && patterns.some(pattern => new PathPattern(pattern).matches(path))
    }

    private matchesArtifact(path: string, artifact: Artifact | undefined): boolean {
        if (artifact == null) {
            return false
        }

        if (this.matchesAny(path, artifact.exclude)) {
            return false
        }

        const children: Artifact[] = Object.values(artifact.children || {})

        if (children.some(it => this.matchesArtifact(path, it))) {
            return false
        }

        if (this.matchesAny(path, artifact.include)) {
            return true
        }
        return false
    }

    private buildConnectionGraph(description: ArchitectureDescription): Map<string, Set<string>> {
        const result = new Map<string, Set<string>>()

        for (const artifact of description.artifacts) {
            const directlyConnected = artifact.connectTo || []
            directlyConnected.push(artifact.name)
            result.set(artifact.name, new Set(directlyConnected))
        }

        return result
    }
}
