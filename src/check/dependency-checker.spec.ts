import {DependencyChecker} from "./dependency-checker";
import {ArchitectureDescription} from "../describe/architecture-description";
import {DependencyViolation} from "./dependency-violation";
import {Dependency} from "../parse/dependency";

describe(DependencyChecker.name, () => {
    let architecture: ArchitectureDescription
    let checker: DependencyChecker

    let violation: DependencyViolation | null

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
                    include: ['**/service/*'],
                    mayUseAllBelow: true
                },
                {
                    name: 'repository',
                    include: ['**/repository/*'],
                    mayUse: ['entity']
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

        function expectViolation(expectedViolation: DependencyViolation): void {
            const {from, to} = expectedViolation

            it(`${from.artifact} accesses ${to.artifact}`, () => {
                violation = checker.check(from.path, {line: from.line, path: to.path})
                expect(violation).toEqual(expectedViolation)
            })
        }
    })

    it('should NOT report non violating dependencies', () => {
        violation = checker.check(
            '/some/prefix/service/some-service.ts',
            dependency('/some/other/prefix/domain/some-entity.ts')
        )
        expect(violation).toBeUndefined()

        violation = checker.check(
            '/some/prefix/domain/some-entity.ts',
            dependency('/some/other/prefix/domain/another-entity.ts')
        )
        expect(violation).toBeUndefined()

        violation = checker.check(
            '/some/prefix/service/some-entity.ts',
            dependency('/some/other/prefix/domain/a-domainvalue.dv.ts')
        )
        expect(violation).toBeUndefined()

        violation = checker.check(
            '/some/prefix/web/some-controller.ts',
            dependency('/some/other/prefix/service/whatever.ts')
        )
        expect(violation).toBeUndefined()

        violation = checker.check(
            '/some/prefix/web/other.ts',
            dependency('/some/other/prefix/domain/whatever.ts')
        )
        expect(violation).toBeUndefined()

        violation = checker.check(
            '/some/prefix/service/some-service.ts',
            dependency('/some/other/prefix/repository/repo.ts')
        )
        expect(violation).toBeUndefined()

        violation = checker.check(
            '/some/thing/that/is/not/defined.ts',
            dependency('/some/other/prefix/service/some-service.ts')
        )
        expect(violation).toBeUndefined()

        violation = checker.check(
            '/some/prefix/domain/some-service.ts',
            dependency('node_modules:some/service/some-service.ts')
        )
        expect(violation).toBeUndefined()
    })

    function dependency(path: string): Dependency {
        return {path, line: 4}
    }
});