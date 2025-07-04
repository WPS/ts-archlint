import { readdirSync, readFileSync } from 'fs'
import { join, relative } from 'path'

import { FileToArtifactAssignment } from '../assign/file-to-artifact-assignment'
import { DependencyChecker } from '../check/dependency-checker'
import { Logger } from '../common/logger'
import { ArchitectureDescription } from '../describe/architecture-description'
import { ArchlintConfig } from '../describe/archlint-config'
import { DescriptionReader } from '../describe/description-reader'
import { ResultReporter } from '../report/result-reporter'

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

    const checkers: DependencyChecker[] = []
    const archFiles = this.findArchitectureFiles()

    const reader = new DescriptionReader()
    const filesToCheck = this.findAllProjectFilesRecursively(
      config.srcRoot,
      config.srcRoot
    )
    Logger.debug(`Found ${filesToCheck.length} files to check`)

    for (const archFile of archFiles) {
      const fileContent = readFileSync(archFile).toString()
      const description: ArchitectureDescription =
        reader.readDescription(fileContent)
      const assignment = FileToArtifactAssignment.createFrom(
        description,
        filesToCheck
      )
      checkers.push(new DependencyChecker(description, assignment))
    }

    Logger.debug(`Read ${checkers.length} dependency checkers`)

    const reporter = new ResultReporter()

    let returnCode = 0

    for (const checker of checkers) {
      const result = checker.checkAll(config.srcRoot, filesToCheck)
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
      throw new Error('You need to pass the source-root as first argument')
    }

    if (others.length > 0) {
      throw new Error('Unexpected number of arguments')
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

  private findAllProjectFilesRecursively(
    rootPath: string,
    inDirectory: string
  ): string[] {
    Logger.debug(`searching files to check in directory ${inDirectory}`)
    const result: string[] = []

    const children = readdirSync(inDirectory, { withFileTypes: true })

    for (const child of children) {
      const childPath = join(inDirectory, child.name)
      if (child.isDirectory()) {
        result.push(
          ...this.findAllProjectFilesRecursively(rootPath, childPath)
        )
      } else if (childPath.endsWith('.ts')) {
        result.push(this.toForwardSlashes(relative(rootPath, childPath)))
      }
    }

    return result
  }

  private toForwardSlashes(path: string): string {
    return path.split('\\').join('/')
  }
}
