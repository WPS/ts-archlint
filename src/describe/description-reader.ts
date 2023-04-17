import {ArchitectureDescription} from "./architecture-description";

export class DescriptionReader {
    readDesription(fileContent: string): ArchitectureDescription {
        // TODO validation
        return JSON.parse(fileContent)
    }
}