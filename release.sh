#!/usr/bin/bash
set -eou pipefail

VERSION="$1"

echo "Release with Version $VERSION"

sed -i "s/0.0.0-SNAPSHOT/$VERSION/" package.json
echo "Building"
npm run build
echo "Publishing to npm"
npm publish
echo "Tagging git"
git tag $VERSION
git checkout HEAD -- package.json
echo "Release $VERSION done"
