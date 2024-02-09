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


export class ArchlintCli {
    run(): number {
        Logger.info("Linting architecture...")

        let [nodePath, jsPath, archFolder] = process.argv

        if (!archFolder) {
            archFolder = '.archlint'
            Logger.info(`No folder specified, using default folder ${archFolder}`)
        }

        const config = this.readConfig(archFolder)
        Logger.setVerbose(config.verbose || false)

        Logger.debug("Read the following config:", config)

        const checkers: DependencyChecker[] = []
        const archFiles = this.findArchitectureFiles(archFolder)

        const reader = new DescriptionReader()

        const codeFiles = new DependencyParser(config.srcRoot).parseFiles()

        for (const archFile of archFiles) {
            const fileContent = readFileSync(archFile).toString()
            const description: ArchitectureDescription = reader.readDesription(fileContent)
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

    private findArchitectureFiles(archFolder: string): string[] {
        Logger.debug("Reading folder", archFolder)

        const files = readdirSync(archFolder)
        Logger.debug("Found the following files:", files)

        return files.filter(it => it !== 'config.json')
            .map(it => join(archFolder, it))
    }

    private readConfig(archFolder: string): ArchlintConfig {
        const content = readFileSync(join(archFolder, 'config.json')).toString()
        const {srcRoot, verbose}: ArchlintConfig = JSON.parse(content)

        return {
            srcRoot: join(archFolder, srcRoot),
            verbose
        }
    }
}