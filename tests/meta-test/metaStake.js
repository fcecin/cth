// --------------------------------------------------------------------------------------------
// Test staking & withdrawal
//
// Probably a bit more verbose than necessary, but this also works as a test system demo.
// --------------------------------------------------------------------------------------------

// We'll add an extra level of identation to the fixture tests so that the "let tempVar;"
//   statements in each won't cause "variable already declared" errors.
{
    // save the balance

    let metaplayer11 = "metaplayer11";

    let origBal = fromTCN( meta.accounts( { "scope": metaplayer11 } ).rows[0].balance );

    // metaplayer11 stakes a bit on region 1

    let amountStakedStr = "1.5000 TCN"; // for contract consumption, needs all the 4 zeroes, token name, etc.
    let amountStaked = fromTCN( amountStakedStr ); // ready for doing math

    meta._("metaplayer11").dostake(metaplayer11, amountStakedStr, 1);

    // Automatic queries for the secondary index with lower==upper, assuming secondary index is i64.
    // (if it wasn't, you would need to pass an options object as the last parameter to set the
    //  index type the first time you use the table proxy method for index # w/ tablename_#()...)

    let o = meta.stakes_2("metaplayer55"); // lower bound = metaplayer55; becomes the default upper bound

    fixtureLog("No stakes: " + JSON.stringify(o));

    o = meta.stakes_2(metaplayer11);

    fixtureLog("Yes stakes: " + JSON.stringify(o));

    // please don't require('assert') for the Node.js assert module as we have our own assert already...

    assert(`'${o.rows[0].owner}' === '${metaplayer11}' && '${o.rows[0].amount}' == '${amountStakedStr}' && ${o.rows[0].region_id} == 1`, `${metaplayer11} staked successfully`);

    // note that { "scope": metaplayer11 } can be omitted this time since we used that last time.
    // only need to specify the scope when changing it from the last specified scope (the default
    //   scope is the contract account name).
    let newBal = fromTCN( meta.accounts().rows[0].balance );

    fixtureLog("Original Balance (pre stake) = " + origBal);
    fixtureLog("New Balance (post stake)     = " + newBal);

    assert(`${newBal} == ${origBal} - ${amountStaked}`, `${metaplayer11}'s staking subtracted the correct amount from the deposited balance in the contract`);

    // Stake again same amount, but change to region 2

    meta.dostake(metaplayer11, amountStakedStr, 2);

    o = meta.stakes_2(metaplayer11);

    fixtureLog("Changed stake region: " + JSON.stringify(o));

    let newTotalStakeExpected = amountStaked * 2;
    let newTotalStakeExpectedStr = toTCN( newTotalStakeExpected );

    assert(`'${o.rows[0].owner}' === '${metaplayer11}' && '${o.rows[0].amount}' == '${newTotalStakeExpectedStr}' && ${o.rows[0].region_id} == 2`, `${metaplayer11} staked successfully again`);

    // withdraw some cash from the contract

    let withdrawalAmount = 200;
    let withdrawalAmountStr = toTCN( withdrawalAmount );

    // note that we are querying tokens.accounts not meta.accounts to get the money in the player's blockchain account

    let externalAccountBal1 = fromTCN( tokens.accounts( { "scope": metaplayer11 } ).rows[0].balance );
    fixtureLog(`${metaplayer11} old external account balance = ${externalAccountBal1}`);

    meta.withdraw(metaplayer11, withdrawalAmountStr);
    fixtureLog(`${metaplayer11} has withdrawn                = ${withdrawalAmount}`);

    let externalAccountBal2 = fromTCN( tokens.accounts().rows[0].balance );
    fixtureLog(`${metaplayer11} new external account balance = ${externalAccountBal2}`);

    assert(`${externalAccountBal2} - ${externalAccountBal1} == ${withdrawalAmount}`, `${metaplayer11} withdrawal successful`);

    let internalAccountBal = fromTCN( meta.accounts().rows[0].balance );
    fixtureLog(`${metaplayer11} new internal account balance = ${internalAccountBal}`);

    assert(`${origBal} - ${withdrawalAmount} - ${newTotalStakeExpected} == ${internalAccountBal}`, `${metaplayer11}'s balance in the contract checks out`);

    // Regression test: attempt to stake to nonexistent region ID

    let success = false;
    try { meta._("metaplayer11").dostake(metaplayer11, "42.0000 TCN", 987654321); } catch (error) { success = true; }
    assert(`${success}`, `successfully failed to stake to non-existent region`);
}
