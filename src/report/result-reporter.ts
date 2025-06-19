import {DependencyViolation} from '../check/dependency-violation'
import {Logger} from '../common/logger'
import {FileToArtifactAssignment} from '../assign/file-to-artifact-assignment'
import {CheckResult} from '../check/check-result'

const reportNumberOfUnassignedFiles = 15
const divider = '__________________________________________________________________________________'

function logWithFrame(text: string): void {
  Logger.info('| ' + text)
}

export class ResultReporter {
  reportResults(result: CheckResult): void {
    Logger.info(' _' + divider)
    logWithFrame(`Architecture [${result.architectureName}]`)
    logWithFrame(`Analyzed ${result.dependencies} dependencies, found ${result.violations.length} violations`)

    this.reportViolations(result.violations)
    this.reportUnassignedFiles(result.assignment)

    Logger.info('|_' + divider)
    Logger.info('')
  }

  private reportViolations(violations: DependencyViolation[]): void {
    if (violations.length === 0) {
      return
    }

    const grouped = new Map<string, string[]>()
    for (const {from, to} of violations) {
      const key = `artifact ${from.artifact} => ${to.artifact || '<unknown-artifact>'}`

      let existing = grouped.get(key)
      if (!existing) {
        existing = []
        grouped.set(key, existing)
      }

      existing.push(`  ${this.formatPath(from.path, from.line)} => ${this.formatPath(to.path)}`)
    }

    for (const [artifact, artifactViolations] of grouped.entries()) {
      logWithFrame(`${artifact} (${artifactViolations.length})`)
      for (const violation of artifactViolations) {
        logWithFrame(violation)
      }
    }
  }

  private reportUnassignedFiles(assignment: FileToArtifactAssignment): void {
    const unassignedFiles = assignment.getUnassignedPaths()
    if (unassignedFiles.length > 0) {
      logWithFrame(`${unassignedFiles.length} files are not part of any artifact`)
      let count = 0
      for (const file of unassignedFiles) {
        count++
        logWithFrame(`  ${file}`)

        if (count === reportNumberOfUnassignedFiles) {
          logWithFrame('  [...]')
          break
        }
      }
    }
  }

  private formatPath(path: string, line?: number): string {
    const suffix = line ? (':' + line) : ''
    return path + suffix
  }
}
