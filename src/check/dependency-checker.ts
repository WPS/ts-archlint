import {DependencyViolation} from "./dependency-violation";
import {ArchitectureDescription} from "../describe/architecture-description";
import {Dependency} from "../parse/dependency";
import {Artifact} from "./artifact";
import {PathPattern} from "../assign/path-pattern";
import {CodeFile} from "../parse/code-file";
import {Logger} from "../common/logger";
import {FileToArtifactAssignment} from "../assign/file-to-artifact-assignment";

export class DependencyChecker {
    private readonly artifactsByNames = new Map<string, Artifact>()
    private globalExcludes: PathPattern[]

    constructor(private description: ArchitectureDescription, private assignment: FileToArtifactAssignment) {
        Artifact.createFrom(description.artifacts).forEach(it => this.addArtifact(it))
        this.globalExcludes = (description.exclude || []).map(it => new PathPattern(it))
    }

    private addArtifact(artifact: Artifact): void {
        this.artifactsByNames.set(artifact.name, artifact)
        for (const child of artifact.children) {
            this.addArtifact(child)
        }
    }

    checkAll(files: CodeFile[]): DependencyViolation[] {
        Logger.info(`Checking dependencies against rule ${this.description.name}`)

        if (this.assignment.getEmptyArtifacts().length > 0) {
            throw new Error(`Empty artifacts: ${this.assignment.getEmptyArtifacts().join(', ')}`)
        }

        const result: DependencyViolation[] = []

        let count = 0
        for (const file of files) {
            count += this.checkFile(file, result);
        }

        Logger.info(`Analyzed ${count} dependencies, found ${result.length} violations`)
        return result
    }

    private checkFile(file: CodeFile, result: DependencyViolation[]): number {
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

        const from = this.findArtifact(filePath)
        if (!from) {
            Logger.debug("Not described -> OK")
            // files that are not described are not checked
            return undefined
        }

        const to = this.findArtifact(dependency.path)

        if (!to) {
            return this.createViolation(filePath, dependency, from)
        }

        if (from.isConnectedTo(to)) {
            Logger.debug(`Connected from ${from.name} to ${to.name} -> OK`)
            return undefined
        }

        return this.createViolation(filePath, dependency, from, to)
    }

    private findArtifact(path: string): Artifact | null {
        const name = this.assignment.findArtifact(path)

        if (!name) {
            return null
        }

        const artifact = this.artifactsByNames.get(name)

        if (!artifact) {
            throw new Error(`Unexpected artifact: '${name}'`)
        }

        return artifact
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
}
