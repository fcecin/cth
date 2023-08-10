# cth: Contract Test Harness for Antelope

cth is a collection of command-line tools that can be customized to build an automated test system for a set of Antelope contracts.

# Requirements

- Perl 5.34 + core Perl libraries (already installed by default in Ubuntu) 
- Antelope (cleos, keosd, nodeos) (https://github.com/antelopeio/leap/releases)
- All programs and data required by your Antelope contracts at compile time and runtime

# DoH cth: how to download and run for the first time

```
git clone --recursive https://github.com/fcecin/cth
cd cth
sudo ./install_dependencies.sh
cth -i
```

`cth -i` will compile all of the contracts: Antelope system contracts once, and DoH three times, one for each target: hgm, hg1, hg2. This takes a while, so just leave it running. After all drivers are installed, it will run all tests.

To do maintanance tasks and not run any tests, give it a dummy test name, e.g. `cth -i dummy` to install all drivers or `cth -c dummy` to clear all drivers and tests.

Later, you can invoke it without `-i` and it will not recompile the contracts; just run tests.

`cth --help` prints the manual.

# How to use

The cth repository is a template. You clone the repository and use it as a basis for building a test suite for your own project.

Using the template as a starting point, you will include tools, testcases and custom test drivers for your project.

You can also create a more specialized template from the cth template, which is then used in the same manner (or some other manner), that is, you can fork this project and create a better test system on top of it.

# Status

cth is currently under development.

This repository is being used to create a concrete test suite for a specific set of smart contracts. The actual reusable components will be extracted later.

