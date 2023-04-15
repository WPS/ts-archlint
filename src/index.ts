#!/bin/env node

// https://dev.to/scooperdev/use-npm-pack-to-test-your-packages-locally-486e
export function hello(): string {
    console.log('Hello!')

    return 'Hello!'
}

const [node, filePath, ...args] = process.argv

console.log(args)
