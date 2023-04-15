import {Dependency} from "./dependency";
import {CodeFile} from "./code-file";

import {readFile as fsReadFile} from 'fs/promises'

const regex = /from\s*['"](.+?)['"];?/


export class DependencyParser {
    constructor(private readFile: (path: string) => Promise<string> = path => fsReadFile(path).then(it => it.toString())) {
    }

    async parseFile(path: string): Promise<CodeFile> {
        const content = await this.readFile(path)
        const dependencies = this.parseDependencies(content)

        return {
            path,
            dependencies
        }
    }

    private parseDependencies(fileContent: string): Dependency[] {
        const result: Dependency[] = []

        const lines = fileContent.split('\n')
        let lineNumber = 1
        for (const line of lines) {
            const match = regex.exec(line)

            if (match) {
                const [_, path] = match
                result.push({
                    line: lineNumber,
                    path
                })
            }

            lineNumber++
        }

        return result
    }
}