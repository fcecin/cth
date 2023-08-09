
The `tests` directory is a good place to put all your testcases in.

Each testcase should go into its own subdirectory, whose name is the name of test.

Tests should have an executable file called `run` in them, which runs the test. The return value of `run` determines whether the test has succeeded or failed. A return value of zero indicates success, and any other value is a failure.

Tests should work the same whether they are invoked individually from the command-line or by automation. Good tests also work irrespective of the directory they are invoked from.

Tests can receive switches and options from the test runner (cth), which dictate the global environment or situation for the entire test run. Individual tests can inspect those switches and options to decide whether they will self-exclude them from the run (by calling cth_skip_test() from the CthGoodies library, which basically just returns exit code 32, which is picked up by the cth test runner).

Use existing tests for getting started in writing your own tests.
