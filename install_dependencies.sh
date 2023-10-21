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

echo
echo "------------------------------------------------------------------------"
echo "PACKAGE: wget"
echo "  wget is used for downloading files from the web."
echo "------------------------------------------------------------------------"
echo

echo "Checking for package wget ..."

# Check if wget is already installed
if ! command -v wget &> /dev/null; then
    echo "Installing wget..."
    sudo apt-get update
    sudo apt-get install -y wget
    echo "wget is now ready to use! You can use it to download files from the web."
else
    echo "wget is already installed."
fi
