// --------------------------------------------------------------------------------------------
// Test waitlist auction
// --------------------------------------------------------------------------------------------

{
    // for the waitlist we will create five extra players that belong to no faction
    //   each bids their player number amount TCN

    for (let i = 1; i <= 5; i++) {
        let player  = `wlplayer${i}`;

        cleos(`system newaccount eosio ${player} ${DEVELOPER_PUBLIC_KEY} --buy-ram-kbytes 50 --stake-net "10000.0000 EOS" --stake-cpu "10000.0000 EOS" --transfer`);

        meta._().setplayer( [player, "none", "", 0, TIME_POINT_MIN, TIME_POINT_MIN, TIME_POINT_MIN, TIME_POINT_MIN, 0, TIME_POINT_MIN] );

        let hegemon = `hegemon.${doh_target}`;
        tokens._auth(hegemon);
        tokens.transfer(hegemon, player, "100.0000 TCN", "");

        meta._(player).open(player, TCN_SYMBOL, player);

        tokens._auth(player).transfer(player, meta._contract(), "100.0000 TCN", "deposit");

        // wlplayer1 does not win the waitlist auction
        // wlplayer2 .. wlplayer4 win one invite for each of the four factions
        meta._(player).placebid(player, toTCN(i), 1);
    }

    // elapsing a full day will trigger 4 waitlist wins (1 for each faction, since no one is bidding there)

    clock.clockaddsec( 86400 );
    fixtureLog( "Meta update 1 day elapsed should trigger a round of faction auction resolutions:\n" + meta.update(Number.MAX_SAFE_INTEGER) );

    fixtureLog("State of auction tables after a day: " + JSON.stringify( meta.auctions() ) );

    fixtureLog("State of bids tables after a day: " + JSON.stringify( meta.bids() ) );

    for (let i = 1; i <= 5; i++) {
        let player  = `wlplayer${i}`;
        let playerObj = meta.players(player).rows[0];
        if (i == 1) {
            assert(`${playerObj.faction_id} == 0`, `${player} was correctly not awarded a waitlist auction faction invite`);
        } else {
            assert(`${playerObj.faction_id} > 0`, `${player} was correctly awarded a waitlist auction faction invite (${playerObj.faction_id})`);
        }
    }

    // just ensure that we should NOT have anything else to update: elapsed exactly the
    //   necessary to close 1 round of actions (1 per day: 30 invites per faction, 30 days)

    let success = false;
    try { meta.update(Number.MAX_SAFE_INTEGER); } catch (error) { success = true; }
    assert(`${success}`, `successfully failed to call meta.update(): nothing to update`);

    // then ensure we have 29 invites instead of 30 now in all faction auctions

    for (let i = 1; i <= 4; i++) {
        let auctionId = i + 1;
        let auctionObj = meta.auctions(auctionId).rows[0];
        assert(`${auctionObj.count} == 29`, `faction ${i} auction ID ${auctionId} has one less invite available`);
    }

    // bidder wlplayer1 is still there at auction 1

    let bidsObj = meta.bids_2(1);

    assert(`${bidsObj.rows.length} == 1 && '${bidsObj.rows[0].player}' == 'wlplayer1'`, `wlplayer1's losing 1 TCN bid is the sole remaining bid in the waitlist auction`);
}
