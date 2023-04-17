#!/bin/env node
import {ArchlintCli} from "./cli/archlint-cli";

(async () => {
    await new ArchlintCli().run()
})()
