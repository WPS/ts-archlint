import {DependencyParser} from "../parse/dependency-parser";
import {DependencyChecker} from "../check/dependency-checker";
import {ResultReporter} from "../report/result-reporter";
import {readdir, readFile} from 'fs/promises'
import {join} from 'path'
import {DescriptionReader} from "../describe/description-reader";
import {ArchitectureDescription} from "../describe/architecture-description";
import {ArchlintConfig} from "../describe/archlint-config";


export class ArchlintCli {
    private reader = new DescriptionReader()

    async run(): Promise<void> {
        let [nodePath, jsPath, configPath] = process.argv

        const config = await this.readConfig(configPath)
        const checkers: DependencyChecker[] = []
        const archFiles = await this.findArchitectureFiles(config)

        for (const archFile of archFiles) {
            const fileContent = await readFile(archFile).then(it => it.toString())
            const description: ArchitectureDescription = this.reader.readDesription(fileContent)
            checkers.push(new DependencyChecker(description))
        }

        const parsed = await new DependencyParser(config.srcRoot).parseFiles()

        const reporter = new ResultReporter()
        for (const checker of checkers) {
            const violations = checker.checkAll(parsed)
            reporter.reportViolations(violations)
        }
    }

    private async findArchitectureFiles(config: ArchlintConfig): Promise<string[]> {
        const files = await readdir(config.archFolder)
        return files.filter(it => it.endsWith('.arch.json'))
            .map(it => join(config.archFolder, it))
    }

    private async readConfig(path: string): Promise<ArchlintConfig> {
        const content = await readFile(path).then(it => it.toString())
        const {archFolder, srcRoot}: ArchlintConfig = JSON.parse(content)

        const configFolder = join(path, '../')

        return {
            archFolder: join(configFolder, archFolder),
            srcRoot: join(configFolder, srcRoot)
        }
    }
}