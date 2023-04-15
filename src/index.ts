#!/bin/env node
import {DependencyParser} from "./parse/dependency-parser";

const [node, filePath, ...args] = process.argv

async function main() {
    console.log(filePath, args)
    const parsed = await new DependencyParser().parseFile('../src/parse/dependency-parser.ts')
    console.log(parsed)
}

(async () => {
    await main()
})()
