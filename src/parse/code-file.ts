import {Dependency} from "./dependency";

export interface CodeFile {
    path: string
    dependencies: Dependency[]
}