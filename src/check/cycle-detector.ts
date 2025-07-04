import { Artifact } from './artifact'


export class CycleDetector {
  findCycle(artifacts: Artifact[]): string[] | null {
    const allArtifacts = artifacts.flatMap(it => this.allArtifacts(it))


    const adjacency = this.createAdjacencyMatrix(allArtifacts)

    for (const artifact of allArtifacts) {
      const cycle = this.findCycleFrom(artifact.name, adjacency)

      if (cycle) {
        return cycle
      }
    }

    return null
  }

  private allArtifacts(artifact: Artifact): Artifact[] {
    return [artifact, ... artifact.children.flatMap(it => this.allArtifacts(it))]
  }

  private findCycleFrom(current: string, adjacency: Map<string, string[]>, visited: string[] = []): string[] | null {
    const index = visited.indexOf(current)

    if (index > -1) {
      return [... visited.slice(index), current]
    }

    for (const next of adjacency.get(current) ?? []) {
      const cycleRecursive = this.findCycleFrom(next, adjacency, [... visited, current])

      if (cycleRecursive) {
        return cycleRecursive
      }
    }
    return null
  }

  private createAdjacencyMatrix(artifacts: Artifact[]): Map<string, string[]> {
    const adjacency = new Map<string, string[]>()

    for (const one of artifacts) {
      for (const other of artifacts) {
        if (other === one || !one.mayUse(other)) {
          continue
        }

        const list = adjacency.get(one.name)
        if (!list) {
          adjacency.set(one.name, [other.name])
        } else {
          list.push(other.name)
        }
      }
    }
    return adjacency
  }
}
