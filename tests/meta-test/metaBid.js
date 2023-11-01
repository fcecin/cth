// --------------------------------------------------------------------------------------------
// Test bid (on a non-waitlist auction)
// --------------------------------------------------------------------------------------------

{
    // players i = metaplayer31 to metaplayer35 are going to bid for an alliance invite
    // they bet $i TCN each

    for (let i = 1; i <= 5; i++) {
        let player = `metaplayer3${i}`;
        meta._(player).placebid(player, toTCN(i), 4); // auction id == 4 is for faction 3
    }

    // elapsing a full day will trigger all the 4 faction auctions.
    // the alliance invite goes to the best bidder (metaplayer35), and the other auctions burn their invites

    clock.clockaddsec( 86400 + 8640 ); // The math on the time "border" of each auction ending seems to be a bit off so I added 10% to it; should be fine.

    fixtureLog( "Meta update 1 day elapsed should trigger a round of faction auction resolutions:\n" + meta.update(Number.MAX_SAFE_INTEGER) );

    // "wlplayer1" (from the previous fixture test) is now a member of faction 1 (due to their pending loser waitlist bid in the previous test resolving now...)
    let wlplayer1Obj = meta.players("wlplayer1").rows[0];
    assert(`${wlplayer1Obj.faction_id} > 0`, `wlplayer1 (from the previous fixture test) finally won the waitlist auction now that an additional day has elapsed`);

    // check that metaplayer35 is the winner (best bider of auction #4 (faction 3 invites))

    // metaplayer find the unique acquisition id
    // just assume it's there and dig into .rows[0] (at this point we already tested purchase & retrieve acquisition after all)
    let acquisition = meta.acquisitions_3(to128(fromName("metaplayer35"), 4)).rows[0];

    assert(`${acquisition.type} == 1 && ${acquisition.external_id} == 4 && '${acquisition.paid}' == '5.0000 TCN'`, "metaplayer35 was correctly recognized as the best bidder of the alliance faction invites auction");
}
