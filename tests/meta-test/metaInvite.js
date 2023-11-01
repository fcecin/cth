// --------------------------------------------------------------------------------------------
// Test invites
// --------------------------------------------------------------------------------------------

{
    // ========================================================================================
    // Invite and cancel
    // ========================================================================================

    // metaplayer35 (alliance) is going to invite metaplayer2 (no faction), then cancel the invite
    let metaplayer35 = "metaplayer35";
    let metaplayer2 = "metaplayer2";
    assert(`${meta.players(metaplayer35).rows[0].faction_id} == 3`, `${metaplayer35} is in the alliance`);
    assert(`${meta.players(metaplayer2).rows[0].faction_id} == 0`, `${metaplayer2} is not in any faction`);
    meta._(metaplayer35).invite(metaplayer35, metaplayer2);
    assert(`${meta.acquisitions_3(to128(fromName(metaplayer35),4)).rows.length} == 0`, `${metaplayer35} spent their invite acquisition to invite ${metaplayer2}`);
    meta._(metaplayer35).cancelinv(metaplayer35, metaplayer2);
    assert(`${meta.acquisitions_3(to128(fromName(metaplayer35),4)).rows.length} == 1`, `${metaplayer35} cancelled the invite and got their invite acquisition back`);

    // ========================================================================================
    // Invite and accept
    // ========================================================================================

    // metaplayer35 (alliance) is going to invite metaplayer2 (no faction)
    // metaplayer35 is going to spend that invite acquisition it got in the previous fixture test
    assert(`${meta.players(metaplayer35).rows[0].faction_id} == 3`, `${metaplayer35} is in the alliance`);
    assert(`${meta.players(metaplayer2).rows[0].faction_id} == 0`, `${metaplayer2} is not in any faction`);
    meta._(metaplayer35).invite(metaplayer35, metaplayer2);
    assert(`${meta.acquisitions_3(to128(fromName(metaplayer35),4)).rows.length} == 0`, `${metaplayer35} spent their invite acquisition to invite ${metaplayer2}`);
    meta._(metaplayer2).acceptinvite(metaplayer35, metaplayer2);
    assert(`${meta.players(metaplayer2).rows[0].faction_id} == 3`, `${metaplayer2} successfully accepted invite from ${metaplayer35} to join the alliance faction`);

    // ========================================================================================
    // Request invite and cancel
    // ========================================================================================

    // metaplayer3 is going to request an invite with a bounty/bid
    // then will immediately cancel it, which will return the bounty/bid to it
    let metaplayer3 = "metaplayer3";
    assert(`${meta.players(metaplayer3).rows[0].faction_id} == 0`, `${metaplayer3} is not in any faction`);
    let reqBid    = 50;
    let reqBidStr = toTCN(reqBid);
    meta._(metaplayer3).reqinvite(metaplayer3, reqBidStr, 3); // metaplayer3 want to join the alliance (faction id == 3)
    let beforeCancelBal = fromTCN( meta.accounts( { "scope": metaplayer3 } ).rows[0].balance );
    meta._(metaplayer3).cancelreq(metaplayer3);  // cancel the request, should return the reqBid
    let afterCancelBal = fromTCN( meta.accounts( { "scope": metaplayer3 } ).rows[0].balance );
    assert(`${afterCancelBal} == ${beforeCancelBal} + ${reqBid}`, `${metaplayer3} got correctly reinbursed when it cancelled its faction invite request with a bid/bounty`);

    // ========================================================================================
    // Request invite and fulfill
    // ========================================================================================

    // metaplayer3 is going to request an invite with a bounty/bid
    // metaplayer34 will collect by fulfilling the request
    let metaplayer34 = "metaplayer34";
    assert(`${meta.players(metaplayer34).rows[0].faction_id} == 3`, `${metaplayer34} is in the alliance`);
    assert(`${meta.players(metaplayer3).rows[0].faction_id} == 0`, `${metaplayer3} is not in any faction`);

    // metaplayer34 (alliance) will win another faction invite auction (from the previous fixture test)
    clock.clockaddsec( 86400 + 8640 ); // The math on the time "border" of each auction ending seems to be a bit off so I added 10% to it; should be fine.
    fixtureLog( "Meta update 1 day elapsed should trigger a round of faction auction resolutions:\n" + meta.update(Number.MAX_SAFE_INTEGER) );
    assert(`${meta.acquisitions_3(to128(fromName(metaplayer34),4)).rows.length} > 0`, `${metaplayer34} got an alliance faction invite to spend`); // external_id==4 <-> faction==3

    meta._(metaplayer3).reqinvite(metaplayer3, reqBidStr, 3); // metaplayer3 want to join the alliance (faction id == 3)
    let origBal = fromTCN( meta.accounts( { "scope": metaplayer34 } ).rows[0].balance );
    meta._(metaplayer34).invite(metaplayer34, metaplayer3);  // collect that reqBid
    let newBal = fromTCN( meta.accounts( { "scope": metaplayer34 } ).rows[0].balance );

    assert(`${newBal} == ${origBal} + ${reqBid}`, `${metaplayer34} collected ${reqBidStr} for fulfilling the reqinvite from ${metaplayer3}`);
    assert(`${meta.acquisitions_3(to128(fromName(metaplayer34),4)).rows.length} == 0`, `the invite acquisition from ${metaplayer34} was spent`); // external_id==4 <-> faction==3
    assert(`${meta.players(metaplayer3).rows[0].faction_id} == 3`, `${metaplayer3} successfully joined the alliance`);
}
