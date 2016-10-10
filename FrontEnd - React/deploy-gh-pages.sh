#!/bin/bash
set -e
npm run build
mv dist gh-pages
git add gh-pages
git commit -m "Updated gh-pages from master"
git subtree push --prefix gh-pages origin gh-pages