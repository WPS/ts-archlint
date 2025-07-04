import { DependencyViolation } from './dependency-violation'
import { ArchitectureDescription } from '../describe/architecture-description'
import { Dependency } from '../parse/dependency'
import { Artifact } from './artifact'
import { PathPattern } from '../assign/path-pattern'
import { Logger } from '../common/logger'
import { FileToArtifactAssignment } from '../assign/file-to-artifact-assignment'
import { CheckResult } from './check-result'
import { DependencyParser } from '../parse/dependency-parser'

export class DependencyChecker {
  private readonly artifactsByNames = new Map<string, Artifact>()
  private readonly ignoreDependencies = new Map<PathPattern, PathPattern[]>()
  private globalExcludes: PathPattern[]
  private globalIncludes: PathPattern[]

  constructor(
    private description: ArchitectureDescription,
    private assignment: FileToArtifactAssignment
  ) {
    Artifact.createFrom(description.artifacts).forEach((it) =>
      this.addArtifact(it)
    )
    this.globalExcludes = (description.exclude ?? []).map(
      (it) => new PathPattern(it)
    )
    this.globalIncludes = (description.include ?? []).map(
      (it) => new PathPattern(it)
    )
    if (description.ignoreDependencies) {
      Object.keys(description.ignoreDependencies).forEach(sourcePath => {
        const dependencies = Array.isArray(description.ignoreDependencies![sourcePath]) ?
          (description.ignoreDependencies![sourcePath] as string[]).map(p => new PathPattern(p)) :
          [new PathPattern(description.ignoreDependencies![sourcePath] as string)]
        this.ignoreDependencies.set(new PathPattern(sourcePath), dependencies)
      })
    }
  }

  private addArtifact(artifact: Artifact): void {
    this.artifactsByNames.set(artifact.name, artifact)
    for (const child of artifact.children) {
      this.addArtifact(child)
    }
  }

  checkAll(rootPath: string, filePaths: string[]): CheckResult {
    if (this.assignment.getEmptyArtifacts().length > 0) {
      throw (
        'Empty artifacts:\n' +
        this.assignment
          .getEmptyArtifacts()
          .map((it) => '  - \'' + it + '\'')
          .join(', ')
      )
    }

    const dependencyParser = new DependencyParser(
      rootPath,
      this.description.tsConfigImportRemaps
    )

    const violations: DependencyViolation[] = []

    const dependencyCounter = { count: 0 }
    for (const filePath of filePaths) {
      violations.push(
        ...this.checkFile(filePath, dependencyParser, dependencyCounter)
      )
    }

    return {
      architectureName: this.description.name,
      violations,
      dependencies: dependencyCounter.count,
      assignment: this.assignment,
      failedBecauseUnassigned: this.failedBecauseUnassigned()
    }
  }

  public checkFile(
    filePath: string,
    dependencyParser: DependencyParser,
    dependencyCounter: { count: number }
  ): DependencyViolation[] {
    const result: DependencyViolation[] = []
    const file = dependencyParser.parseTypescriptFile(filePath)
    for (const dependency of file.dependencies) {
      const violation = this.checkDependency(file.path, dependency)
      if (violation) {
        result.push(violation)
      }
      dependencyCounter.count++
    }
    return result
  }

  checkDependency(
    filePath: string,
    dependency: Dependency
  ): DependencyViolation | undefined {
    Logger.debug('Checking ' + filePath + ' -> ' + dependency.path)

    if (this.globalIncludes.length > 0) {
      if (
        this.globalIncludes.every(
          (it) => !it.matches(filePath) || !it.matches(dependency.path)
        )
      ) {
        Logger.debug('Not globally included -> OK')
        return undefined
      }
    }

    if (
      this.globalExcludes.some(
        (it) => it.matches(filePath) || it.matches(dependency.path)
      )
    ) {
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
    const ignored = this.isViolationIgnored(path, dependency)

    return {
      from: {
        artifact: from.name,
        path,
        line: dependency.line
      },
      to: {
        artifact: to?.name || null,
        path: dependency.path
      },
      ignored
    }
  }

  private failedBecauseUnassigned(): boolean {
    return (this.description.failOnUnassigned ?? false)
      && this.assignment.getUnassignedPaths().length > 0
  }

  private isViolationIgnored(fromPath: string, dependency: Dependency): boolean {
    for (const [sourcePath, ignoreDependencies] of this.ignoreDependencies.entries()) {
      if (sourcePath.matches(fromPath)) {
        if (ignoreDependencies.some(dep => dep.matches(dependency.path))) {
          return true
        }
      }
    }
    return false
  }
}
