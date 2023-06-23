import {ArchitectureDescription} from "./architecture-description";

export class DescriptionReader {

    readDesription(fileContent: string): ArchitectureDescription {
        const description: Partial<ArchitectureDescription> & unknown = JSON.parse(fileContent)
        if (!description.name) {
            throw new Error("name is required!")
        }

        if (!description.artifacts) {
            throw new Error("artifacts are required")
        }

        return {
            name: description.name,
            artifacts: description.artifacts,
            ...description
        }
    }
}