import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription} from "../describe/architecture-description";
import {Dependency} from "../parse/dependency";
import {Artifact} from "./artifact";
import {PathPattern} from "./path-pattern";
import {CodeFile} from "../parse/code-file";

export class DependencyChecker {
    private artifacts: Artifact[]
    private globalExcludes: PathPattern[]

    constructor(private description: ArchitectureDescription) {
        this.artifacts = Artifact.createFrom(description.artifacts)
        this.globalExcludes = (description.exclude || []).map(it => new PathPattern(it))
    }

    checkAll(files: CodeFile[]): DependencyViolation[] {
        console.log(`Checking dependencies against rule ${this.description.name}`)

        const result: DependencyViolation[] = []

        let count = 0
        for (const file of files) {
            for (const dependency of file.dependencies) {
                const violation = this.check(file.path, dependency)
                if (violation) {
                    result.push(violation)
                }
                count++
            }
        }

        console.log(`Analyzed ${count} dependencies, found ${result.length} violations`)
        return result
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
