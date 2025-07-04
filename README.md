# Archlint

Simple linter for enforcing architecture rules in typescript.

## Core principles

### simple

Only does what it needs to do, even if that means missing a few edge cases.

### fast

Adding archlint to a project should not measurably slow down an existing lint step.

### strict

Everything that is not explicitly allowed is forbidden.


### concise

The error output aims to be as clear and concise as possible

## Getting Started

- Install via `npm install --save-dev ts-archlint`
- Create a folder `.archlint` to store the JSON-description(s) of the architecture
- Create the JSON-descriptions in this folder (see below)
- Run via `npx ts-archlint ./src/app` where './src/app' is your main source folder

## File structure

### Example

```json
{
  "$schema": "../node_modules/ts-archlint/dist/schema.json",
  "name": "technical-layers",
  "failOnUnassigned": true,
  "exclude": [
    "node_modules**",
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

## Ignoring dependency violations

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

Patterns can be used on both sides (* matches anything except slashes, ** matches anything).
