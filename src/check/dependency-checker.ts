import {DependencyViolation} from './dependency-violation'
import {ArchitectureDescription} from '../describe/architecture-description'
import {Dependency} from '../parse/dependency'
import {Artifact} from './artifact'
import {PathPattern} from '../assign/path-pattern'
import {CodeFile} from '../parse/code-file'
import {Logger} from '../common/logger'
import {FileToArtifactAssignment} from '../assign/file-to-artifact-assignment'
import {CheckResult} from './check-result'

export class DependencyChecker {
  private readonly artifactsByNames = new Map<string, Artifact>()
  private globalExcludes: PathPattern[]
  private globalIncludes: PathPattern[]

  constructor(private description: ArchitectureDescription, private assignment: FileToArtifactAssignment) {
    Artifact.createFrom(description.artifacts).forEach(it => this.addArtifact(it))
    this.globalExcludes = (description.exclude ?? []).map(it => new PathPattern(it))
    this.globalIncludes = (description.include ?? []).map(it => new PathPattern(it))
  }

  private addArtifact(artifact: Artifact): void {
    this.artifactsByNames.set(artifact.name, artifact)
    for (const child of artifact.children) {
      this.addArtifact(child)
    }
  }

  checkAll(files: CodeFile[]): CheckResult {
    if (this.assignment.getEmptyArtifacts().length > 0) {
      throw 'Empty artifacts:\n'
      + this.assignment.getEmptyArtifacts().map(it => '  - \'' + it + '\'').join(', ')
    }

    const violations: DependencyViolation[] = []

    let dependencies = 0
    for (const file of files) {
      dependencies += this.checkFile(file, violations)
    }

    return {
      architectureName: this.description.name,
      violations,
      dependencies,
      assignment: this.assignment,
      failedBecauseUnassigned: this.failedBecauseUnassigned()
    }
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
    return count
  }

  checkDependency(filePath: string, dependency: Dependency): DependencyViolation | undefined {
    Logger.debug('Checking ' + filePath + ' -> ' + dependency.path)

    if (this.globalIncludes.length > 0) {
      if (this.globalIncludes.every(it => !it.matches(filePath) || !it.matches(dependency.path))) {
        Logger.debug('Not globally included -> OK')
        return undefined
      }
    }

    if (this.globalExcludes.some(it => it.matches(filePath) || it.matches(dependency.path))) {
      Logger.debug('Globally excluded -> OK')
      return undefined
    }

    const from = this.findArtifact(filePath)
    if (!from) {
      Logger.debug('Not described -> OK')
      // files that are not described are not checked
      return undefined
    }

    const to = this.findArtifact(dependency.path)

    if (!to) {
      return this.createViolation(filePath, dependency, from)
    }

    if (from.mayUse(to)) {
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

  private failedBecauseUnassigned(): boolean {
    return (this.description.failOnUnassigned ?? false) && this.assignment.getUnassignedPaths().length > 0
  }
}