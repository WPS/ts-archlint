import { readFileSync } from 'fs'
import { join } from 'path'

import { Logger } from '../common/logger'
import { RawCodeFile } from './raw-code-file'
import { RawDependency } from './raw-dependency'

const regexFromImport = /from\s*['"](.+?)['"];?/
const regexLazyImport = /import\(['"](.+?)['"]\)/
const regexComment = RegExp('^\\s*//.*')

const defaultReadFile = (path: string) => readFileSync(path).toString()

export class DependencyParser {
  constructor(
    private rootPath: string,
    private read: (path: string) => string = defaultReadFile
  ) {
  }

  /***
   * @param filePath filepath relative to root with forward slashes
   */
  parseCodeFile(filePath: string): RawCodeFile {
    const pathFromRoot = this.toForwardSlashes(join(this.rootPath, filePath))
    const content = this.read(pathFromRoot)
    const [dependencies, lines] = this.parseDependencies(content)

    const codeFile: RawCodeFile = {
      path: filePath,
      lines,
      dependencies
    }

    Logger.debug('Parsed file', codeFile)
    return codeFile
  }

  /**
   * parses import statements und resolves dependencies
   * sourcePath => directory path to resolve relative import paths (with forward slashes)
   */
  private parseDependencies(fileContent: string): [RawDependency[], number] {
    const result: RawDependency[] = []

    const lines = fileContent.split(/\r?\n/)
    let lineNumber = 0
    for (const line of lines) {
      lineNumber++

      const match = regexFromImport.exec(line) ?? regexLazyImport.exec(line)

      if (match && !regexComment.exec(line)) {
        const [_, path] = match

        if (path.endsWith('.json')) {
          continue
        }

        result.push({
          line: lineNumber,
          importFrom: path
        })
      }
    }

    return [result, lineNumber]
  }

  private toForwardSlashes(path: string): string {
    return path.split('\\').join('/')
  }
}
