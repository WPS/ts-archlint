import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription} from "../describe/architecture-description";
import {Dependency} from "../parse/dependency";
import {Artifact} from "./artifact";
import {PathPattern} from "./path-pattern";

export class DependencyChecker {
    private artifacts: Artifact[]
    private globalExcludes: PathPattern[]

    constructor(private description: ArchitectureDescription) {
        this.artifacts = Artifact.createFrom(description.artifacts)
        this.globalExcludes = (description.exclude || []).map(it => new PathPattern(it))
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


        if (from.isConnectedTo(to)) {
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

    private findArtifact(path: string): Artifact | undefined {
        if (this.globalExcludes.some(it => it.matches(path))) {
            return undefined
        }

        return this.artifacts.find(it => it.matches(path))
    }
}
