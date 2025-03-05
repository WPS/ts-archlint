import { readFileSync } from 'fs';
import { dirname, join, relative } from 'path';

import { Logger } from '../common/logger';
import { ImportRemaps } from '../describe/architecture-description';
import { CodeFile } from './code-file';
import { Dependency } from './dependency';

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

  parseFiles(filePaths: string[]): CodeFile[] {
    const result = filePaths.map((filePath) =>
      this.parseTypescriptFile(filePath)
    );

    const lines = result.map((it) => it.lines).reduce((a, b) => a + b, 0);
    Logger.info(`Done parsing ${result.length} files (${lines} lines total)`);
    return result;
  }

  parseTypescriptFile(path: string): CodeFile {
    const content = this.read(path);
    const [dependencies, lines] = this.parseDependencies(
      dirname(path),
      content,
      this.tsConfigImportRemaps
    );

    const codeFile: CodeFile = {
      path: this.toForwardSlashes(relative(this.rootPath, path)),
      lines,
      dependencies
    };

    Logger.debug('Parsed file', codeFile);
    return codeFile;
  }

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

        dependencyPath = this.normalizePath(
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

  private normalizePath(
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

    let pathRelativeToRoot = path;
    if (path.startsWith('.')) {
      pathRelativeToRoot = relative(this.rootPath, join(sourcePath, path));
    }

    return this.toForwardSlashes(pathRelativeToRoot) + '.ts';
  }

  private toForwardSlashes(path: string): string {
    return path.split('\\').join('/');
  }
}
