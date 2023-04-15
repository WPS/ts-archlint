export class PathPattern {
    private readonly regex: RegExp

    constructor(pattern: string) {
        const regexString = pattern
            .split("**").join(".+")
            .split("*").join("[^/\\\\]+")

        this.regex = RegExp("^" + regexString + "$")
    }

    matches(path: string): boolean {
        console.log(this.regex, path)
        return this.regex.test(path)
    }
}