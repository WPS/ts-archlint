import {DependencyParser} from "./dependency-parser";
import {CodeFile} from "./code-file";

describe(DependencyParser.name, () => {
    const filePath = '/long/path/prefix/path/to/file/file.ts'
    let fileContent: string
    let parser: DependencyParser

    beforeEach(() => {
        parser = new DependencyParser(
            '/long/path/prefix',
            it => new Promise(resolve => {
                expect(it).toBe(filePath)
                resolve(fileContent)
            }))
    })

    it('should parse empty dependencies', async () => {
        fileContent = `class WithoutDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

        const dependencies = await parser.parseFile(filePath)
        const expected: CodeFile = {
            path: 'path/to/file/file.ts',
            lines: 5,
            dependencies: []
        }

        expect(dependencies).toEqual(expected)
    })

    it('should parse existing dependencies', async () => {

        fileContent = `import {Dependency1} from "./dependency1";
        
        import {Dependency2} from '../../some-folder/dependency2'
        import {External} from 'external-lib'; // with comment after
        
        class WithDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

        const parsed = await parser.parseFile(filePath)
        const expected: CodeFile = {
            path: 'path/to/file/file.ts',
            lines: 10,
            dependencies: [
                {
                    line: 1,
                    path: 'path/to/file/dependency1.ts'
                },
                {
                    line: 3,
                    path: 'path/some-folder/dependency2.ts'
                },
                {
                    line: 4,
                    path: 'node_modules:external-lib'
                }
            ]
        }

        expect(parsed).toEqual(expected)
    })
});