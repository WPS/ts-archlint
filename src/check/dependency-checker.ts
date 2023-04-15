import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription, Artifact} from "../describe/architecture-description";
import {PathMatcher} from "../match/path-matcher";

export class ArtifactDependencyChecker implements DependencyChecker {
    constructor(private description: ArchitectureDescription) {
    }

    check(from: string, to: string): DependencyViolation | undefined {
        return undefined
    }

    private findArtifact(path: string): Artifact | undefined {
        for (const key of Object.keys(this.description)) {
            const artifact: Artifact = this.description[key]


        }

        return undefined
    }

    private matchesArtifact(path: string, artifact: Artifact | undefined): boolean {
        if (artifact == null) {
            return false
        }

        if (PathMatcher.matchesAny(path, artifact.exclude)) {
            return false
        }

        const children: Artifact[] = Object.values(artifact.children || {})

        if (children.some(it => this.matchesArtifact(path, it))) {
            return false
        }

        if (PathMatcher.matchesAny(path, artifact.include)) {
            return true
        }
    }
}

export interface DependencyChecker {
    check(from: string, to: string): DependencyViolation | undefined
}