#!/bin/bash
set -e
npm run build
mv dist gh-pages
git add gh-pages
git config --global user.email "CirleCI@unfollowninja.fr"
git config --global user.name "CirleCI"
git commit -m "Updated gh-pages from master"
cd ..
git subtree push --prefix "FrontEnd - React/gh-pages" origin gh-pages