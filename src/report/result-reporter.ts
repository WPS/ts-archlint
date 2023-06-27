import {DependencyViolation} from "../check/dependency-violation";
import {Logger} from "../common/logger";

export class ResultReporter {
    reportViolations(violations: DependencyViolation[]): void {
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
            Logger.info(artifact)
            for (const violation of artifactViolations) {
                Logger.info(violation)
            }
        }

        Logger.info(`Found ${violations.length} violations in total`)
    }

    private formatPath(path: string, line?: number): string {
        const suffix = line ? (':' + line) : ''
        return path + suffix
    }
}