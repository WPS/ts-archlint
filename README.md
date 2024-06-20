# Archlint

Simple linter for enforcing architecture rules in typescript.

## Getting Started

- Install via `npm install --save-dev ts-archlint`
- Create a folder `.archlint` to store the JSON-description(s) of the architecture
- Create the JSON-descriptions in this folder (see below)
- Run via `node ./node_modules/ts-archlint/dist/index.js ../src/app` where '/src/app' is your main source folder

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