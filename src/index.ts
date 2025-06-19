#!/bin/env node
import {ArchlintCli} from './cli/archlint-cli'
import * as process from 'process'

const exitCode = new ArchlintCli().run()
process.exit(exitCode)
