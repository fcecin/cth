// Clears the meta contract for the next meta contract test in the fixture test suite

cleos(`push action meta.${doh_target} clear '{}' -p meta.${doh_target}`);
