export class PathPattern {
    private readonly regex: RegExp

    constructor(pattern: string) {
        const regexString = pattern
            .split("**").join(".+")
            .split("*").join("[^/\\\\]+")

        this.regex = RegExp("^" + regexString + "$")
    }

    matches(path: string): boolean {
        return this.regex.test(path)
    }
}