// --------------------------------------------------------------------------------------------
// Test purchase
// --------------------------------------------------------------------------------------------

{
    let theItemId       = 1001000;
    let theItemPrice    = 1;
    let theItemPriceStr = toTCN(theItemPrice);
    let theItemAvailableQuantity = 1;

    meta._().setitem( [theItemId, "item3", "faction-free fixed cost", [], "none", 2, 0, theItemAvailableQuantity, ITEM_LIMIT, 0, theItemPriceStr, theItemPriceStr, "0.0000 TCN", 0, theItemPriceStr, 0, metaTestStartTime] );

    let metaplayer1 = "metaplayer1";

    let origBal = fromTCN( meta.accounts( { "scope": metaplayer1 } ).rows[0].balance );

    meta._(metaplayer1).purchase(metaplayer1, theItemId);

    let newBal = fromTCN( meta.accounts().rows[0].balance );

    assert(`${newBal} == ${origBal} - ${theItemPrice}`, `${metaplayer1}'s purchase subtracted the correct amount from the deposited balance in the contract`);

    fixtureLog("Going to build a 128-bit key [owner.value, item-id] for index 3 of acquisitions table (by_owner_item)");

    let playerValuei64    = fromName( metaplayer1 );
    let ownerItemKeyi128  = to128( fromName( metaplayer1 ), theItemId );

    fixtureLog("  Player name                 = " + metaplayer1);
    fixtureLog("  Player name.value (low 64)  = " + playerValuei64);
    fixtureLog("  Item id (high 64)           = " + theItemId);
    fixtureLog("  Resulting 128-bit key       = " + ownerItemKeyi128);

    let acquisition = meta.acquisitions_3(ownerItemKeyi128, {"key-type": "i128"});

    fixtureLog("Item purchased as an owner_item-fetched cquisition: " + JSON.stringify( acquisition ) );

    assert(`${acquisition.rows[0].external_id} === ${theItemId} && '${acquisition.rows[0].owner}' === '${metaplayer1}' && '${acquisition.rows[0].paid}' == '${theItemPriceStr}'`, `the acquisiton with the external_id ${theItemId} was found in the hands of player ${metaplayer1}`);

    let success = true;
    try {
        meta.purchase(metaplayer1, theItemId);
        success = false;
    } catch (error) {
        if (error.message.includes('all items of this type have been sold')) {
            fixtureLog("Correctly got an error from trying to purchase an out-of-stock item");
        } else {
            fixtureWarningLog("Correctly got an error from trying to purchase an out-of-stock item, but it's not the expected error message: " + error);
        }
    }
    assert(`${success}`, `successfully failed to buy another of item ${theItemId} (can't; item count is zero)`);

    // test item purchasing limit (which should be 2 == ITEM_LIMIT)
    let anotherItemId = 1000000;
    meta.purchase(metaplayer1, anotherItemId); // OK
    meta.purchase(metaplayer1, anotherItemId); // OK
    success = true;
    try {
        meta.purchase(metaplayer1, anotherItemId);
        success = false;
    } catch (error) {
        if (error.message.includes('player cannot hold any more of this item')) {
            fixtureLog("Correctly got an error from trying to purchase more than the per-player limit of an item");
        } else {
            fixtureWarningLog("Correctly got an error from trying to purchase more than the per-player limit of an item, but it's not the expected error message: " + error);
        }
    }
    assert(`${success}`, `successfully failed to buy an additional item of the same type, when it was configured for a per-player limit of ${ITEM_LIMIT}`);
}
