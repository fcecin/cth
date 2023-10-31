// --------------------------------------------------------------------------------------------
// Test dutch auction
// - check dutch auction item price is at start price
// - pass time
// - check 1 step passed, call update, check price reduced
// - pass lots of time
// - call update, check reached end price
// --------------------------------------------------------------------------------------------

{
    // None of the previous fixture tests have passed time yet, so the dutch auction items
    //   should be at their starting price (see metaBoot.js)

    let dutchItemPrimaryKeyId = 1000000;

    let item = meta.items(dutchItemPrimaryKeyId).rows[0];

    assert(`${fromTCN(item.cost)} == ${fromTCN(item.dutch_cost_start)}`, `dutch item at starting cost (check 1)`);

    try { meta.update(Number.MAX_SAFE_INTEGER); } catch (error) { } // should throw "nothing to update" but we don't care

    assert(`${fromTCN(item.cost)} == ${fromTCN(item.dutch_cost_start)}`, `dutch item at starting cost (cost)`);

    clock.clockaddsec( item.dutch_step_secs );

    meta.update(Number.MAX_SAFE_INTEGER); // should update the price without crashing with "nothing to update"

    item = meta.items(dutchItemPrimaryKeyId).rows[0];

    assert(`${fromTCN(item.cost)} < ${fromTCN(item.dutch_cost_start)}`, `dutch item price moved by 1 step`);

    // advance time enough to floor the price
    clock.clockaddsec( item.dutch_step_secs * ( 1 + Math.trunc( (fromTCN(item.cost) - fromTCN(item.dutch_cost_end)) / fromTCN(item.dutch_step_amount) ) ) );
    meta.update(Number.MAX_SAFE_INTEGER); // should update the price without crashing with "nothing to update"

    item = meta.items(dutchItemPrimaryKeyId).rows[0];

    let oldCost = fromTCN( item.cost );

    try { meta.update(Number.MAX_SAFE_INTEGER); } catch (error) { } // should throw "nothing to update" but we don't care

    item = meta.items(dutchItemPrimaryKeyId).rows[0];

    let newCost = fromTCN( item.cost );

    assert(`${oldCost} == ${newCost}`, `after the dutch auction floored the price with the passage of time on the item, the price does not decrease`);

    assert(`${newCost} == ${fromTCN(item.dutch_cost_end)}`, `the item's final price matches the specified dutch auction end price`);
}
