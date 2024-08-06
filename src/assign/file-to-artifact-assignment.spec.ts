import {FileToArtifactAssignment} from "./file-to-artifact-assignment";
import {ArtifactDescription} from "../describe/artifact-description";
import {CodeFile} from "../parse/code-file";
import {Dependency} from "../parse/dependency";
import {ArchitectureDescription} from "../describe/architecture-description";

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
      },
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
    ].map(path => ({path, dependencies: [] as Dependency[]} as CodeFile))

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

  it('should not warn for empty artifacts if the artifact is referenced via dependency', () => {
    const files: CodeFile[] = [
      {
        path: 'one/file/inside.ts',
        dependencies: [
          {
            path: 'node_modules/library-one',
            line: 3,
          },
          {
            path: 'node_modules/library-two',
            line: 4,
          }
        ],
        lines: 89
      },
    ]

    const artifacts: ArtifactDescription[] = [
      {
        name: "one",
        include: "one/**"
      },
      {
        name: "library-one",
        include: "node_modules/library-one"
      },
      {
        name: 'other-libraries',
        include: "node_modules/**"
      }
    ]

    const description: ArchitectureDescription = {
      name: 'assignment',
      artifacts,
    }

    const assignment = FileToArtifactAssignment.createFrom(description, files)

    expect(assignment.findArtifact('one/file/inside.ts')).toBe('one')
    expect(assignment.findArtifact('node_modules/library-one')).toBe('library-one')
    expect(assignment.findArtifact('node_modules/library-two')).toBe('other-libraries')
    expect(assignment.getEmptyArtifacts()).toEqual([])
  })
})