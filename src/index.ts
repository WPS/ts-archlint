#!/bin/env node
import {ArchlintCli} from "./cli/archlint-cli";

const exitCode = new ArchlintCli().run()
if (exitCode !== 0) {
    process.exitCode = exitCode
}
