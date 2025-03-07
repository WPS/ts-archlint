import {FileToArtifactAssignment} from './file-to-artifact-assignment'
import {ArtifactDescription} from '../describe/artifact-description'
import {CodeFile} from '../parse/code-file'

describe(FileToArtifactAssignment.name, () => {
  let artifacts: ArtifactDescription[]

  beforeEach(() => {
    artifacts = [
      {
        name: 'one',
        include: 'one/**',
        children: [
          {
            name: 'child1',
            include: '**/child1/**'
          },
          {
            name: 'child2',
            // per Default '**/child2/**'
          },
        ]
      },
      {
        name: 'two',
        include: 'two/**',
        children: [
          {name: 'child1'},
          {
            name: 'child2',
            children: [
              {name: 'grandchild1'}
            ]
          },
        ]
      }
    ]
  })

  it('should assign files', () => {
    const files = [
      'one/file/inside.ts',
      'two/files/inside.ts',

      'one/child1/file.ts',
      'one/child2/file.ts',
      // no two/child1
      'two/child2/file.ts',

      'two/child2/grandchild1/file.ts',
      'one/child2/grandchild1/file.ts',

      'three/child1/file.ts',
      'three/child2/file.ts',
      'four/child3/file.ts'
    ]

    const assignment = FileToArtifactAssignment.createFrom({
      name: 'test',
      exclude: [
        '**four**'
      ],
      artifacts,
    }, files)

    expect(assignment.findArtifact('one/file/inside.ts')).toEqual('one')
    expect(assignment.findArtifact('two/files/inside.ts')).toEqual('two')

    expect(assignment.findArtifact('one/child1/file.ts')).toEqual('one.child1')
    expect(assignment.findArtifact('one/child2/file.ts')).toEqual('one.child2')
    expect(assignment.findArtifact('two/child2/file.ts')).toEqual('two.child2')

    expect(assignment.findArtifact('two/child2/grandchild1/file.ts')).toEqual('two.child2.grandchild1')
    expect(assignment.findArtifact('one/child2/grandchild1/file.ts')).toEqual('one.child2')

    expect(assignment.findArtifact('three/child1/file.ts')).toBeNull()
    expect(assignment.findArtifact('three/child2/file.ts')).toBeNull()
    expect(assignment.findArtifact('four/child1/file.ts')).toBeNull()

    expect(assignment.getEmptyArtifacts()).toEqual(['two.child1'])
    expect(assignment.getUnassignedPaths()).toEqual([
      'three/child1/file.ts',
      'three/child2/file.ts'
    ])
  })
})