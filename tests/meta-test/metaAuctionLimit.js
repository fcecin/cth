// --------------------------------------------------------------------------------------------
// Test per-player auction limit
// --------------------------------------------------------------------------------------------

{
    // configured AUCTION_LIMIT should be == 2 (see metaBoot.js)

    let metaplayer21 = "metaplayer21";
    let metaplayer22 = "metaplayer22";

    let CONFEDERACY_INVITES_AUCTION_ID = 3; // faction 2, of players 21 and 22
    
    // first, let's rig confederacy player 21 with two (== AUCTION_LIMIT) faction auction wins
    for (let i = 0; i < AUCTION_LIMIT; i++) {
        meta._(metaplayer21).placebid(metaplayer21, "0.0001 TCN", CONFEDERACY_INVITES_AUCTION_ID);
        clock.clockaddsec( 86400 + 8640 ); // The math on the time "border" of each auction ending seems to be a bit off so I added 10% to it; should be fine.
        fixtureLog( "Meta update 1 day elapsed should trigger a round of faction auction resolutions:\n" + meta.update(Number.MAX_SAFE_INTEGER) );
    }

    // then players 21 and 22 bid, 22 actually bids less than 21
    let higherBidStr = "9.0000 TCN";
    let lowerBidStr  = "8.0000 TCN";
    meta._(metaplayer21).placebid(metaplayer21, higherBidStr, CONFEDERACY_INVITES_AUCTION_ID);
    meta._(metaplayer22).placebid(metaplayer22, lowerBidStr, CONFEDERACY_INVITES_AUCTION_ID);

    // resolve
    clock.clockaddsec( 86400 + 8640 ); // The math on the time "border" of each auction ending seems to be a bit off so I added 10% to it; should be fine.
    fixtureLog( "Meta update 1 day elapsed should trigger a round of faction auction resolutions:\n" + meta.update(Number.MAX_SAFE_INTEGER) );

    // metaplayer22 wins, even though it has bid less, because metaplayer21 has too many invites already (auction.limit is reached)
    let acquisition = meta.acquisitions_3(to128(fromName(metaplayer22), CONFEDERACY_INVITES_AUCTION_ID)).rows[0];
    assert(`${acquisition.type} == 1 && ${acquisition.external_id} == ${CONFEDERACY_INVITES_AUCTION_ID} && '${acquisition.paid}' == '${lowerBidStr}'`, `${metaplayer22} was correctly recognized as the best bidder of the alliance faction invites auction, because ${metaplayer21} already had too many invites (limit reached) even though it had bid more (${higherBidStr})`);
}
