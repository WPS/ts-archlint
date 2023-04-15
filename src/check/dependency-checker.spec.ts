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
                    connectTo: ['service', 'entity']
                },
                {
                    name: 'service',
                    include: ['**/service/*'],
                    relaxed: true
                },
                {
                    name: 'repository',
                    include: ['**/repository/*'],
                    connectTo: ['entity']
                },
                {
                    name: 'entity',
                    include: ['**/domain/*']
                }
            ]
        }

        checker = new DependencyChecker(architecture)
    })

    it('should report violating controller dependencies', () => {
        violation = checker.check(
            '/some/prefix/web/some-controller.ts',
            {path: '/blabla/other/prefix/repository/some-repository.ts', line: 7}
        )
        expect(violation).toEqual({
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
            '/some/prefix/service/some-service.ts',
            dependency('/some/other/thing/that/is/not/defined.ts')
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