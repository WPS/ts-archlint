import {ArchitectureDescription} from "./architecture-description";
import {ArchlintConfig} from "./archlint-config";

export class DescriptionReader {
    constructor(private config: ArchlintConfig) {
    }

    readDesription(fileContent: string): ArchitectureDescription {
        // TODO validation

        return JSON.parse(fileContent)
    }
}