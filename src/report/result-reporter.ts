import {DependencyViolation} from "../check/dependency-violation";
import {Logger} from "../common/logger";
import {FileToArtifactAssignment} from "../assign/file-to-artifact-assignment";

const reportNumberOfUnassignedFiles = 15

export class ResultReporter {
    reportResults(violations: DependencyViolation[], assignment: FileToArtifactAssignment): void {
        this.reportViolations(violations);
        this.reportUnassignedFiles(assignment);
    }

    private reportViolations(violations: DependencyViolation[]): void {
        if (violations.length === 0) {
            Logger.info('No violations found.')
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
            Logger.info(`${artifact} (${artifactViolations.length})`)
            for (const violation of artifactViolations) {
                Logger.info(violation)
            }
        }

        Logger.info(`Found ${violations.length} violations in total`)
    }

    private reportUnassignedFiles(assignment: FileToArtifactAssignment): void {
        const unassignedFiles = assignment.getUnassignedPaths();
        if (unassignedFiles.length > 0) {
            Logger.info(`${unassignedFiles.length} files are not part of any artifact`)
            let count = 0
            for (const file of unassignedFiles) {
                count++
                Logger.info(`  ${file}`)

                if (count === reportNumberOfUnassignedFiles) {
                    Logger.info("  [...]")
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