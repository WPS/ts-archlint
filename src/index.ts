#!/bin/env node
import {ArchlintCli} from "./cli/archlint-cli";

(async () => {
    const exitCode = await new ArchlintCli().run()
    if (exitCode !== 0) {
        process.exitCode = exitCode
    }
})()
