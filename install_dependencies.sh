#!/bin/bash

echo "Will attempt to install required packages using apt-get."

if [ "$EUID" -ne 0 ]; then
    echo "This script requires superuser privileges to perform package installations. Please run:"
    echo "    sudo ./install_dependencies.sh"
    exit 1
fi

echo 
echo "------------------------------------------------------------------------"
echo "PACKAGE: jq"
echo "  jq is used to write testcases. It is used by some of the DoH tests." 
echo "------------------------------------------------------------------------"
echo

echo "Checking for package jq ..."

# Check if jq is already installed
if ! command -v jq &> /dev/null; then
    echo "Installing jq..."
    sudo apt-get update
    sudo apt-get install -y jq
    echo "jq is now ready to use! Enjoy manipulating JSON data in your test code."
else
    echo "jq is already installed."
fi
