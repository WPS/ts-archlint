import {Dependency} from "./dependency";
import {CodeFile} from "./code-file";

import {readdirSync, readFileSync} from 'fs'
import {dirname, join, relative} from 'path'
import {Logger} from "../common/logger";

const regex = /from\s*['"](.+?)['"];?/

const defaultReadFile = (path: string) => readFileSync(path).toString()

export class DependencyParser {
    constructor(private rootPath: string, private read: (path: string) => string = defaultReadFile) {
    }

    parseFiles(): CodeFile[] {
        const result = this.parseFilesRecursively(this.rootPath)

        const lines = result.map(it => it.lines).reduce((a, b) => a + b, 0)
        Logger.info(`Done parsing ${result.length} files (${lines} lines total)`)
        return result
    }

    private parseFilesRecursively(directory: string): CodeFile[] {
        Logger.debug('parsing directory ' + directory)

        const result: CodeFile[] = []

        const children = readdirSync(directory, {withFileTypes: true})

        for (const child of children) {
            const childPath = join(directory, child.name)
            if (child.isDirectory()) {
                result.push(...this.parseFilesRecursively(childPath))
            } else if (this.isSourceFile(childPath)) {
                result.push(this.parseFile(childPath))
            }
        }

        return result
    }

    private isSourceFile(path: string): boolean {
        return path.endsWith('.ts')
    }

    parseFile(path: string): CodeFile {
        const content = this.read(path)
        const [dependencies, lines] = this.parseDependencies(dirname(path), content)

        const codeFile: CodeFile = {
            path: this.toForwardSlashes(relative(this.rootPath, path)),
            lines,
            dependencies
        };

        Logger.debug("Parsed file", codeFile)
        return codeFile
    }

    private parseDependencies(sourcePath: string, fileContent: string): [Dependency[], number] {
        const result: Dependency[] = []

        const lines = fileContent.split(/\r?\n/)
        let lineNumber = 1
        for (const line of lines) {
            const match = regex.exec(line)

            if (match) {
                const [_, path] = match

                result.push({
                    line: lineNumber,
                    path: this.normalizePath(sourcePath, path)
                })
            }

            lineNumber++
        }

        return [result, lineNumber - 1]
    }

    private normalizePath(sourcePath: string, path: string): string {
        if (!path.startsWith('.')) {
            return 'node_modules:' + path
        }

        const absolute = join(sourcePath, path)
        const withoutPrefix = relative(this.rootPath, absolute)

        return this.toForwardSlashes(withoutPrefix) + '.ts'

    }

    private toForwardSlashes(path: string): string {
        return path.split('\\')
            .join('/')
    }
}