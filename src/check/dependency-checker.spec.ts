import { DependencyChecker } from './dependency-checker'
import { ArchitectureDescription } from '../describe/architecture-description'
import { DependencyViolation } from './dependency-violation'
import { FileToArtifactAssignment } from '../assign/file-to-artifact-assignment'
import { CycleDetector } from './cycle-detector'
import { CodeFile } from '../parse/code-file'

describe(DependencyChecker.name, () => {
  let architecture: ArchitectureDescription

  let assignment: FileToArtifactAssignment
  let checker: DependencyChecker
  let cycleDetector: CycleDetector

  beforeEach(() => {
    cycleDetector = new CycleDetector()

    assignment = {} as FileToArtifactAssignment
    assignment.findArtifact = () => null
    assignment.getUnassignedPaths = () => []
    assignment.getEmptyArtifacts = () => []
  })

  describe('checkAll', () => {
    const tsConfigImportRemaps = {test: 'test1'}
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

      checker = new DependencyChecker(architecture, assignment, cycleDetector)
    })

    it('should throw on empty artifacts', () => {
      assignment.getEmptyArtifacts = () => ['test']
      const file: CodeFile = {path: 'root/domain/file1.ts', lines: 3, dependencies: []}
      expect(() => checker.checkAll([file])).toThrow()
    })

    describe('with ignored dependencies', () => {
      beforeEach(() => {
        const artifactA = {
          name: 'A',
          include: 'a/**',
          mayUse: 'B'
        }
        const artifactB = {
          name: 'B',
          include: 'b/**',
        }
        architecture = {
          name: 'TestArchitecture',
          ignoreDependencies: {
            'b/with/ignored/violation.ts':
              ['a/ignored/dependency.ts', 'a/ignored/other/dependency.ts', 'a/ignored/package/**'],
            'b/legacy/package**': ['a/ignored/dependency.ts', 'a/ignored/other/dependency.ts']
          },
          artifacts: [
            artifactA,
            artifactB,
          ]
        }

        assignment.findArtifact = (it) => {
          if (it.startsWith('a')) {
            return artifactA.name
          } else if (it.startsWith('b')) {
            return artifactB.name
          } else {
            return null
          }
        }

        checker = new DependencyChecker(architecture, assignment, cycleDetector)
      })

      it('should match Path Pattern for source Path', () => {
        expect(getViolation('b/legacy/package/test.ts', 'a/ignored/dependency.ts')?.ignored).toBe(true)
      })

      it('should match Path Pattern for dependency Path', () => {
        expect(getViolation('b/with/ignored/violation.ts', 'a/ignored/package/dependency.ts')?.ignored).toBe(true)
      })

      it('should check dependency for not ignored files', () => {
        expect(getViolation('b/with/violation.ts', 'a/ignored/dependency.ts')?.ignored).toBe(false)
      })

      it('should not list ignored Dependency as violation', () => {
        expect(getViolation('b/with/ignored/violation.ts', 'a/ignored/dependency.ts')?.ignored).toBe(true)
        expect(getViolation('b/with/ignored/violation.ts', 'a/ignored/other/dependency.ts')?.ignored).toBe(true)
      })

      it('should find other violations within file', () => {
        expect(getViolation('b/with/ignored/violation.ts', 'a/other/dependency.ts')?.ignored).toBe(false)
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

        checker = new DependencyChecker(architecture, assignment, cycleDetector)
      })

      it('should NOT report non violating dependencies', () => {
        expectNoViolationBetweenArtifacts('lager.manf', 'stammdaten')
        expectNoViolationBetweenArtifacts('lager.manf', 'stammdaten.radsatz')
        expectNoViolationBetweenArtifacts('lager.manf', 'stammdaten.wagen')
        expectNoViolationBetweenArtifacts('lager.manf', 'lager.lieferung')
        expectNoViolationBetweenArtifacts('lager.manf', 'common.util')
        expectNoViolationBetweenArtifacts('stammdaten.wagen', 'stammdaten.radsatz')
        expectNoViolationBetweenArtifacts('stammdaten.wagen', 'common')
        expectNoViolationBetweenArtifacts('lager.lieferung', 'stammdaten.wagen')
      })

      it('should report violations', () => {
        expectViolationBetweenArtifacts('lager.lieferung', 'lager.manf')
        expectViolationBetweenArtifacts('lager.lieferung', 'stammdaten.radsatz')
        expectViolationBetweenArtifacts('common.util', 'common')
        expectViolationBetweenArtifacts('lager.manf', null)
        expectViolationBetweenArtifacts('stammdaten', 'lager')
        expectViolationBetweenArtifacts('stammdaten.wagen', 'lager.manf')
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

        checker = new DependencyChecker(architecture, assignment, cycleDetector)
      })

      it('should report violations', () => {
        expectViolationBetweenArtifacts('controller', null)
        expectViolationBetweenArtifacts('controller', 'repository')

        expectViolationBetweenArtifacts('service', 'controller')

        expectViolationBetweenArtifacts('repository', 'service')
        expectViolationBetweenArtifacts('repository', 'controller')

        expectViolationBetweenArtifacts('domain', 'repository')
        expectViolationBetweenArtifacts('domain', 'service')
        expectViolationBetweenArtifacts('domain', 'controller')
      })

      it('should NOT report non violating dependencies', () => {
        expectNoViolationBetweenArtifacts('controller', 'controller')
        expectNoViolationBetweenArtifacts('controller', 'service')
        expectNoViolationBetweenArtifacts('controller', 'domain')

        expectNoViolationBetweenArtifacts('service', 'service')
        expectNoViolationBetweenArtifacts('service', 'repository')
        expectNoViolationBetweenArtifacts('service', 'domain')

        expectNoViolationBetweenArtifacts('repository', 'repository')
        expectNoViolationBetweenArtifacts('repository', 'domain')

        expectNoViolationBetweenArtifacts('domain', 'domain')
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

        checker = new DependencyChecker(architecture, assignment, cycleDetector)
      })

      it('should return violations correctly', () => {
        expect(getViolation('projects/included/one/file.ts', 'projects/included/two/file.ts')).toBeNull()
        expect(getViolation('projects/included/two/file.ts', 'projects/included/one/file.ts')?.ignored).toBe(false)

        expect(getViolation('projects/included/one/file.ts', 'projects/included/exception/three/file.ts')).toBeNull()
        expect(getViolation('projects/included/two/file.ts', 'projects/included/exception/three/file.ts')).toBeNull()

        expect(getViolation('projects/included/one/file.ts', 'projects/excluded/three/file.ts')).toBeNull()
        expect(getViolation('projects/included/two/file.ts', 'projects/excluded/three/file.ts')).toBeNull()

        expect(getViolation('projects/included/one/file.ts', 'projects/included/three/file.ts')?.ignored).toBe(false)
        expect(getViolation('projects/included/two/file.ts', 'projects/included/three/file.ts')?.ignored).toBe(false)
      })
    })


    function expectViolationBetweenArtifacts(
      fromArtifact: string,
      toArtifact: string | null
    ): void {
      const {fromPath, toPath} = setupFromAndToPath(fromArtifact, toArtifact)

      const violation = getViolation(fromPath, toPath)
      expect(violation).not.toBeNull()
      if (!violation) {
        throw new Error('The compiler does not understand otherwise')
      }

      const {from, to} = violation

      expect(from.line).toBe(7)
      expect(from.path).toBe(fromPath)
      expect(from.artifact).toBe(fromArtifact)

      expect(to.path).toBe(toPath)
      expect(to.artifact).toBe(toArtifact)
    }

    function expectNoViolationBetweenArtifacts(
      fromArtifact: string,
      toArtifact: string | null
    ): void {
      const {fromPath, toPath} = setupFromAndToPath(fromArtifact, toArtifact)

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

    function getViolation(fromPath: string, toPath: string): DependencyViolation | null {
      const codeFile: CodeFile = {
        path: fromPath,
        lines: 42,
        dependencies: [
          {
            line: 7,
            path: toPath
          }
        ]
      }

      const {violations} = checker.checkAll([codeFile])

      expect(violations.length).toBeLessThanOrEqual(1)
      return violations[0] ?? null
    }
  })
})
