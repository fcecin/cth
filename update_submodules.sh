#!/bin/bash

# Check if the repository is on the main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
  echo "ERROR: Not on the main branch. Please switch to the main branch."
  exit 1
fi

# Check if there are any pending changes in the local repository
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: There are pending changes in the repository. Please commit or stash them before proceeding."
  exit 1
fi

# Check if the main branch is up to date with the remote
git fetch origin
local_commits=$(git rev-list HEAD..origin/main --count)
if [ "$local_commits" -ne 0 ]; then
  echo "ERROR: The main branch is not up to date with the remote. Please pull the latest changes."
  exit 1
fi

echo "Everything is good. The local repository is clean, on the main branch, and up to date with the remote."

echo "Fetching and merging changes from all submodules..."

# Save the current commit hash of the submodule
OLD_COMMIT=$(git submodule status | awk '{print $1}')

# Update the submodule
git submodule update --remote --merge

# Save the new commit hash of the submodule after update
NEW_COMMIT=$(git submodule status | awk '{print $1}')

# Compare the old and new commit hashes
if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
  echo "Submodule is up to date, no changes made."
else
  echo "Submodule has been updated and changes have been merged."

  # in this case, commit and push them
fi




