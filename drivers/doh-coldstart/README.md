
doh-coldstart is a reference driver for the development of more advanced DoH test drivers, or for debugging.

Since doh-coldstart is built on top of coldstart, it does NOT support parallel test execution.

This driver takes care of starting the coldstart reference driver (which starts a local nodeos on the default HTTP port). Afterwards, it deploys the doh contracts.

IMPORTANT: This driver must be 'configure'd first before it will work. It will refuse to 'start' if it is not 'configure'd first.

To configure the driver, call:
  configure --target=<suffix>

Replace <suffix> with hgm, hg1, hg2, or another valid DoH contracts target.

Testcases can invoke this driver directly, and it will take care of coldstart in its backend.

You must call 'install' at least once (which is done by 'cth -i') to compile the doh-contracts (should be a cth submodule under tools/). The doh-contracts build script actually refreshes the doh-contracts submodules (the various contracts) so you may want to reinstall this driver manually (by calling 'install' inside this driver) from time to time to pick up and compile new doh-contracts code.

