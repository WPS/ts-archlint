import { CycleDetector } from './cycle-detector'
import { Artifact } from './artifact'

describe(CycleDetector.name, () => {
  let detector: CycleDetector

  beforeEach(() => {
    detector = new CycleDetector()
  })

  it('should find no cycles for empty list', () => {
    expect(detector.findCycle([])).toBeNull()
  })

  it('should find no cycles for acyclic graph', () => {
    const artifacts = Artifact.createFrom([
      {
        name: 'a',
        mayUse: ['b', 'c']
      },
      {
        name: 'b',
        mayUse: 'c',
        children: [
          { name: 'd', mayUse: 'c.e' }
        ]
      },
      {
        name: 'c',
        children: [
          { name: 'e' }
        ]
      }
    ])

    expect(detector.findCycle(artifacts)).toBeNull()
  })

  it('should detect simple cycle', () => {
    const [a, b] = Artifact.createFrom([
      {
        name: 'a',
        mayUse: 'b'
      },
      {
        name: 'b',
        mayUse: 'a'
      }
    ])

    expect(detector.findCycle([a, b])).toEqual(['a', 'b', 'a'])
  })

  it('should detect longer cycle', () => {
    const artifacts = Artifact.createFrom([
      {
        name: 'a',
        mayUse: 'b'
      },
      {
        name: 'b',
        mayUse: 'c'
      },
      {
        name: 'c',
        mayUse: 'd'
      },
      {
        name: 'd',
        mayUse: ['e', 'b']
      },
      {
        name: 'e'
      }
    ])

    expect(detector.findCycle(artifacts)).toEqual(['b', 'c', 'd', 'b'])
  })

  it('should detect cycles within child modules', () => {
    const artifacts = Artifact.createFrom([
      {
        name: 'a',
        children: [
          {
            name: 'a1',
            mayUse: 'a2.a22'
          },
          {
            name: 'a2',
            children: [
              {
                name: 'a22',
                mayUse: 'b.b1.b12'
              }
            ]
          }
        ]
      },
      {
        name: 'b',
        children: [
          {
            name: 'b1',
            children: [
              {
                name: 'b12',
                mayUse: 'b.b2'
              }
            ]
          },
          {
            name: 'b2',
            mayUse: 'c.c1'
          }
        ]
      },
      {
        name: 'c',
        children: [
          {
            name: 'c1',
            mayUse: 'a.a2.a22'
          }
        ]
      },
    ])

    expect(detector.findCycle(artifacts)).toEqual(['a.a2.a22', 'b.b1.b12', 'b.b2', 'c.c1', 'a.a2.a22'])
  })
})
