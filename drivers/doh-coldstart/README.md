NOTE: Now that cth supports parallel test execution, this driver is only used to generate the chainbase for doh-hostart. The only way you can use this driver with cth to run tests is with `cth --j 1` to serialize all tests. In general, just don't write tests for this driver.

doh-coldstart is a reference driver for the development of more advanced DoH test drivers, or for debugging.

Since doh-coldstart is built on top of coldstart, it does NOT support parallel test execution.

This driver takes care of starting the coldstart reference driver (which starts a local nodeos on the default HTTP port). Afterwards, it deploys the doh contracts.

Testcases can invoke this driver directly, and it will take care of coldstart in its backend.

You must call 'install' at least once (which is done by 'cth -i') to compile the DoH contracts.
