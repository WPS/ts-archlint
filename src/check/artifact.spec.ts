import { Artifact } from './artifact'
import { ArtifactDescription } from '../describe/artifact-description'
import { describe, expect, it } from 'vitest'

describe(Artifact.name, () => {
  it('should setup mayUse for children', () => {
    const descriptions: ArtifactDescription[] = [
      {
        name: 'parent1',
        mayUse: 'parent2'
      },
      {
        name: 'parent2',
        children: [
          {name: 'child1'}
        ]
      }
    ]

    const [parent1, parent2] = Artifact.createFrom(descriptions)
    const child1 = parent2.children[0]

    expect(parent1.name).toBe('parent1')

    expect(parent2.name).toBe('parent2')
    expect(child1.name).toBe('parent2.child1')

    expect(parent1.mayUse(parent2)).toBe(true)
    expect(parent1.mayUse(child1)).toBe(true)
  })

  it('children should inherit mayUse clauses from parents', () => {
    const descriptions: ArtifactDescription[] = [
      {
        name: 'parent1',
        mayUse: 'common.common1',
        children: [
          {
            name: 'module1',
            mayUse: 'parent2.module2'
          }
        ]
      },
      {
        name: 'parent2',
        mayUse: ['common.common1', 'common.common2'],
        children: [
          {
            name: 'module2'
          }
        ]
      },
      {
        name: 'common',
        children: [
          {
            name: 'common1'
          },
          {
            name: 'common2'
          },
          {
            name: 'common3',
            mayBeUsedFromAllAbove: true, // but only on this level
          }
        ]
      }
    ]

    const [parent1, parent2, common] = Artifact.createFrom(descriptions)

    const [common1, common2, common3] = common.children

    const module1 = parent1.children[0]
    expect(module1.name).toBe('parent1.module1')
    expect(module1.mayUse(common1)).toBe(true)
    expect(module1.mayUse(common2)).toBe(false)
    expect(module1.mayUse(common3)).toBe(false)

    const module2 = parent2.children[0]
    expect(module2.name).toBe('parent2.module2')
    expect(module2.mayUse(common1)).toBe(true)
    expect(module2.mayUse(common2)).toBe(true)
    expect(module2.mayUse(common3)).toBe(false)


    expect(module1.mayUse(module2)).toBe(true)
    expect(module2.mayUse(module1)).toBe(false)
  })

  it('should name correctly from nested description', () => {
    const description: ArtifactDescription = {
      name: 'one',
      children: [
        {
          name: 'two',
          children: [
            {
              name: 'three',
              children: [
                {
                  name: 'four'
                }
              ]
            }
          ]
        }
      ]
    }

    const artifacts = Artifact.createFrom([description])
    expect(artifacts.length).toBe(1)

    const parent = artifacts[0]
    expect(parent.name).toBe('one')

    const firstChild = getSingleChild(parent)
    expect(firstChild.name).toBe('one.two')

    const secondChild = getSingleChild(firstChild)
    expect(secondChild.name).toBe('one.two.three')

    const thirdChild = getSingleChild(secondChild)
    expect(thirdChild.name).toBe('one.two.three.four')
  })

  function getSingleChild(parent: Artifact): Artifact {
    expect(parent.children.length).toBe(1)
    return parent.children[0]
  }
})
