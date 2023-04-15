import {Dependency} from "./dependency";
import {CodeFile} from "./code-file";

import {readdir, readFile} from 'fs/promises'
import {dirname, join, relative} from 'path'

const regex = /from\s*['"](.+?)['"];?/

const defaultReadFile = path => readFile(path).then(it => it.toString())

export class DependencyParser {
    constructor(private rootPath: string, private read: (path: string) => Promise<string> = defaultReadFile) {
    }

    async parseFiles(): Promise<CodeFile[]> {
        const result = await this.parseFilesRecursively(this.rootPath)

        const lines = result.map(it => it.lines).reduce((a, b) => a + b, 0)
        console.log(`Done parsing ${result.length} files (${lines} lines total)`)
        return result
    }

    private async parseFilesRecursively(directory: string): Promise<CodeFile[]> {
        console.log('parsing directory ' + directory)

        const result: CodeFile[] = []

        const children = await readdir(directory, {withFileTypes: true})

        for (const child of children) {
            const childPath = join(directory, child.name)
            if (child.isDirectory()) {
                result.push(...await this.parseFilesRecursively(childPath))
            } else if (this.isSourceFile(childPath)) {
                result.push(await this.parseFile(childPath))
            }
        }

        return result
    }

    private isSourceFile(path: string): boolean {
        return path.endsWith('.ts')
    }

    async parseFile(path: string): Promise<CodeFile> {
        const content = await this.read(path)
        const [dependencies, lines] = this.parseDependencies(dirname(path), content)

        return {
            path: this.toForwardSlashes(relative(this.rootPath, path)),
            lines,
            dependencies
        }
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