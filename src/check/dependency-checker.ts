import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription} from "../describe/architecture-description";
import {Dependency} from "../parse/dependency";
import {Artifact} from "./artifact";
import {PathPattern} from "../assign/path-pattern";
import {CodeFile} from "../parse/code-file";
import {Logger} from "../common/logger";
import {lastOf} from "../common/util";

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
            count += this.checkFile(file, result);
        }

        for (const artifact of this.artifacts) {
            if (artifact.numberOfContainedFiles() === 0) {
                throw new Error(`Empty artifact: ${artifact.name}`)
            }
        }

        Logger.info(`Analyzed ${count} dependencies, found ${result.length} violations`)
        return result
    }

    private checkFile(file: CodeFile, result: DependencyViolation[]): number {
        this.findArtifacts(file.path).forEach(it => it.addFile(file.path))

        let count = 0
        for (const dependency of file.dependencies) {
            const violation = this.checkDependency(file.path, dependency)
            if (violation) {
                result.push(violation)
            }
            count++
        }
        return count;
    }

    checkDependency(filePath: string, dependency: Dependency): DependencyViolation | undefined {
        Logger.debug("Checking " + filePath + " -> " + dependency.path)

        if (this.globalExcludes.some(it => it.matches(filePath) || it.matches(dependency.path))) {
            Logger.debug("Globally excluded -> OK")
            return undefined
        }

        const from = lastOf(this.findArtifacts(filePath))
        if (!from) {
            Logger.debug("Not described -> OK")
            // files that are not described are not checked
            return undefined
        }

        const allConnectedTo = this.findArtifacts(dependency.path).reverse()

        if (allConnectedTo.length === 0) {
            return this.createViolation(filePath, dependency, from)
        }

        for (const to of allConnectedTo) {
            if (from.isConnectedTo(to)) {
                Logger.debug("Connected from " + from.name + " to " + to.name + " -> OK")
                return undefined
            }
        }

        return this.createViolation(filePath, dependency, from, allConnectedTo[0])
    }

    private createViolation(
        path: string,
        dependency: Dependency,
        from: Artifact,
        to?: Artifact
    ): DependencyViolation {
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

    private findArtifacts(path: string): Artifact[] {
        const result: Artifact[] = []
        for (const artifact of this.artifacts) {
            result.push(...artifact.findMatching(path))
        }
        return result
    }
}
