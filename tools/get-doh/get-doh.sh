#!/bin/bash

# Define the target directory as the first command-line argument
target_dir="$1"

# Get the script's current directory
script_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -z "$target_dir" ]; then
    echo "Fetches the latest version of the DoH codebase to a specified directory." 
    echo "If the target directory doesn't exist, will download the DoH source code to it."
    echo "If the target directory exists, will assume the DoH source code is already in it"
    echo "  and thus will just update (git fetch/pull) to the latest version if any."
    echo ""
    echo "Usage:"
    echo "   $0 <target_directory>"
    echo ""
    echo "If <target_directory> is relative, it is to this script's path:"
    echo "   $script_dir/"
    echo ""
    echo "If the <target_directory> doesn't exist, then its parent directory must exist."
    echo "Directory $script_dir/../../local/ must exist."
    echo "Directory $script_dir/../../local/tmp/doh-contracts will be deleted if it exists."
    echo ""
    echo "Recommended usage (under cth conventions):"
    echo "   get_doh.sh ../../local/doh-contracts"
    echo ""
    exit 1
fi

# support both relative and absolute target directory
if [[ "$target_dir" == /* ]]; then
  # If $target_dir is an absolute path
  real_target_dir="$(readlink -f "$target_dir")"
else
  # If $target_dir is a relative path, convert it to an absolute path using the get-doh.sh script's location as the relative path source
  real_target_dir="$(readlink -f "$script_dir/$target_dir")"
fi

# Ensure user is not screwing us by setting the target directory to local/tmp/ or something under it
forbidden_dir="$(readlink -f "$script_dir/../../local/tmp")"
if [[ "$real_target_dir" == "$forbidden_dir" || "$real_target_dir" == "$forbidden_dir"/* ]]; then
  echo "ERROR: get-doh: The target directory cannot be within or point to ../../local/tmp or its subdirectories."
  exit 1
fi

# Check if the target directory already exists
if [ -d "$real_target_dir" ]; then
  echo "get-doh: The target directory '$target_dir' already exists (full path: $real_target_dir). Assuming the DoH source code is already downloaded, and will instead attempt to update it."

  # Go to the target directory
  echo "get-doh: Changing working directory to $real_target_dir"
  cd "$real_target_dir" || { echo "ERROR: get-doh: Failed to change directory." && exit 1; }
  for dir in */; do
      if [ -d "$dir/.git" ]; then
          echo "get-doh: updating local DoH repo $dir"
          (cd "$dir" && git pull --all)
      fi
  done
  echo "get-doh: Done trying to update the DoH source code at the target directory."
  exit 0
fi

# Create the tmp directory if it doesn't exist
tmp_dir="../../local/tmp"
real_tmp_dir="$(readlink -f "$tmp_dir")"
echo "get-doh: Creating directory '$tmp_dir' (full path: $real_tmp_dir)"
mkdir -p "$real_tmp_dir" || { echo "ERROR: get-doh: Failed to create path: $real_tmp_dir" && exit 1; }

# Create the target directory; fails if parent doesn't exist yet (on purpose)
echo "get-doh: Creating target directory '$target_dir' (full path: $real_target_dir)" 
if ! mkdir "$real_target_dir"; then
  echo "ERROR: get-doh: Failed to create the target directory."
  exit 1
fi

# Check if tmp/doh-contracts already exists and remove it if it does
if [ -d "$real_tmp_dir/doh-contracts" ]; then
  echo "Removing existing $real_tmp_dir/doh-contracts directory..."
  rm -rf "$real_tmp_dir/doh-contracts"
fi

# Clone doh-contracts to ../../local/tmp/doh-contracts
echo "get-doh: Downloading doh-contracts to $real_tmp_dir"
git clone https://github.com/CryptoMechanics/doh-contracts "$real_tmp_dir/doh-contracts"  || { echo "ERROR: get-doh: Failed to clone doh-contracts." && exit 1; }

echo "get-doh: Computing DoH repository list ..."

# get list of directories in doh-contracts, so that we can clone them
cd "$real_tmp_dir/doh-contracts" || { echo "ERROR: get-doh: Failed to change directory." && exit 1; }
directories=()
for dir in */; do
  dir="${dir%/}"
  if [ -d "$dir/.git" ]; then
    echo "Found DoH directory with .git subdirectory: $dir"
    directories+=("$dir")
  fi
done

# Directories to check and add if missing (the ones we already know about)
desired_directories=(
  "doh-clock-contract"
  "doh-common-code"
  "doh-config-files"
  "doh-crafting-contract"
  "doh-dejavu-contract"
  "doh-deployment-script"
  "doh-distrib-contract"
  "doh-drip-contract"
  "doh-hegemon-contract"
  "doh-logs-contract"
  "doh-market-contract"
  "doh-meta-contract"
  "doh-military-contract"
  "doh-names-contract"
  "doh-politics-contract"
  "doh-readonly-contract"
  "doh-research-contract"
  "doh-staking-contract"
  "doh-unit-tests"
  "sighandler-contract"
  "sighandler-token-contract"
)

# Check and add any missing directories
for desired_dir in "${desired_directories[@]}"; do
  if [[ ! " ${directories[@]} " =~ " $desired_dir " ]]; then
    echo "Adding missing DoH directory: $desired_dir"
    directories+=("$desired_dir")
  fi
done

# Copy files from ../../local/tmp/doh-contracts to the target directory
echo "get-doh: Copying doh-contracts scripts to $real_target_dir"
cp -v "$real_tmp_dir"/doh-contracts/* "$real_target_dir"

# Go to the target directory
echo "get-doh: Changing working directory to $real_target_dir"
cd "$real_target_dir" || { echo "ERROR: get-doh: Failed to change directory." && exit 1; }

# Clone all repositories in the directories-with-.git found under the doh-contracts clone,
#   merged with the explicit list we have above
echo "get-doh: Cloning all DoH repositories to $real_target_dir"
for dir in "${directories[@]}"; do
  echo "Cloning https://github.com/CryptoMechanics/$dir ...";
  git clone --recursive "https://github.com/CryptoMechanics/$dir" || { echo "ERROR: get-doh: Failed to clone DoH repo $dir." && exit 1; }
done

echo "get-doh: Success. Full DoH source code tree is assembled under $real_target_dir"
