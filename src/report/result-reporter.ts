import {DependencyViolation} from "../check/dependency-violation";

export class ResultReporter {
    reportViolations(violations: DependencyViolation[]): string[] {
        return violations.map(it => this.violationToString(it))
    }

    private violationToString(violation: DependencyViolation): string {
        return `artifact ${violation.from.artifact} => ${violation.to.artifact}\n`
            + `  ${violation.from.path}:${violation.from.line} => ${violation.to.path}`
    }
}