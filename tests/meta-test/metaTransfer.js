// --------------------------------------------------------------------------------------------
// Test transfer
// --------------------------------------------------------------------------------------------

{
    // transfer a purchased item to another player of wrong faction, check it is prevented

    // metaplayer11 (faction 1) will try to send an acquired instance of item of external_id == 1000003 to metaplayer1
    //   and that must fail b/c 1000003 is a faction-id == 1 item, and metaplayer1 belongs to faction 0.
    // (this item is set up on metaBoot.js)

    let theFaction1ItemId = 1000003;

    let metaplayer11 = "metaplayer11";  // faction 1
    let metaplayer12 = "metaplayer12";  // faction 1
    let metaplayer1  = "metaplayer1";   // faction 0 (no faction)

    // metaplayer11 purchase the item
    meta._(metaplayer11).purchase(metaplayer11, theFaction1ItemId);

    // metaplayer find the unique acquisition id
    // just assume it's there and dig into .rows[0] (at this point we already tested purchase & retrieve acquisition after all)
    let acquisition = meta.acquisitions_3(to128(fromName(metaplayer11), theFaction1ItemId)).rows[0];

    let success = false;
    try { meta.transfer(acquisition.id, metaplayer1); } catch (error) { success = true; }
    assert(`${success}`, `successfully failed to transfer faction item to player of different faction id`);

    // transfer a purchased item to another player of right faction, check it is allowed

    meta.transfer(acquisition.id, metaplayer12);

    let newAcquisition = meta.acquisitions_3(to128(fromName(metaplayer12), theFaction1ItemId));

    assert(`${newAcquisition.rows.length} > 0`, "faction-bound acquisition landed in the destination player successfully");

    assert(`${newAcquisition.rows[0].external_id} === ${theFaction1ItemId} && '${newAcquisition.rows[0].owner}' === '${metaplayer12}'`, `an acquisiton with the external_id ${theFaction1ItemId} was found in the hands of the destination player ${metaplayer12} so transfer() works`);
}
