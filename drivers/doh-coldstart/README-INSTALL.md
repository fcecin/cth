doh-coldstart downloads and configures the source code for all DoH targets, but it ONLY COMPILES the test target (hg3/tc3) during driver installation, since that's the only one that's going to be used for automated testing by default.

You can still write tests that use the other targets and enable/select those targets in your tests, but you will have to ensure the targets are properly compiled and present in the standard directories expected by the tests:

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
