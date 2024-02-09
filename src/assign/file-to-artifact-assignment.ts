import {ArtifactDescription} from "../describe/artifact-description";
import {PathPattern} from "./path-pattern";
import {CodeFile} from "../parse/code-file";

interface ArtifactWithInclude {
    name: string
    include: PathPattern[]
    children: ArtifactWithInclude[]
    fileInside: boolean
}

export class FileToArtifactAssignment {
    private pathToArtifactName = new Map<string, string>()

    private unassignedPaths: string[] = []
    private emptyArtifacts: string[] = []

    static createFrom(artifacts: ArtifactDescription[], files: CodeFile[]): FileToArtifactAssignment {
        return new FileToArtifactAssignment(artifacts, files)
    }

    private constructor(artifacts: ArtifactDescription[], files: CodeFile[]) {
        const withIncludes = artifacts.map(it => this.toArtifactWithInclude(it, []))

        for (const {path} of files) {
            // reverse sorgt dafür, dass das spezifischste zuerst kommt
            const matching = this.findMatchingArtifact(path, withIncludes)
            if (matching) {
                this.pathToArtifactName.set(path, matching.name)
            } else {
                this.unassignedPaths.push(path)
            }
        }

        this.addEmptyArtifacts(withIncludes)
    }

    private addEmptyArtifacts(artifacts: ArtifactWithInclude[]): void {
        for (const artifact of artifacts) {
            if (!artifact.fileInside) {
                this.emptyArtifacts.push(artifact.name)
            } else {
                this.addEmptyArtifacts(artifact.children)
            }
        }
    }

    private toArtifactWithInclude(artifact: ArtifactDescription, parentNames: string[]): ArtifactWithInclude {
        const names = [...parentNames, artifact.name]

        const includePatterns = this.toStringArray(artifact.include).map(it => new PathPattern(it));

        if (includePatterns.length === 0) {
            includePatterns.push(new PathPattern(`**/${artifact.name}/**`))
        }

        return {
            name: names.join('.'),
            include: includePatterns,
            children: (artifact.children ?? []).map(it => this.toArtifactWithInclude(it, names)),
            fileInside: false
        }
    }

    findArtifact(path: string): string | null {
        return this.pathToArtifactName.get(path) ?? null
    }

    getUnassignedPaths(): string[] {
        return [...this.unassignedPaths]
    }

    getEmptyArtifacts(): string[] {
        return [...this.emptyArtifacts]
    }

    private findMatchingArtifact(path: string, artifacts: ArtifactWithInclude[]): ArtifactWithInclude | null {
        for (const artifact of artifacts) {
            const matching = this.findMatching(path, artifact)
            if (matching) {
                return matching
            }
        }

        return null
    }

    private findMatching(path: string, artifact: ArtifactWithInclude): ArtifactWithInclude | null {
        if (!artifact.include.some(it => it.matches(path))) {
            return null
        }
        artifact.fileInside = true

        const matchingChild = this.findMatchingArtifact(path, artifact.children)

        if (matchingChild) {
            return matchingChild
        } else {
            return artifact
        }
    }

    private toStringArray(value: string | string[] | undefined): string[] {
        if (!value) {
            return []
        }

        if ((typeof value === 'string')) {
            return [value]
        } else {
            return value
        }
    }
}