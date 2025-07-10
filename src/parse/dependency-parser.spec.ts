import { DependencyParser } from './dependency-parser'
import { RawCodeFile } from './raw-code-file'
import { beforeEach, describe, expect, it } from 'vitest'

describe(DependencyParser.name, () => {
  const filePath = 'path/to/file/file.ts'
  let fileContent: string
  let parser: DependencyParser

  beforeEach(() => {
    parser = new DependencyParser(
      '/long/path/prefix',
      it => {
        expect(it).toBe(`/long/path/prefix/${filePath}`)
        return fileContent
      }
    )
  })

  it('should parse empty dependencies', () => {
    fileContent = `class WithoutDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

    const dependencies = parser.parseCodeFile(filePath)
    const expected: RawCodeFile = {
      path: 'path/to/file/file.ts',
      lines: 5,
      dependencies: []
    }

    expect(dependencies).toEqual(expected)
  })

  it('should parse existing dependencies', () => {
    fileContent = `import {Dependency1} from "./dependency1";

        import {Dependency2} from '../../some-folder/dependency2'
        import {External} from 'external-lib'; // with comment after

        class WithDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

    const parsed = parser.parseCodeFile(filePath)
    const expected: RawCodeFile = {
      path: 'path/to/file/file.ts',
      lines: 10,
      dependencies: [
        {
          line: 1,
          importFrom: './dependency1'
        },
        {
          line: 3,
          importFrom: '../../some-folder/dependency2'
        },
        {
          line: 4,
          importFrom: 'external-lib'
        }
      ]
    }

    expect(parsed).toEqual(expected)
  })

  it('should NOT parse imports in obvious comments', () => {
    fileContent = `// import {Dependency1} from "./dependency1";

           //        import {Dependency2} from '../../some-folder/dependency2'
        //import {External} from 'external-lib'; // with comment after

        class WithDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

    const parsed = parser.parseCodeFile(filePath)
    expect(parsed.dependencies).toEqual([])
  })

  it('should NOT parse dependencies to JSON files', () => {
    fileContent = `import blubb from "./dependency1.json";
        `
    const parsed = parser.parseCodeFile(filePath)

    const expected: RawCodeFile = {
      path: 'path/to/file/file.ts',
      lines: 2,
      dependencies: []
    }

    expect(parsed).toEqual(expected)
  })

  it('should parse dependencies of lazy loaded Routes in Angular', () => {
    fileContent = `
        const routes: Routes = [
           {
              path: 'whatever',
              loadChildren: () => import('../lazy.component').then(it => it.LazyComponent)
           }
        ]
        `

    const parsed = parser.parseCodeFile(filePath)

    const expected: RawCodeFile = {
      path: 'path/to/file/file.ts',
      lines: 8,
      dependencies: [
        {
          line: 5,
          importFrom: '../lazy.component'
        }
      ]
    }

    expect(parsed).toEqual(expected)
  })
})
