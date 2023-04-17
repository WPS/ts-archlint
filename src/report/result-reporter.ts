import {DependencyViolation} from "../check/dependency-violation";

export class ResultReporter {
    reportViolations(violations: DependencyViolation[]): string[] {
        if (violations.length === 0) {
            console.log('No violations found.')
            return
        }

        const result: string[] = []
        for (const {from, to} of violations) {
            console.warn(`artifact ${from.artifact} => ${to.artifact}`)
            console.warn(`  ${this.formatPath(from.path, from.line)} => ${this.formatPath(to.path)}`)
        }

        console.warn(`Found ${violations.length} violations in total`)

        return result
    }

    private formatPath(path: string, line?: number): string {
        const suffix = line ? (':' + line) : ''
        return path + suffix
    }
}