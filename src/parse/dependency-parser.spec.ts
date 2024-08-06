import {DependencyParser} from "./dependency-parser";
import {CodeFile} from "./code-file";

describe(DependencyParser.name, () => {
  const filePath = '/long/path/prefix/path/to/file/file.ts'
  let fileContent: string
  let parser: DependencyParser

  beforeEach(() => {
    parser = new DependencyParser(
      '/long/path/prefix',
      it => {
        expect(it).toBe(filePath)
        return fileContent
      })
  })

  it('should parse empty dependencies', () => {
    fileContent = `class WithoutDependencies {
          private value = 'singleQuoted'
          private otherValue = "double quoted"
        }
        `

    const dependencies = parser.parseTypescriptFile(filePath)
    const expected: CodeFile = {
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

    const parsed = parser.parseTypescriptFile(filePath)
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
          path: 'node_modules/external-lib'
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

    const parsed = parser.parseTypescriptFile(filePath)
    expect(parsed.dependencies).toEqual([])
  })

  it('should NOT parse dependencies to JSON files', () => {

    fileContent = `import blubb from "./dependency1.json";
        `
    const parsed = parser.parseTypescriptFile(filePath)

    const expected: CodeFile = {
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

    const parsed = parser.parseTypescriptFile(filePath)

    const expected: CodeFile = {
      path: 'path/to/file/file.ts',
      lines: 8,
      dependencies: [
        {
          line: 5,
          path: 'path/to/lazy.component.ts',
        }
      ]
    }

    expect(parsed).toEqual(expected)
  })
});