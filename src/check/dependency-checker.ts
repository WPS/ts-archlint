import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription} from "../describe/architecture-description";
import {Dependency} from "../parse/dependency";
import {Artifact} from "./artifact";
import {PathPattern} from "./path-pattern";
import {CodeFile} from "../parse/code-file";
import {Logger} from "../common/logger";

export class DependencyChecker {
    private artifacts: Artifact[]
    private globalExcludes: PathPattern[]

    constructor(private description: ArchitectureDescription) {
        this.artifacts = Artifact.createFrom(description.artifacts)
        this.globalExcludes = (description.exclude || []).map(it => new PathPattern(it))
    }

    checkAll(files: CodeFile[]): DependencyViolation[] {
        Logger.info(`Checking dependencies against rule ${this.description.name}`)

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

        Logger.info(`Analyzed ${count} dependencies, found ${result.length} violations`)
        return result
    }

    check(path: string, dependency: Dependency): DependencyViolation | undefined {
        Logger.debug("Checking " + path + " -> " + dependency.path)

        if (this.globalExcludes.some(it => it.matches(path) || it.matches(dependency.path))) {
            Logger.debug("Globally excluded -> OK")
            return undefined
        }

        const from = this.findArtifact(path)
        if (!from) {
            Logger.debug("Not described -> OK")
            // files that are not described are not checked
            return undefined
        }

        const to = this.findArtifact(dependency.path)

        if (to && from.isConnectedTo(to)) {
            Logger.debug("Connected from " + from.name + " to " + to.name + " -> OK")
            return undefined
        }

        return {
            from: {
                artifact: from.name,
                path,
                line: dependency.line
            },
            to: {
                artifact: to?.name || null,
                path: dependency.path
            }
        }
    }

    private findArtifact(path: string): Artifact | undefined {
        return this.artifacts.find(it => it.matches(path))
    }
}
