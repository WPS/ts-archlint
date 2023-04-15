#!/bin/env node
import {DependencyParser} from "./parse/dependency-parser";

const [nodePath, jsPath, targetPath] = process.argv

async function main() {
    const parsed = await new DependencyParser(targetPath).parseFiles()
    //console.log(JSON.stringify(parsed))
}

(async () => {
    await main()
})()
