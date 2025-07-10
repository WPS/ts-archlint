import { ImportRemaps } from '../common/import-remaps'
import { RawCodeFile } from './raw-code-file'
import { CodeFile } from './code-file'
import { dirname, join } from 'path'
import { RawDependency } from './raw-dependency'
import { Dependency } from './dependency'

export class PathNormalizer {
  constructor(private readonly tsConfigImportRemaps?: ImportRemaps) {
  }

  normalize(file: RawCodeFile): CodeFile {
    const path = this.toForwardSlashes(file.path)
    const directory = dirname(path)

    const dependencies = file.dependencies.map(it => this.normalizeDependency(directory, it))
    return {
      path,
      dependencies,
      lines: file.lines,
    }
  }

  private normalizeDependency(sourcePath: string, dependency: RawDependency): Dependency {
    const remappedPath = this.remapIfNeeded(dependency.importFrom, this.tsConfigImportRemaps)
    const noNodeModules = Object.values(this.tsConfigImportRemaps ?? {})
    const path = this.toAbsoluteSourcePath(sourcePath, remappedPath, noNodeModules)

    return {
      line: dependency.line,
      path
    }
  }

  private remapIfNeeded(path: string, remaps: ImportRemaps | undefined): string {
    if (!remaps) {
      return path
    }

    let result = path
    Object.keys(remaps).forEach((matchPath) => {
      result = result.replace(new RegExp(`^(\\/)?(${matchPath})(\\/)`), `${remaps[matchPath]}/`)
    })

    return result
  }

  private toAbsoluteSourcePath(
    directoryPath: string,
    importFrom: string,
    noNodeModules: string[]
  ): string {
    if (!importFrom.startsWith('.') && noNodeModules.every(it => !importFrom.startsWith(it))) {
      return 'node_modules/' + importFrom
    }

    let absolutePathFromSource
    if (importFrom.startsWith('.')) {
      absolutePathFromSource = join(directoryPath, importFrom)
    } else {
      absolutePathFromSource = importFrom
    }

    return this.toForwardSlashes(absolutePathFromSource) + '.ts'
  }

  private toForwardSlashes(path: string): string {
    return path.split('\\').join('/')
  }
}
