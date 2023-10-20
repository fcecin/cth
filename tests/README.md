
This is the default tests directory for cth.

Each testcase should go into its own subdirectory of the tests directory. The name of the testcase subdirectory is the name of test.

Tests should have an executable file called `run` in their subdirectory, which runs the test. The return value of `run` determines whether the test has succeeded or failed. A return value of zero indicates success, and any other value is a failure. The special return code `32` means the test has market itself as a skipped test (that is, it refused to run).

Tests should work the same whether they are invoked individually from the command-line or by automation. Good tests also work irrespective of the directory they are invoked from.

Tests can receive command-line arguments from cth, namely cth switches (`--switch, -s`) and options (`--option, -o`), which provide a way to configure or customize test runs.

Use existing tests for getting started in writing your own tests.

DoH notes:

This directory contains DoH tests that are being developed to help with the development of cth. The actual, standard DoH tests should be put in each DoH source code repository under `tests/`.

For now (October 2023 and onwards), the automated test suite is hard-coded to the 'test' (hg3/tc3) compilation target *only*, and with no support whatsoever for remote execution (cleos-url). If any funky test scenarios are needed, those should be placed in different test dirs (use cth --testdir to select). The main tests will simply ignore switches and options.

All tests should run with the `doh-hotstart` driver, which allows tests to start from a chainbase that is built by the drivers' installer. During installation, that driver uses the `coldstart` driver to boot the chain, then uses the `doh-coldstart` driver to deploy the DoH contracts, then saves the resulting chainbase to `/local/doh-hotstart/nodeos-template/`. When the `doh-hotstart` driver is started, it simply copies the template chainbase to each test instance's working directory (under `/local/doh-hotstart/instances/INSTANCE_HTTP_PORT_NUMBER/`) and starts nodeos from there, resulting in a DoH test that takes zero time to boot the chain and contracts, and that also runs tests in parallel.

Note that there's support for writing tests in both Javascript and Perl. However, going forward, Javascript is preferred.
