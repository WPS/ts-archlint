import { DescriptionReader } from './description-reader'
import { ArchitectureDescription } from './architecture-description'
import { ArtifactDescription } from './artifact-description'
import { beforeEach, describe, expect, it } from 'vitest'

describe(DescriptionReader.name, () => {
  let reader: DescriptionReader

  let description: Partial<ArchitectureDescription> | any
  let artifact: Partial<ArtifactDescription> | any

  beforeEach(() => {
    reader = new DescriptionReader()

    description = {
      name: 'hallo',
      artifacts: [ {
        name: 'artifact1',
      } ]
    }

    artifact = description.artifacts[0]
  })

  it('should read valid description', () => {
    expect(reader.readDescription(JSON.stringify(description))).toEqual(description)
  })

  describe('should fail if', () => {
    it('the description name is missing', () => {
      description.name = undefined
      expectError()
    })

    it('the description name contains points ', () => {
      description.name = 'name.'
      expectError()
    })

    it('the artifact name contains points', () => {
      artifact.name = 'name.'
      expectError()
    })

    it('if an unknown property in the descriptions exists', () => {
      description['unknown'] = 666
      expectError()
    })

    it('if an unknown property in the artifact exists', () => {
      artifact['otherUnknown'] = 42
      expectError()
    })
  })

  function expectError(): void {
    expect(() => reader.readDescription(JSON.stringify(description))).toThrowError()
  }
})
