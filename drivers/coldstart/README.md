
The coldstart driver is a sample test driver that boots a local Leap blockchain.

This driver does NOT and will NEVER support parallel test execution, since it is intended to be a simple reference driver.

The install script compiles the AntelopeIO reference-contracts that should already be downloaded under tools/ (it should be submodule) so that they can be deployed.

Starting the driver for use by a testcase (or another driver that depends on coldstart) should be done by invoking 'clear' first, then 'start'. The testcase should check that 'start' completes successfully without errors before proceeding, otherwise the test should fail.

If you call 'stop', you can call 'start' again and the blockchain should resume where it left off, instead of reconstructing itself from scratch.

NOTE:

This is a reference driver that is mostly for the development of cth, of other drivers, and for debugging. It is very simple. It is slow to start and only supports one blockchain running at a time.

You can use coldstart in production, but you should probably be using a better driver.
