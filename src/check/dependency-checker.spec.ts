import {DependencyChecker} from "./dependency-checker";
import {ArchitectureDescription} from "../describe/architecture-description";
import {DependencyViolation} from "./dependency-violation";
import {FileToArtifactAssignment} from "../assign/file-to-artifact-assignment";

describe(DependencyChecker.name, () => {
    let architecture: ArchitectureDescription

    let assignment: FileToArtifactAssignment
    let checker: DependencyChecker

    beforeEach(() => {
        assignment = {} as FileToArtifactAssignment
        assignment.findArtifact = it => null
        assignment.getUnassignedPaths = () => []
        assignment.getEmptyArtifacts = () => []
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
                                    'stammdaten.radsatz'
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
            expectNoViolation('lager.manf', 'stammdaten.radsatz')
            expectNoViolation('lager.manf', 'lager.lieferung')
            expectNoViolation('lager.manf', 'common.util')
            expectNoViolation('stammdaten.wagen', 'stammdaten.radsatz')
            expectNoViolation('stammdaten.wagen', 'common')
        })

        it('should report violations', () => {
            expectViolation('lager.manf', 'stammdaten.wagen')
            expectViolation('lager.lieferung', 'lager.manf')
            expectViolation('common.util', 'common')
            expectViolation('lager.manf', 'stammdaten')
            expectViolation('lager.manf', null)
            expectViolation('stammdaten', 'lager')
            expectViolation('stammdaten.wagen', 'lager.manf')
        })
    });

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

    function expectViolation(fromArtifact: string, toArtifact: string | null): void {
        const fromPath = fromArtifact.split('.').join('/') + '/some/file.ts'
        const toPath = (toArtifact ?? 'unknown.artifact').split('.').join('/') + '/other/file.ts'

        assignment.findArtifact = it => {
            if (it === fromPath) {
                return fromArtifact
            } else if (it === toPath) {
                return toArtifact
            } else {
                return null
            }
        }

        const violation = getViolation(fromPath, toPath);
        expect(violation).not.toBeNull()

        const {from, to} = violation

        expect(from.line).toBe(7)
        expect(from.path).toBe(fromPath)
        expect(from.artifact).toBe(fromArtifact)

        expect(to.path).toBe(toPath)
        expect(to.artifact).toBe(toArtifact)
    }

    function expectNoViolation(fromArtifact: string, toArtifact: string | null): void {
        const fromPath = '/some/arbitrary/file-path.ts'
        const toPath = '/some/other/file-path.ts'

        assignment.findArtifact = it => {
            if (it === fromPath) {
                return fromArtifact
            } else if (it === toPath) {
                return toArtifact
            } else {
                return null
            }
        }

        expect(getViolation(fromPath, toPath)).toBeNull()
    }

    function getViolation(fromPath: string, toPath: string | null): DependencyViolation | null {
        const violations = checker.checkAll([{
            path: fromPath,
            lines: 42,
            dependencies: [
                {
                    line: 7,
                    path: toPath
                }
            ]
        }])

        expect(violations.length).toBeLessThanOrEqual(1)
        return violations[0] ?? null
    }
});