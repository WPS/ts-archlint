import {DependencyChecker} from "./dependency-checker";
import {ArchitectureDescription} from "../describe/architecture-description";
import {DependencyViolation} from "./dependency-violation";
import {Dependency} from "../parse/dependency";

describe(DependencyChecker.name, () => {
    let architecture: ArchitectureDescription
    let checker: DependencyChecker

    let violation: DependencyViolation | null

    describe('with a nested architecture', function () {
        beforeEach(() => {
            violation = null

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
                                    'core.radsatz'
                                ]
                            },
                            {
                                name: 'lieferung',
                                include: '*/lieferung/**',
                                mayUse: 'core.wagen'
                            }
                        ]
                    },
                    {
                        name: 'core',
                        include: 'core/**',
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

            checker = new DependencyChecker(architecture)
        })

        it('should NOT report non violating dependencies', () => {
            violation = checker.checkDependency(
                'lager/manf/foo/bar/xxx.ts',
                dependency('core/radsatz/bla/blubb/xxx.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                'lager/manf/foo/bar/xxx.ts',
                dependency('core/radsatz/bla/something.ts')
            )
            expect(violation).toBeUndefined()


            violation = checker.checkDependency(
                'lager/manf/foo/bar/xxx.ts',
                dependency('lager/lieferung/bla/something.ts')
            )
            expect(violation).toBeUndefined()


            violation = checker.checkDependency(
                'lager/manf/foo/bar/xxx.ts',
                dependency('common/lieferung/bla/something.ts')
            )
            expect(violation).toBeUndefined()


            violation = checker.checkDependency(
                'lager/manf/foo/bar/xxx.ts',
                dependency('common/util/bla/something.ts')
            )
            expect(violation).toBeUndefined()
        })

        describe('should return violation if', () => {
            expectViolation({
                from: {
                    artifact: 'lager.manf',
                    path: 'lager/manf/foo/bar/blubb.ts',
                    line: 7
                },
                to: {
                    artifact: 'core.wagen',
                    path: 'core/wagen/something/something.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'lager.lieferung',
                    path: 'lager/lieferung/lieferung.ts',
                    line: 6
                },
                to: {
                    artifact: 'lager.manf',
                    path: 'lager/manf/manf.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'common.util',
                    path: 'common/util/foo/bar/blubb.ts',
                    line: 7
                },
                to: {
                    artifact: 'common',
                    path: 'common/something/something/something.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'common.util',
                    path: 'common/util/foo/bar/blubb.ts',
                    line: 7
                },
                to: {
                    artifact: 'lager.manf',
                    path: 'lager/manf/something/something.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'lager.manf',
                    path: 'lager/manf/foo/bar/blubb.ts',
                    line: 7
                },
                to: {
                    artifact: 'core',
                    path: 'core/something/else/something/something.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'lager.manf',
                    path: 'lager/manf/foo/bar/blubb.ts',
                    line: 7
                },
                to: {
                    artifact: null,
                    path: 'what/is/this/even.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'lager.lieferung',
                    path: 'lager/lieferung/foo/bar/blubb.ts',
                    line: 7
                },
                to: {
                    artifact: 'lager.manf',
                    path: 'lager/manf/something/something.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'core',
                    path: 'core/something/with/manf/here.ts',
                    line: 2
                },
                to: {
                    artifact: 'lager',
                    path: 'lager/with/something/manf/here.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'core.wagen',
                    path: 'core/wagen/something.ts',
                    line: 2
                },
                to: {
                    artifact: 'lager',
                    path: 'lager/with/something/manf/here.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'core.wagen',
                    path: 'core/wagen/something.ts',
                    line: 2
                },
                to: {
                    artifact: 'lager.manf',
                    path: 'lager/manf/something/else.ts'
                }
            })
        })
    });

    describe('with a flat architecture', () => {
        beforeEach(() => {
            violation = null

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
                        mayUse: 'entity'
                    },
                    {
                        name: 'entity',
                        include: ['**/domain/*'],
                        mayBeUsedFromAllAbove: true
                    }
                ]
            }

            checker = new DependencyChecker(architecture)
        })

        describe('should report violations if:', () => {
            expectViolation({
                from: {
                    artifact: 'entity',
                    path: '/some/domain/entity.ts',
                    line: 42
                },
                to: {
                    artifact: 'repository',
                    path: '/some/repository/repo.ts',
                }
            })

            expectViolation({
                from: {
                    artifact: 'controller',
                    path: '/some/prefix/web/some-controller.ts',
                    line: 7
                },
                to: {
                    artifact: 'repository',
                    path: '/blabla/other/prefix/repository/some-repository.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'controller',
                    path: '/some/prefix/web/some-controller.ts',
                    line: 7
                },
                to: {
                    artifact: null,
                    path: '/blabla/something/completely/different.ts'
                }
            })

            expectViolation({
                from: {
                    artifact: 'service',
                    path: '/some/other/nested/service/mapper.ts',
                    line: 3
                },
                to: {
                    artifact: 'controller',
                    path: '/some/deeply/nested/web/controller.ts',
                }
            })
        })

        it('should NOT report non violating dependencies', () => {
            violation = checker.checkDependency(
                '/some/prefix/service/some-service.ts',
                dependency('/some/other/prefix/domain/some-entity.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                '/some/prefix/domain/some-entity.ts',
                dependency('/some/other/prefix/domain/another-entity.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                '/some/prefix/service/some-entity.ts',
                dependency('/some/other/prefix/domain/a-domainvalue.dv.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                '/some/prefix/web/some-controller.ts',
                dependency('/some/other/prefix/service/whatever.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                '/some/prefix/web/other.ts',
                dependency('/some/other/prefix/domain/whatever.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                '/some/prefix/service/some-service.ts',
                dependency('/some/other/prefix/repository/repo.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                '/some/thing/that/is/not/defined.ts',
                dependency('/some/other/prefix/service/some-service.ts')
            )
            expect(violation).toBeUndefined()

            violation = checker.checkDependency(
                '/some/prefix/domain/some-service.ts',
                dependency('node_modules:some/service/some-service.ts')
            )
            expect(violation).toBeUndefined()
        })
    })

    function expectViolation(expectedViolation: DependencyViolation): void {
        const {from, to} = expectedViolation

        it(`${from.artifact} accesses ${to.artifact}`, () => {
            violation = checker.checkDependency(from.path, {line: from.line, path: to.path})
            expect(violation).toEqual(expectedViolation)
        })
    }

    function dependency(path: string): Dependency {
        return {path, line: 4}
    }
});