import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

import { FileToArtifactAssignment } from '../assign/file-to-artifact-assignment'
import { DependencyChecker } from '../check/dependency-checker'
import { Logger } from '../common/logger'
import { ArchitectureDescription } from '../describe/architecture-description'
import { ArchlintConfig } from '../describe/archlint-config'
import { DescriptionReader } from '../describe/description-reader'
import { ResultReporter } from '../report/result-reporter'
import { CycleDetector } from '../check/cycle-detector'
import { DependencyParser } from '../parse/dependency-parser'
import { PathNormalizer } from '../parse/path-normalizer'
import { CodeFileReader } from '../parse/code-file-reader'

const archFolder = '.archlint'

export class ArchlintCli {
  run(): number {
    try {
      return this.runAndThrow()
    } catch (error: any) {
      if (typeof error === 'string') {
        Logger.info(error)
        return 1
      }
      throw error
    }
  }

  private runAndThrow(): number {
    const startTime = performance.now()
    Logger.info('Archlint started, analyzing architecture...')

    const [_nodePath, _jsPath, ...args] = process.argv
    const config = this.readConfig(args)
    Logger.setVerbose(config.verbose || false)
    Logger.debug('Read the following config:', config)

    const codeFileReader = new CodeFileReader(new DependencyParser(config.srcRoot))
    const descriptionReader = new DescriptionReader()

    const checkers: DependencyChecker[] = []
    const archFiles = this.findArchitectureFiles()

    const codeFiles = codeFileReader.readAll(config.srcRoot,)

    const linesOfCode = codeFiles.map(it => it.lines)
      .reduce((a, b) => a + b, 0)
    const totalDependencies = codeFiles.map(it => it.dependencies.length)
      .reduce((a, b) => a + b, 0)

    Logger.info(
      `Parsed ${codeFiles.length} files to check, ${linesOfCode} lines and ${totalDependencies} dependencies in total.`
    )

    for (const archFile of archFiles) {
      const fileContent = readFileSync(archFile).toString()
      const description: ArchitectureDescription = descriptionReader.readDescription(fileContent)
      const assignment = FileToArtifactAssignment.createFrom(
        description,
        codeFiles.map(it => it.path)
      )
      checkers.push(new DependencyChecker(description, assignment, new CycleDetector()))
    }

    Logger.debug(`Read ${checkers.length} dependency checkers`)

    const reporter = new ResultReporter()

    let returnCode = 0

    for (const checker of checkers) {
      const normalizer = new PathNormalizer()
      const normalized = codeFiles.map(it => normalizer.normalize(it))
      const result = checker.checkAll(normalized)
      reporter.reportResults(result)

      const nonIgnoredViolationCount = result.violations
        .filter(it => !it.ignored)
        .length

      if (nonIgnoredViolationCount || result.failedBecauseUnassigned) {
        returnCode = 1
      }
    }
    const elapsed = Math.ceil(performance.now() - startTime)
    Logger.info(`Archlint done after ${elapsed}ms. Exit Code: ${returnCode}`)
    return returnCode
  }

  private findArchitectureFiles(): string[] {
    Logger.debug('Reading folder', archFolder)

    const files = readdirSync(archFolder)
    Logger.debug('Found the following files:', files)

    return files.map((it) => join(archFolder, it))
  }

  private readConfig(args: string[]): ArchlintConfig {
    const [srcRoot, verboseString, ...others] = args
    if (!srcRoot) {
      throw 'You need to pass the source-root as first argument'
    }

    if (others.length > 0) {
      throw 'Unexpected number of arguments'
    }

    let verbose = false
    if (verboseString === '-v' || verboseString === '--verbose') {
      verbose = true
    } else if (verboseString) {
      throw `Unexpected parameter: '${verboseString}'`
    }

    return {
      srcRoot,
      verbose
    }
  }
}
