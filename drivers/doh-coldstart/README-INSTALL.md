doh-coldstart takes a long time to install because, currently, it will always compile all of the doh-contracts three times: once for production (prod, hgm/tcn), once for staging (staging, hg1/tc1) and once for development (dev, hg2/tc2).

If you wish to do something smarter (that is, faster) manually, then DO NOT RUN cth -i or invoke doh-coldstart/install, and then instead you can compile and recompile the version of the contracts that you are effectively using by placing it under the following directories:

production:
  <cth root directory>/local/prod/doh-coldstart/

staging:
  <cth root directory>/local/staging/doh-coldstart/

development:
  <cth root directory>/local/dev/doh-coldstart/
