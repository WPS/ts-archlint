import { DependencyChecker } from './dependency-checker'
import { ArchitectureDescription } from '../describe/architecture-description'
import { DependencyViolation } from './dependency-violation'
import { FileToArtifactAssignment } from '../assign/file-to-artifact-assignment'
import { DependencyParser } from '../parse/dependency-parser'
import { Dependency } from '../parse/dependency'

describe(DependencyChecker.name, () => {
  let architecture: ArchitectureDescription

  let assignment: FileToArtifactAssignment
  let checker: DependencyChecker

  beforeEach(() => {
    assignment = {} as FileToArtifactAssignment
    assignment.findArtifact = (it) => null
    assignment.getUnassignedPaths = () => []
    assignment.getEmptyArtifacts = () => []
  })

  describe('checkAll', () => {
    const tsConfigImportRemaps = { test: 'test1' }
    beforeEach(() => {
      architecture = {
        name: 'TestArchitecture',
        tsConfigImportRemaps: tsConfigImportRemaps,
        artifacts: [
          {
            name: 'domain',
            include: ['**/domain/*'],
            mayBeUsedFromAllAbove: true
          }
        ]
      }

      checker = new DependencyChecker(architecture, assignment)
    })

    it('should throw on empty artifacts', () => {
      assignment.getEmptyArtifacts = () => ['test']
      expect(() => checker.checkAll('test', ['test'])).toThrow()
    })

    it('should call checkFile with correct parser for each file', () => {
      const mockCheckFile = jest.fn(
        (
          filePath: string,
          dependencyParser: DependencyParser,
          dependencyCounter: { count: number }
        ) => {
          dependencyCounter.count++
          return []
        }
      )
      checker.checkFile = mockCheckFile

      const filePaths = ['file1.ts', 'path/to/file2.ts']
      const { assignment, ...rest } = checker.checkAll('root', filePaths)

      expect(mockCheckFile.mock.calls).toHaveLength(2)
      filePaths.forEach((fp, index) => {
        expect(mockCheckFile.mock.calls[index][0]).toEqual(fp)
        expect(
          mockCheckFile.mock.calls[index][1]['tsConfigImportRemaps']
        ).toEqual(tsConfigImportRemaps)
      })
      expect(rest).toEqual({
        architectureName: 'TestArchitecture',
        dependencies: 2,
        failedBecauseUnassigned: false,
        violations: []
      })
    })

    it('should parse file and check each dependency', () => {
      const mockCheckDependency = jest.fn(
        (filePath: string, dependency: Dependency) => {
          return undefined
        }
      )
      checker.checkDependency = mockCheckDependency

      const testFilePath = 'test'
      const dependencyParser = new DependencyParser('')
      const codeFile = {
        path: '',
        lines: 42,
        dependencies: [
          {
            line: 7,
            path: '/test1.ts'
          },
          {
            line: 8,
            path: '/test2.ts'
          }
        ]
      }
      const mockParse = jest.fn((filePath) => ({
        ...codeFile,
        path: filePath
      }))
      dependencyParser.parseTypescriptFile = mockParse

      const dependencyCounter = { count: 0 }
      checker.checkFile(testFilePath, dependencyParser, dependencyCounter)

      expect(dependencyCounter.count).toBe(2)
      expect(mockParse.mock.calls).toHaveLength(1)
      expect(mockParse.mock.calls[0][0]).toBe(testFilePath)
      expect(mockCheckDependency.mock.calls).toHaveLength(2)
      expect(mockCheckDependency.mock.calls.map((call) => call[0])).toEqual([
        testFilePath,
        testFilePath
      ])
      expect(mockCheckDependency.mock.calls.map((call) => call[1])).toEqual(
        codeFile.dependencies
      )
    })
  })

  describe('with a nested architecture', function () {
    beforeEach(() => {
      architecture = {
        name: 'TestArchitecture',
        exclude: ['node_modules**'],
        artifacts: [
          {
            name: 'lager',
            include: 'lager/**',
            children: [
              {
                name: 'manf',
                include: '*/manf/**',
                mayUse: [
                  'lieferung',
                  'stammdaten'
                ]
              },
              {
                name: 'lieferung',
                include: '*/lieferung/**',
                mayUse: 'stammdaten.wagen'
              }
            ]
          },
          {
            name: 'stammdaten',
            include: 'stammdaten/**',
            children: [
              {
                name: 'wagen',
                include: '*/wagen/**',
                mayUse: 'radsatz'
              },
              {
                name: 'radsatz',
                include: '*/radsatz/**'
              }
            ]
          },
          {
            name: 'common',
            include: 'common/**',
            mayBeUsedFromAllAbove: true,
            children: [
              {
                name: 'util',
                include: '*/util/**'
              }
            ]
          }
        ]
      }

      checker = new DependencyChecker(architecture, assignment)
    })

    it('should NOT report non violating dependencies', () => {
      expectNoViolation('lager.manf', 'stammdaten')
      expectNoViolation('lager.manf', 'stammdaten.radsatz')
      expectNoViolation('lager.manf', 'stammdaten.wagen')
      expectNoViolation('lager.manf', 'lager.lieferung')
      expectNoViolation('lager.manf', 'common.util')
      expectNoViolation('stammdaten.wagen', 'stammdaten.radsatz')
      expectNoViolation('stammdaten.wagen', 'common')
      expectNoViolation('lager.lieferung', 'stammdaten.wagen')
    })

    it('should report violations', () => {
      expectViolation('lager.lieferung', 'lager.manf')
      expectViolation('lager.lieferung', 'stammdaten.radsatz')
      expectViolation('common.util', 'common')
      expectViolation('lager.manf', null)
      expectViolation('stammdaten', 'lager')
      expectViolation('stammdaten.wagen', 'lager.manf')
    })
  })

  describe('with a flat architecture', () => {
    beforeEach(() => {
      architecture = {
        name: 'TestArchitecture',
        exclude: ['node_modules**'],
        artifacts: [
          {
            name: 'controller',
            include: ['**/web/*'],
            mayUse: ['service']
          },
          {
            name: 'service',
            include: '**/service/*',
            mayUseAllBelow: true
          },
          {
            name: 'repository',
            include: '**/repository/*',
            mayUse: 'domain'
          },
          {
            name: 'domain',
            include: ['**/domain/*'],
            mayBeUsedFromAllAbove: true
          }
        ]
      }

      checker = new DependencyChecker(architecture, assignment)
    })

    it('should report violations', () => {
      expectViolation('controller', null)
      expectViolation('controller', 'repository')

      expectViolation('service', 'controller')

      expectViolation('repository', 'service')
      expectViolation('repository', 'controller')

      expectViolation('domain', 'repository')
      expectViolation('domain', 'service')
      expectViolation('domain', 'controller')
    })

    it('should NOT report non violating dependencies', () => {
      expectNoViolation('controller', 'controller')
      expectNoViolation('controller', 'service')
      expectNoViolation('controller', 'domain')

      expectNoViolation('service', 'service')
      expectNoViolation('service', 'repository')
      expectNoViolation('service', 'domain')

      expectNoViolation('repository', 'repository')
      expectNoViolation('repository', 'domain')

      expectNoViolation('domain', 'domain')
    })
  })

  describe('with an architecture with includes', () => {
    beforeEach(() => {
      architecture = {
        name: 'with-includes',
        include: [
          'projects/included/**'
        ],
        exclude: [
          'projects/included/exception/**'
        ],
        artifacts: [
          {
            name: 'one',
            include: '**/one/**',
            mayUse: 'two'
          },
          {
            name: 'two',
            include: '**/two/**',
          },
          {
            name: 'three',
            include: '**/three/**'
          }
        ]
      }

      assignment.findArtifact = findArtifactsByInclude(['one', 'two', 'three'])

      checker = new DependencyChecker(architecture, assignment)
    })

    it('should return violations correctly', () => {
      expect(getViolation('projects/included/one/file.ts', 'projects/included/two/file.ts')).toBeNull()
      expect(getViolation('projects/included/two/file.ts', 'projects/included/one/file.ts')).not.toBeNull()

      expect(getViolation('projects/included/one/file.ts', 'projects/included/exception/three/file.ts')).toBeNull()
      expect(getViolation('projects/included/two/file.ts', 'projects/included/exception/three/file.ts')).toBeNull()

      expect(getViolation('projects/included/one/file.ts', 'projects/excluded/three/file.ts')).toBeNull()
      expect(getViolation('projects/included/two/file.ts', 'projects/excluded/three/file.ts')).toBeNull()

      expect(getViolation('projects/included/one/file.ts', 'projects/included/three/file.ts')).not.toBeNull()
      expect(getViolation('projects/included/two/file.ts', 'projects/included/three/file.ts')).not.toBeNull()
    })
  })

  function expectViolation(
    fromArtifact: string,
    toArtifact: string | null
  ): void {
    const { fromPath, toPath } = setupFromAndToPath(fromArtifact, toArtifact)

    const violation = getViolation(fromPath, toPath)
    expect(violation).not.toBeNull()
    if (!violation) {
      throw new Error('The compiler does not understand otherwise')
    }

    const { from, to } = violation

    expect(from.line).toBe(7)
    expect(from.path).toBe(fromPath)
    expect(from.artifact).toBe(fromArtifact)

    expect(to.path).toBe(toPath)
    expect(to.artifact).toBe(toArtifact)
  }

  function expectNoViolation(
    fromArtifact: string,
    toArtifact: string | null
  ): void {
    const { fromPath, toPath } = setupFromAndToPath(fromArtifact, toArtifact)

    expect(getViolation(fromPath, toPath)).toBeNull()
  }

  function setupFromAndToPath(fromArtifact: string, toArtifact: string | null): { fromPath: string, toPath: string } {
    const fromPath = fromArtifact.split('.').join('/') + '/some/file.ts'
    const toPath = (toArtifact ?? 'unknown.artifact').split('.').join('/') + '/other/file.ts'

    assignment.findArtifact = (it) => {
      if (it === fromPath) {
        return fromArtifact
      } else if (it === toPath) {
        return toArtifact
      } else {
        return null
      }
    }

    return {
      fromPath,
      toPath
    }
  }

  function findArtifactsByInclude(
    artifacts: string[]
  ): (it: string) => string | null {
    return (path) => {
      for (const artifact of artifacts) {
        if (path.includes('/' + artifact + '/')) {
          return artifact
        }
      }
      return null
    }
  }

  function getViolation(
    fromPath: string,
    toPath: string
  ): DependencyViolation | null {
    const dependencyParser = new DependencyParser('')
    const codeFile = {
      path: fromPath,
      lines: 42,
      dependencies: [
        {
          line: 7,
          path: toPath
        }
      ]
    }
    dependencyParser.parseTypescriptFile = jest.fn(() => codeFile)
    const result = checker.checkFile('', dependencyParser, { count: 0 })

    expect(result.length).toBeLessThanOrEqual(1)
    return result[0] ?? null
  }
})
