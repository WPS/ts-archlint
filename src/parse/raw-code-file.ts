import { RawDependency } from './raw-dependency'

export type RawCodeFile = {
  path: string
  lines: number
  dependencies: RawDependency[]
}
