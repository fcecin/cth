
DoH notes:

This is the default testcase directory for cth.

This directory contains the entire automated test suite for DoH.

For now (October 2023 and onwards), the automated test suite is hard-coded to the 'test' (hg3/tc3) compilation target *only*, and with no support whatsoever for remote execution (cleos-url). If any funky test scenarios are needed, those should be placed in different test dirs (use cth --testdir to select). The main tests will simply ignore switches and options.

TODO: The goal is to have all tests running with a 'doh-hotstart' driver which allows tests to start from a chainbase that is built by the drivers' installer. During installation, the driver can use coldstart to boot the chain, then deploy the DoH contracts, then save the chainbase under /local/hotstart/. When the driver is started, it simply copies the template chainbase to the driver's working directory and starts nodeos from there, resulting in a DoH test that takes zero time to boot the chain and contracts. This also needs a bit of work to prepare for parallelism (i.e. multiple nodeos working directories/chainbases, ports, config.ini files generated, etc).

----

Generic cth notes:

The `tests` directory is a good place to put all your testcases in.

Each testcase should go into its own subdirectory, whose name is the name of test.

Tests should have an executable file called `run` in them, which runs the test. The return value of `run` determines whether the test has succeeded or failed. A return value of zero indicates success, and any other value is a failure.

Tests should work the same whether they are invoked individually from the command-line or by automation. Good tests also work irrespective of the directory they are invoked from.

Tests can receive switches and options from the test runner (cth), which dictate the global environment or situation for the entire test run. Individual tests can inspect those switches and options to decide whether they will self-exclude them from the run (by calling cth_skip_test() from the CthGoodies library, which basically just returns exit code 32, which is picked up by the cth test runner).

Use existing tests for getting started in writing your own tests.
