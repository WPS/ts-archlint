# ts-archlint

Simple linter for enforcing architecture rules in typescript. Can be added to any existing lint-step with minimal
overhead.

https://github.com/WPS/ts-archlint

## Core principles

### simple

Only does what it needs to do, even if that means missing a few edge cases.

### fast

Adding archlint to a project should not measurably slow down an existing lint step.

### strict

Everything that is not explicitly allowed is forbidden.

### concise

The error output aims to be as clear and concise as possible.

## What it can't do (yet)

For now, the imports are only determined via regex match. That is simple and very fast but might cause problems or
inaccuracies when imports don't look as expected. For the projects it was used on so far, this was good enough.

A slower more accurate parsing mode with actual typescript parsing might be added in the future.

Only `.ts`-files are supported for now.

A file is the smallest unit this tool recognizes. If you want to check dependencies between individual classes or
functions they need to reside in individual files.

## Getting Started

- Install via `npm install --save-dev ts-archlint`
- Create a folder `.archlint` to store the JSON-description(s) of the architecture
- Create the JSON-descriptions in this folder (see below)
- Run via `npx ts-archlint ./src/app` where './src/app' is your main source folder

## Architecture description

The architecture description files describe an aspect of the architecture using artifacts. You might also call these
modules.

Artifacts `include` a set of files based on the include pattern and each of those files must reside in an artifact that
is explicitly permitted via the `mayUse` property.

Multiple files may model multiple aspects of an architecture.

### File structure example

```json
{
  "$schema": "../node_modules/ts-archlint/dist/schema.json",
  "name": "technical-layers",
  "failOnUnassigned": true,
  "exclude": [
    "node_modules/**",
    "**.spec.ts"
  ],
  "artifacts": [
    {
      "name": "module",
      "include": [
        "**/*.module.ts"
      ],
      "mayUseAllBelow": true
    },
    {
      "name": "component",
      "include": [
        "**/component/**"
      ],
      "mayUse": [
        "service",
        "domain"
      ]
    },
    {
      "name": "service",
      "include": [
        "**/service/**"
      ],
      "mayUse": "domain"
    },
    {
      "name": "domain",
      "include": "**/domain/**",
      "mayBeUsedFromAllAbove": true
    }
  ]
}
```

### Artifact names

Each artifact has a short name as set by the `name` property
An artifacts full name (for reference in `mayUse`) includes those of their parents, separated by dots.

The full name of an artifact named `child1` that is the child of the artifact `parent` is named `parent.child1`.

Siblings may reference each other by the short name.

### Includes

The includes match the full file paths including the name and support simple patterns: `**` matches anything, `*`
matches anything except for slashes.

If omitted the `include` pattern defaults to `**/{{artifact-name}}/**` where `{{artifact-name}}` is the short name of
the artifact. This is useful when the artifact is named exactly like its corresponding folder.

Files that are imported from dependency libraries are prefixed with `node-modules/` to allow easier handling.

### Excludes

Some files may be excluded from the architecture, a common use case would be the exclusion of external dependencies (
`node-modules/**`) or tests (`**.spec.ts`).

### Ignoring dependency violations

Violations can be temporarily ignored as follows:

```
"ignoreDependencies": {
  "one/module/file1.ts": "other/module/file2.ts",
  "one/module/file3.ts": "other/module/**",
  "one/module/**": [
    "other/module/file1.ts",
    "other/module/folder/*"
  ]
},
```

This ignores all violations in the direction they are stated (left to right is ignored, the other way would have to be
explicitly stated).

This option supports patterns.

### Cycle detection

Per default, cycles between artifacts are not allowed.

This can be disabled with the `ignoreArtifactCycles` config property.
