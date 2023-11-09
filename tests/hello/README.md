This directory demonstrates how to test any Antelope contract using `cth` and the Javascript test library.

It is currently using the `doh-hotstart` cth test driver (which is what DoHTestFixture.js/DoHTest.js use internally) which deploys DoH from a cached data directory, which is much faster than the `coldstart` driver (a `hotstart` driver for generic Antelope contract testing will be developed at some point). The `run_perl` file is an alternative test file that shows how to start the coldstart driver instead, which doesn't have DoH but is much slower.

A full `cth` driver installation step is required first: `cth -i`.

Afterwards, to run this test only, use: `cth hello-world`. The test always recompiles the sample contract cpp file at the beginning of the test, and there's no need to reinstall any test drivers while developing and testing it.
