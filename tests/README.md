
The `tests` directory is a good place to put all your testcases in.

Each testcase should go into its own subdirectory, whose name is the name of test.

Tests should have an executable file called `run` in them, which runs the test. The return value of `run` determines whether the test has succeeded or failed. A return value of zero indicates success, and any other value is a failure.

Tests should work the same whether they are invoked individually from the command-line or by automation. Good tests also work irrespective of the directory they are invoked from.










