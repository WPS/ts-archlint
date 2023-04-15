import {Dependency} from "./dependency";
import {CodeFile} from "./code-file";

import {readFile as fsReadFile} from 'fs/promises'
import {dirname, join} from 'path'

const regex = /from\s*['"](.+?)['"];?/

const defaultReadFile = path => fsReadFile(path).then(it => it.toString())

export class DependencyParser {
    constructor(private readFile: (path: string) => Promise<string> = defaultReadFile) {
    }

    async parseFile(path: string): Promise<CodeFile> {
        const content = await this.readFile(path)
        const dependencies = this.parseDependencies(dirname(path), content)

        return {
            path,
            dependencies
        }
    }

    private parseDependencies(sourcePath: string, fileContent: string): Dependency[] {
        const result: Dependency[] = []

        const lines = fileContent.split(/\r?\n/)
        let lineNumber = 1
        for (const line of lines) {
            const match = regex.exec(line)

            if (match) {
                const [_, path] = match

                result.push({
                    line: lineNumber,
                    path: this.createAbsolutePath(sourcePath, path)
                })
            }

            lineNumber++
        }

        return result
    }

    private createAbsolutePath(sourcePath: string, path: string): string {
        if (!path.startsWith('.')) {
            return 'node_modules:' + path
        }

        return join(sourcePath, path)
            .split('\\')
            .join('/') + '.ts'
    }
}