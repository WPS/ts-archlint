import {Artifact} from "./artifact";
import {ArtifactDescription} from "../describe/artifact-description";

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
        const child1 = parent2.children[0];

        expect(parent1.name).toBe('parent1')

        expect(parent2.name).toBe('parent2')
        expect(child1.name).toBe('parent2.child1')

        expect(parent1.mayUse(parent2)).toBe(true)
        expect(parent1.mayUse(child1)).toBe(true)
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

        const parent = artifacts[0];
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