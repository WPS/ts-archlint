import { RawCodeFile } from './raw-code-file'
import { DependencyParser } from './dependency-parser'
import { Logger } from '../common/logger'
import { readdirSync } from 'fs'
import { join, relative } from 'path'

export class CodeFileReader {
  constructor(private parser: DependencyParser) {
  }

  readAll(sourceRoot: string): RawCodeFile[] {
    const allPaths = this.findAllCodeFilesRecursively(sourceRoot, sourceRoot)
    return allPaths.map(it => this.parser.parseCodeFile(it))
  }

  private findAllCodeFilesRecursively(
    rootPath: string,
    inDirectory: string
  ): string[] {
    Logger.debug(`searching files to check in directory ${inDirectory}`)
    const result: string[] = []

    const children = readdirSync(inDirectory, {withFileTypes: true})

    for (const child of children) {
      const childPath = join(inDirectory, child.name)
      if (child.isDirectory()) {
        result.push(
          ...this.findAllCodeFilesRecursively(rootPath, childPath)
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
