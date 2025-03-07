import {Dependency} from './dependency'

export interface CodeFile {
  path: string
  lines: number
  dependencies: Dependency[]
}