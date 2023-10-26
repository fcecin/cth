During installation doh-coldstart downloads, configures and compiles the source code for the target selected via `-o target=TARGET_NAME`. The default target is `test`, which uses the `hg3`/`tc3` DoH contract suffixes.

Depending on the selected target, one of the following directories will be created under `local/` with the DoH source code and binaries that this driver will use:

production:
  <cth root directory>/local/prod/doh-contracts/

staging:
  <cth root directory>/local/staging/doh-contracts/

development:
  <cth root directory>/local/dev/doh-contracts/

testing:
  <cth root directory>/local/test/doh-contracts/

debugging:
  <cth root directory>/local/debug/doh-contracts/
