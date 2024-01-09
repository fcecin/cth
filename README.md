# OBSOLETE REPOSITORY

__NOTE__: This project has been moved permanently to https://github.com/FluxBP/cth

The version in this repository is only for __DoH V1__ and will only receive updates as needed to keep supporting it.

# cth: Contract Test Harness for Antelope

cth is a collection of command-line tools that can be customized to build an automated test system for a set of Antelope contracts.

# Requirements

For Antelope testing:

- Perl 5.34 + core Perl libraries (already installed by default in Ubuntu)
- Antelope Leap 4+ (cleos, keosd, nodeos) (https://github.com/antelopeio/leap/releases)
- Antelope CDT 4+ (https://github.com/antelopeio/cdt/releases)
- `git`, `cmake`, `make`, `wget`, `jq` (see `install_dependencies.sh`)
- All programs and data required by your Antelope contracts at compile time and runtime

For DoH testing:

- NodeJS (see `install_dependencies.sh`)

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

If you just run `cth -i`, `cth` will download the entire DoH source code from github and compile it at `cth/local/test`, for the `test` ('hg3/tc3') target, for running tests against it. If, instead, you want to test a local DoH tree that you are using locally to develop and that is already compiled, the current recommended way is:

```
cth -f -i -o doh=YOUR_DOH_DIR -o target=test
```

Replace `YOUR_DOH_DIR` with the absolute path to the directory where you have your DoH installation with the entire DoH source code already fully compiled that you want to test (e.g. `~/doh-contracts`). Hint: if you use `~/` as a prefix, that will ensure the resulting path string is an absolute path.

What `-o doh=YOUR_DOH_DIR -o target=test` does is ensure that the installation pipeline will know to copy your fully-assembled and compiled DoH working directory into the test system to be tested, specifically into the `cth/local/test/` target directory, to run tests configured for the 'hg3/tc3' (i.e. `test`) target. Make sure that the given directory contains DoH source code that is compiled for the `test` ('hg3/tc3') target, or at least any target that isn't `prod` ('hgm/tcn'), since the latter doesn't work with the test system, as it doesn't have test clock and test RNG support.

## Refresh a previous DoH installation faster

If you want to update and recompile the current internal copy of the DoH code, but recompile only the contracts that have changed (which is much faster than recompiling the whole thing) you can use `-o fast=1`:

```
cth -f -i -o target=test -o fast=1
```

This causes the `doh-coldstart` driver's installation script to try and update its current local copy of DoH (by pulling updates from the DoH git repositories) and then only recompile the contracts that have changed. If you use `-o fast=1` then you should not use the `-o doh=...` option as that does not cause the `doh-coldstart` install script to download or compile the code, but instead it instructs the driver to pick up and use your own precompiled DoH copy.

## Workflow trick (dangerous! not recommended)

If you know what you're doing (does anybody? I don't think so), you can develop DoH directly inside of `/cth/local/test/doh-contracts/` after a, say, `cth -i`. After you recompile the contracts that need to be recompiled in there, you can run tests with `cth --run doh-hotstart install '' -f`. This regenerates the `doh-hotstart` chainbase template from the newest `doh-coldstart` wasm/abi tree (which you just illegally doctored) and after that it will run all the tests. This is dangerous because if you accidentally run `--clear`, `--reset`, etc. on the `doh-coldstart` driver, your "working" directory will vanish. It's better to use the previous recipe, above, that copies your DoH work tree into the test system for use.

# How to use

The cth repository is a template. You clone the repository and use it as a basis for building a test suite for your own project.

Using the template as a starting point, you will include tools, testcases and custom test drivers for your project.

You can also create a more specialized template from the cth template, which is then used in the same manner (or some other manner), that is, you can fork this project and create a better test system on top of it.

# Status

cth is currently under development.

This repository is being used to create a concrete test suite for a specific set of smart contracts. The actual reusable components will be extracted later.
