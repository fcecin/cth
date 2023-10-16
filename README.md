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
cth -i -f
```

`cth -i -f` will compile all of the contracts: Antelope system contracts once, and DoH once for the 'test' (hg3/tc3) target. This takes a while, so just leave it running. After all drivers are installed, it will run all tests.

Later, you can invoke it without `-i -f` and it will not recompile the contracts; just run tests.

To do maintanance tasks and not run any tests just omit '-f': call `cth -i` to install all drivers or `cth -c` to clear all drivers and tests.

`cth --help` prints the manual.

# How to use cth to test your DoH code

If you run `cth -i`, `cth` will download the entire DoH source code from github. If, instead, you want to test a local DoH tree that you are using locally to develop, the current recommended way is:

```
cth -f --run coldstart install '' --run doh-coldstart install '--doh YOUR_DOH_DIR --target test' --run doh-hotstart install ''
```

Replace `YOUR_DOH_DIR` with the path to the directory where you have your DoH installation with the entire DoH source code already fully compiled that you want to test (e.g. `~/doh-contracts`).

The `--run coldstart install ''` argument can be ommitted after the first run, since that is downloading and compiling the Antelope system contracts.

The `--run doh-coldstart install '--doh YOUR_DOH_DIR --target test'` copies your DoH directory into the test system for use; specifically into the 'cth/local/test/' target directory (to run tests configured for 'hg3/tc3'). Make sure `YOUR_DOH_DIR` contains tests that are compiled for the test (hg3/tc3) target, or at least any target that isn't production (hgm/tcn) which does not work with the test system since it doesn't have test clock and test RNG support.

Finally, the `--run doh-hotstart install ''` command builds the chainbase so that the `doh-hostart` driver can boot fast DoH tests, and run them in parallel.

# How to use

The cth repository is a template. You clone the repository and use it as a basis for building a test suite for your own project.

Using the template as a starting point, you will include tools, testcases and custom test drivers for your project.

You can also create a more specialized template from the cth template, which is then used in the same manner (or some other manner), that is, you can fork this project and create a better test system on top of it.

# Status

cth is currently under development.

This repository is being used to create a concrete test suite for a specific set of smart contracts. The actual reusable components will be extracted later.
