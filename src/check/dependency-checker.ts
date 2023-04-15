import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription} from "../describe/architecture-description";
import {Dependency} from "../parse/dependency";
import {PerformantArtifact} from "./performant-artifact";
import {PathPattern} from "./path-pattern";

export class DependencyChecker {
    private artifacts: PerformantArtifact[]
    private globalExcludes: PathPattern[]

    constructor(private description: ArchitectureDescription) {
        this.artifacts = this.compileArtifacts(description)
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

    private findArtifact(path: string): PerformantArtifact | undefined {
        if (this.globalExcludes.some(it => it.matches(path))) {
            return undefined
        }

        return this.artifacts.find(it => it.matches(path))
    }

    private compileArtifacts(description: ArchitectureDescription): PerformantArtifact[] {
        const result = description.artifacts.map(it => new PerformantArtifact(it))

        for (let i = 0; i < result.length; i++) {
            if (description.artifacts[i].relaxed) {
                this.applyRelaxed(i, result)
            }
        }

        return result
    }

    private applyRelaxed(targeIndex: number, result: PerformantArtifact[]): void {
        const target = result[targeIndex]

        for (let i = targeIndex + 1; i < result.length; i++) {
            target.connectTo(result[i])
        }
    }
}
