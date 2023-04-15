import {DependencyParser} from "./dependency-parser";
import {Dependency} from "./dependency";

describe(DependencyParser.name, () => {
    let parser = new DependencyParser()

    it('should parse empty dependencies', () => {
        const file = `
        class WithoutDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

        const dependencies = parser.parseDependencies(file)

        expect(dependencies).toEqual([])
    })

    it('should parse existing dependencies', () => {
        const file = `import {Dependency1} from "./dependency1";
        
        import {Dependency2} from '../../some-folder-dependency2'
        import {External} from 'external-lib'; // with comment after
        
        class WithDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

        const dependencies = parser.parseDependencies(file)
        const expected: Dependency[] = [
            {
                line: 1,
                path: './dependency1'
            },
            {
                line: 3,
                path: '../../some-folder-dependency2'
            },
            {
                line: 4,
                path: 'external-lib'
            }
        ]

        expect(dependencies).toEqual(expected)
    })
});