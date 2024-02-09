import {DependencyParser} from "../parse/dependency-parser";
import {DependencyChecker} from "../check/dependency-checker";
import {ResultReporter} from "../report/result-reporter";
import {readdirSync, readFileSync} from 'fs'
import {join} from 'path'
import {DescriptionReader} from "../describe/description-reader";
import {ArchitectureDescription} from "../describe/architecture-description";
import {ArchlintConfig} from "../describe/archlint-config";
import {Logger} from "../common/logger";
import {FileToArtifactAssignment} from "../assign/file-to-artifact-assignment";

const archFolder = '.archlint'

export class ArchlintCli {
    run(): number {
        Logger.info("Archlint started, linting architecture...")

        let [nodePath, jsPath, ...args] = process.argv

        const config = this.readConfig(args)
        Logger.setVerbose(config.verbose || false)

        Logger.debug("Read the following config:", config)

        const checkers: DependencyChecker[] = []
        const archFiles = this.findArchitectureFiles()

        const reader = new DescriptionReader()

        const codeFiles = new DependencyParser(config.srcRoot).parseFiles()

        for (const archFile of archFiles) {
            const fileContent = readFileSync(archFile).toString()
            const description: ArchitectureDescription = reader.readDescription(fileContent)
            const assignment = FileToArtifactAssignment.createFrom(description.artifacts, codeFiles)
            checkers.push(new DependencyChecker(description, assignment))
        }

        Logger.debug(`Read ${checkers.length} dependency checkers`)

        const reporter = new ResultReporter()

        let returnCode = 0

        for (const checker of checkers) {
            const violations = checker.checkAll(codeFiles)
            reporter.reportResults(violations, checker.assignment)

            if (violations.length > 0 || checker.failedBecauseUnassigned()) {
                returnCode = 1
            }
        }
        Logger.info(`Exit code: ${returnCode}`)
        return returnCode
    }

    private findArchitectureFiles(): string[] {
        Logger.debug("Reading folder", archFolder)

        const files = readdirSync(archFolder)
        Logger.debug("Found the following files:", files)

        return files.map(it => join(archFolder, it))
    }

    private readConfig(args: string[]): ArchlintConfig {
        let [srcRoot, verboseString, ...others] = args
        if (!srcRoot) {
            throw new Error("You need to pass the source-root as first argument")
        }

        if (others.length > 0) {
            throw new Error("Unexpected number of arguments")
        }

        let verbose = false
        if (verboseString === '-v' || verboseString === '--verbose') {
            verbose = true
        } else if (verboseString) {
            throw new Error(`Unexpected parameter: '${verboseString}'`)
        }

        return {
            srcRoot,
            verbose
        }
    }
}