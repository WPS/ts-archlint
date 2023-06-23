import {PathPattern} from "./path-pattern";

describe(PathPattern.name, () => {
    let pattern: PathPattern

    beforeEach(() => {
        pattern = new PathPattern("**/service/*")
    })

    it('should match correct paths', () => {
        expect(pattern.matches("/some/prefix/service/ThisIsAService")).toBe(true)
        expect(pattern.matches("/some/other/servicePrefix/service/ThisIsToo")).toBe(true)
        expect(pattern.matches("/service/ThisIsToo")).toBe(true)
    })

    it('should NOT match incorrect package', () => {
        expect(pattern.matches("/some/prefix/service1/ThisIsAService")).toBe(false)
        expect(pattern.matches("/some/prefix/entity/ThisIsAService")).toBe(false)
        expect(pattern.matches("/whatever/this/is")).toBe(false)
        expect(pattern.matches("/some/prefix/service/extra/ThisIsAService")).toBe(false)
    })
});