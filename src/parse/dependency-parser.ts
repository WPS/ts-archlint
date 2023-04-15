import {Dependency} from "./dependency";

const regex = /from\s+['"](.+?)['"];?/

export class DependencyParser {
    parseDependencies(fileContent: string): Dependency[] {
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