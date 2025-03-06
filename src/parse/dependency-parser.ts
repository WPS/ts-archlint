import { readFileSync } from 'fs';
import { dirname, join } from 'path';

import { Logger } from '../common/logger';
import { CodeFile } from './code-file';
import { Dependency } from './dependency';
import { ImportRemaps } from '../common/import-remaps';

const regexFromImport = /from\s*['"](.+?)['"];?/;
const regexLazyImport = /import\(['"](.+?)['"]\)/;
const regexComment = RegExp('^\\s*//.*');

const defaultReadFile = (path: string) => readFileSync(path).toString();

export class DependencyParser {
  constructor(
    private rootPath: string,
    private tsConfigImportRemaps?: ImportRemaps,
    private read: (path: string) => string = defaultReadFile
  ) {}

  /***
   * @param path filepath relative to root with forward slashes
   */
  parseTypescriptFile(path: string): CodeFile {
    const pathFromRoot = this.toForwardSlashes(join(this.rootPath, path));
    const content = this.read(pathFromRoot);
    const [dependencies, lines] = this.parseDependencies(
      dirname(path),
      content,
      this.tsConfigImportRemaps
    );

    const codeFile: CodeFile = {
      path,
      lines,
      dependencies
    };

    Logger.debug('Parsed file', codeFile);
    return codeFile;
  }

  /**
   * parses import statements und resolves dependencies
   * @param sourcePath directory path to resolve relative import paths (with forward slashes)
   * @param fileContent
   * @param tsConfigImportRemaps
   * @returns
   */
  private parseDependencies(
    sourcePath: string,
    fileContent: string,
    tsConfigImportRemaps?: ImportRemaps
  ): [Dependency[], number] {
    const result: Dependency[] = [];

    const lines = fileContent.split(/\r?\n/);
    let lineNumber = 0;
    for (const line of lines) {
      lineNumber++;

      const match = regexFromImport.exec(line) ?? regexLazyImport.exec(line);

      if (match && !regexComment.exec(line)) {
        const [_, path] = match;

        if (path.endsWith('.json')) {
          continue;
        }

        let dependencyPath = path;
        if (tsConfigImportRemaps) {
          dependencyPath = this.remapImports(
            dependencyPath,
            tsConfigImportRemaps
          );
        }

        dependencyPath = this.toAbsoluteSourcePath(
          sourcePath,
          dependencyPath,
          tsConfigImportRemaps
            ? Object.keys(tsConfigImportRemaps).map(
                (key) => tsConfigImportRemaps[key]
              )
            : []
        );

        result.push({
          line: lineNumber,
          path: dependencyPath
        });
      }
    }

    return [result, lineNumber];
  }

  remapImports(path: string, tsConfigImportRemaps: ImportRemaps): string {
    let result = path;
    Object.keys(tsConfigImportRemaps).forEach((matchPath) => {
      result = result.replace(
        new RegExp(`^(\\/)?(${matchPath})(\\/)`),
        `${tsConfigImportRemaps[matchPath]}/`
      );
    });

    return result;
  }

  private toAbsoluteSourcePath(
    sourcePath: string,
    path: string,
    skipNodeModulePrefixFor: string[]
  ): string {
    if (
      !path.startsWith('.') &&
      !skipNodeModulePrefixFor.some((skipPath) => path.startsWith(skipPath))
    ) {
      return 'node_modules:' + path;
    }

    let absolutePathFromSource;
    if (path.startsWith('.')) {
      absolutePathFromSource = join(sourcePath, path);
    } else {
      absolutePathFromSource = path;
    }

    return this.toForwardSlashes(absolutePathFromSource) + '.ts';
  }

  private toForwardSlashes(path: string): string {
    return path.split('\\').join('/');
  }
}
