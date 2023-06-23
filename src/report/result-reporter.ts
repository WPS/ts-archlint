import {DependencyViolation} from "../check/dependency-violation";
import {Logger} from "../common/logger";

export class ResultReporter {
    reportViolations(violations: DependencyViolation[]): string[] {
        if (violations.length === 0) {
            Logger.info('No violations found.')
            return
        }

        const result: string[] = []
        for (const {from, to} of violations) {
            Logger.info(`artifact ${from.artifact} => ${to.artifact}`)
            Logger.info(`  ${this.formatPath(from.path, from.line)} => ${this.formatPath(to.path)}`)
        }

        Logger.info(`Found ${violations.length} violations in total`)

        return result
    }

    private formatPath(path: string, line?: number): string {
        const suffix = line ? (':' + line) : ''
        return path + suffix
    }
}