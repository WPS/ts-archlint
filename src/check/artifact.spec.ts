import {Artifact} from "./artifact";
import {ArtifactDescription} from "../describe/artifact-description";

describe(Artifact.name, () => {
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