// --------------------------------------------------------------------------------------------
// Test per-player restricted-category item per-player limit
// --------------------------------------------------------------------------------------------

{
    // test acquisition of a restricted item category: "Deployment"

    // both items have a per_player_limit of 1, but both are "Deployment" category, which is
    //   restricted internally by the meta contract (like "Faction Founding Charter" is).
    // so if the player tries to purchase one of each, the second purchase has to fail

    let RESTRICTED_ITEM_LIMIT = 1;

    let RESTRICTED_ITEM_ID_1 = 1000007;
    let RESTRICTED_ITEM_ID_2 = 1000008;

    let metaplayer23 = "metaplayer23";

    meta._().setitem( [RESTRICTED_ITEM_ID_1, "restricteditem1", "restricted item 1", "SomeOtherCategory, Deployment, AnotherCategory", "none", 2, 0, 1000, RESTRICTED_ITEM_LIMIT, 0, "12.0000 TCN", "12.0000 TCN", "0.0000 TCN", 0, "12.0000 TCN", 0, metaTestStartTime] );

    meta.setitem( [RESTRICTED_ITEM_ID_2, "restricteditem1", "restricted item 2", "Deployment, Foo, Bar", "none", 2, 0, 1000, RESTRICTED_ITEM_LIMIT, 0, "20.0000 TCN", "20.0000 TCN", "0.0000 TCN", 0, "20.0000 TCN", 0, metaTestStartTime] );

    meta._(metaplayer23).purchase(metaplayer23, RESTRICTED_ITEM_ID_1); // no issues

    let success = true;
    try {
        meta.purchase(metaplayer23, RESTRICTED_ITEM_ID_2); // exceeds limit of max 1 per player -- of the same Deployment category!
        success = false;
    } catch (error) {
        if (error.message.includes('player cannot hold any more of this item')) {
            fixtureLog("Correctly got an error from trying to purchase a per_player_limit == 1 restricted category item");
        } else {
            fixtureWarningLog("Correctly got an error from trying to purchase a per_player_limit == 1 restricted category item, but it's not the expected error message: " + error);
        }
    }
    assert(`${success}`, `successfully failed to buy two different item IDs sharing the same restricted category and the same per_player_limit of 1`);
}
