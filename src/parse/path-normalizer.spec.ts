import { PathNormalizer } from './path-normalizer'
import { RawCodeFile } from './raw-code-file'
import { CodeFile } from './code-file'
import { ImportRemaps } from '../common/import-remaps'

describe(PathNormalizer.name, () => {
  it('should normalize a file without dependencies', () => {
    const normalizer = new PathNormalizer()

    const raw: RawCodeFile = {
      path: 'path/to/file.ts',
      lines: 6,
      dependencies: []
    }
    const expected: CodeFile = {
      path: 'path/to/file.ts',
      lines: 6,
      dependencies: []
    }

    expect(normalizer.normalize(raw)).toEqual(expected)
  })

  it('should join relative paths', () => {
    const normalizer = new PathNormalizer()

    const raw: RawCodeFile = {
      path: 'path\\to\\file.ts', // works even with windows separators
      lines: 6,
      dependencies: [
        {
          importFrom: '../other/file2',
          line: 2
        },
        {
          importFrom: '@angular/common',
          line: 3
        },

        {
          importFrom: './deeper/file3',
          line: 4
        },
      ]
    }
    const expected: CodeFile = {
      path: 'path/to/file.ts',
      lines: 6,
      dependencies: [
        {
          path: 'path/other/file2.ts',
          line: 2
        },
        {
          path: 'node_modules/@angular/common',
          line: 3
        },
        {
          path: 'path/to/deeper/file3.ts',
          line: 4
        },
      ]
    }

    expect(normalizer.normalize(raw)).toEqual(expected)
  })

  it('should apply import remaps', () => {
    const tsConfigImportRemaps: ImportRemaps = {
      'mapped-import-path': 'target/of/mapping'
    }

    const normalizer = new PathNormalizer(tsConfigImportRemaps)

    const raw: RawCodeFile = {
      path: 'path\\to\\file.ts', // works even with windows separators
      lines: 7,
      dependencies: [
        {
          importFrom: 'mapped-import-path/some/file4',
          line: 1
        },
        {
          importFrom: './mapped-import-path/other/file2', // should not be mapped
          line: 2
        },
        {
          importFrom: '@angular/common',
          line: 3
        },
      ]
    }
    const expected: CodeFile = {
      path: 'path/to/file.ts',
      lines: 7,
      dependencies: [
        {
          path: 'target/of/mapping/some/file4.ts',
          line: 1
        },
        {
          path: 'path/to/mapped-import-path/other/file2.ts',
          line: 2
        },
        {
          path: 'node_modules/@angular/common',
          line: 3
        },
      ]
    }

    expect(normalizer.normalize(raw)).toEqual(expected)
  })

  it('should replace paths included in tsConfigImportRemaps and remove leading slash', () => {
    const tsConfigImportRemaps: ImportRemaps = {
      'mapped-import-path': 'target/of/mapping'
    }

    const normalizer = new PathNormalizer(tsConfigImportRemaps)

    const raw: RawCodeFile = {
      path: 'path/to/file.ts',
      lines: 15,
      dependencies: [
        {
          importFrom: '/mapped-import-path/test',
          line: 1
        },
      ]
    }
    const expected: CodeFile = {
      path: 'path/to/file.ts',
      lines: 15,
      dependencies: [
        {
          path: 'target/of/mapping/test.ts',
          line: 1
        },
      ]
    }

    expect(normalizer.normalize(raw)).toEqual(expected)
  })
})
