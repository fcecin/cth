// --------------------------------------------------------------------------------------------
// Test purchase
// --------------------------------------------------------------------------------------------

{
    let theItemId       = 1001000;
    let theItemPrice    = 1;
    let theItemPriceStr = toTCN(theItemPrice);
    let theItemAvailableQuantity = 1;

    meta._().setitem( [theItemId, "item3", "faction-free fixed cost", "some item category", "none", 2, 0, theItemAvailableQuantity, 0, theItemPriceStr, theItemPriceStr, "0.0000 TCN", 0, theItemPriceStr, 0, metaTestStartTime] );

    let metaplayer1 = "metaplayer1";

    let origBal = fromTCN( meta.accounts( { "scope": metaplayer1 } ).rows[0].balance );

    meta._(metaplayer1).purchase(metaplayer1, theItemId);

    let newBal = fromTCN( meta.accounts().rows[0].balance );

    assert(`${newBal} == ${origBal} - ${theItemPrice}`, `${metaplayer1}'s purchase subtracted the correct amount from the deposited balance in the contract`);

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
}
