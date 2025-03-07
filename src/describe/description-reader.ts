import {ArchitectureDescription} from './architecture-description'

import schema from '../schema.json'
import {Validator} from 'jsonschema'

export class DescriptionReader {
  readDescription(fileContent: string): ArchitectureDescription {
    const description: ArchitectureDescription = JSON.parse(fileContent)
    const validationResult = new Validator().validate(description, schema as any)

    if (!validationResult.valid) {
      throw new Error(validationResult.toString())
    }

    return description
  }
}