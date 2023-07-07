import {DependencyParser} from "../parse/dependency-parser";
import {DependencyChecker} from "../check/dependency-checker";
import {ResultReporter} from "../report/result-reporter";
import {readdirSync, readFileSync} from 'fs'
import {join} from 'path'
import {DescriptionReader} from "../describe/description-reader";
import {ArchitectureDescription} from "../describe/architecture-description";
import {ArchlintConfig} from "../describe/archlint-config";
import {Logger} from "../common/logger";


export class ArchlintCli {
    run(): number {
        let [nodePath, jsPath, configPath] = process.argv

        const config = this.readConfig(configPath)
        Logger.setVerbose(config.verbose || false)

        Logger.debug("Read the following config:", config)

        const checkers: DependencyChecker[] = []
        const archFiles = this.findArchitectureFiles(config)

        const reader = new DescriptionReader()

        for (const archFile of archFiles) {
            const fileContent = readFileSync(archFile).toString()
            const description: ArchitectureDescription = reader.readDesription(fileContent)
            checkers.push(new DependencyChecker(description))
        }

        Logger.debug("Read " + checkers.length + " dependency checkers")

        const parsed = new DependencyParser(config.srcRoot).parseFiles()

        const reporter = new ResultReporter()

        let returnCode = 0

        for (const checker of checkers) {
            const violations = checker.checkAll(parsed)
            reporter.reportViolations(violations)

            if (violations.length > 0) {
                returnCode = 1
            }
        }
        Logger.info("Exit code: " + returnCode)
        return returnCode
    }

    private findArchitectureFiles(config: ArchlintConfig): string[] {
        Logger.debug("Reading folder", config.archFolder)

        const files = readdirSync(config.archFolder)
        Logger.debug("Found the following files:", files)

        return files.filter(it => it.endsWith('.arch.json'))
            .map(it => join(config.archFolder, it))
    }

    private readConfig(path: string): ArchlintConfig {
        const content = readFileSync(path).toString()
        const {archFolder, srcRoot, verbose}: ArchlintConfig = JSON.parse(content)

        const configFolder = join(path, '../')

        return {
            archFolder: join(configFolder, archFolder),
            srcRoot: join(configFolder, srcRoot),
            verbose
        }
    }
}