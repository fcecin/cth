# cth: Contract Test Harness for Antelope

cth is a collection of command-line tools that can be customized to build an automated test system for a set of Antelope contracts.

# Requirements

- Perl 5.34 + core Perl libraries (already installed by default in Ubuntu) 
- Antelope (cleos, keosd, nodeos) (https://github.com/antelopeio/leap/releases)
- All programs and data required by your Antelope contracts at compile time and runtime

# How to use (TODO)

The cth repository is a template. You clone the repository and use it as a basis for building a test suite for your own project.

Using the template as a starting point, you will include tools, testcases and custom test drivers for your project.

You can also create a more specialized template from the cth template, which is then used in the same manner (or some other manner), that is, you can fork this project and create a better test system on top of it.

# Status

cth is currently under development.

This repository is being used to create a concrete test suite for a specific set of smart contracts. The actual reusable components will be extracted later.

