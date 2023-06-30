export function lastOf<T>(list: T[]): T | undefined {
    return list[list.length - 1]
}