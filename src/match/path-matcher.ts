import {PathPattern} from "./path-pattern";

export class PathMatcher {
    static matches(path: string, pattern: PathPattern): boolean {
        return path === pattern
    }

    static matchesAny(path: string, patterns: PathPattern[] | undefined): boolean {
        return patterns != null && patterns.some(pattern => PathMatcher.matches(path, pattern))
    }
}