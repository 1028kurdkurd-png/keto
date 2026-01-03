#!/usr/bin/env bash
# Helper to create the pull request using gh (GitHub CLI) if available,
# otherwise prints the manual URL to open in a browser.

BRANCH=feature/netlify-safety
REPO_URL="https://github.com/1028kurdkurd-png/menu/pull/new/${BRANCH}"

if command -v gh >/dev/null 2>&1; then
  echo "gh CLI detected — creating PR..."
  gh pr create --fill --head ${BRANCH} || {
    echo "gh pr create failed; opening manual URL instead: ${REPO_URL}"
  }
else
  echo "gh not found on PATH. Open this URL to create the PR manually:"
  echo "${REPO_URL}"
fi
