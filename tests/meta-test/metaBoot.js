//-------------------------------------------------------------------------------------
// metaBoot.js
//
// Creates the test environment for all fixture tests in the meta-test suite.
// (NOTE: meta::clear() is NOT called in-between fixture tests).
//-------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------
// Define the first faction and demo the _struct() feature ...
//-------------------------------------------------------------------------------------

// Instead of doing this ...

//meta.setfaction( {"id":1, "faction_name":"empire", "description":"empire description", "founder":"empirefd" } );

// ...we can do this once: ...

meta._struct("faction", ["id", "faction_name", "description", "founder"]);

// ...and then this to define each faction without having to name the fields all the time:
// (i.e. after you order the fields of an ABI struct type via _struct(), you can give an
//  array where you'd normally have to give a named-parameters JSON object {"id":1, ..etc..}

meta.setfaction( [1, "empire", "empire description", "empirefd"] );

//-------------------------------------------------------------------------------------
// ... and then define the other three factions.
//-------------------------------------------------------------------------------------

meta.setfaction( [2, "confederacy", "confederacy description", "confedfd"] );
meta.setfaction( [3, "alliance", "alliance description", "alliancefd"] );

// Old way still works, of course
meta.setfaction( {"id":4, "faction_name":"dominion", "description":"dominion description", "founder":"dominionfd"} );

// should look good
fixtureLog( "Should contain the four factions: " + JSON.stringify( meta.factions() ) );

//-------------------------------------------------------------------------------------
// Here we will compute the timeframes that we will be using for the meta contract
//-------------------------------------------------------------------------------------

metaTestStartTime = getContractTime();
metaTestAuctionEndTime = addSecondsToTime(metaTestStartTime, 86400 * 30); // 30 days
metaTestAllAuctionsEndTime = addSecondsToTime(metaTestAuctionEndTime, 86400 * 2); // 30 + 2 days = 32
metaTestMetaGameEndTime = addSecondsToTime(metaTestAllAuctionsEndTime, 86400 * 2); // 32 + 2 days = 34

fixtureLog("metaTestStartTime          = " + metaTestStartTime);
fixtureLog("metaTestAuctionEndTime     = " + metaTestAuctionEndTime);
fixtureLog("metaTestAllAuctionsEndTime = " + metaTestAllAuctionsEndTime);
fixtureLog("metaTestMetaGameEndTime    = " + metaTestMetaGameEndTime);

//-------------------------------------------------------------------------------------
// Planets & regions
//-------------------------------------------------------------------------------------

meta._struct("planet", ["id", "planet_name"]);

meta.setplanet( [1, "planet1"] );
meta.setplanet( [2, "planet2"] );

meta._struct("region", ["id", "planet_id", "region_name"]);

meta.setregion( [1, 1, "p1r1"] );
meta.setregion( [2, 1, "p1r2"] );
meta.setregion( [3, 2, "p2r1"] );
meta.setregion( [4, 2, "p2r2"] );

//-------------------------------------------------------------------------------------
// Auctions
//-------------------------------------------------------------------------------------

meta._struct("auction", ["id", "name", "description", "category", "asset_url", "rarity", "level", "count", "reserve", "type", "auction_end", "faction_id"] );

meta.setauction( [1, "waitlist", "waitlist auction", "faction invites auction", "none", 0, 0, 999999999, "0.0000 TCN", 2, metaTestAuctionEndTime, 0 ] );

fixtureLog("Auction #1: " + JSON.stringify( meta.auctions() ) );

meta.setauction( [2, "empire invites", "faction invites auction", "empire invites auction", "none", 0, 0, 30, "0.0000 TCN", 2, metaTestAuctionEndTime, 0 ] );

meta.setauction( [3, "confederacy invites", "faction invites auction", "confederacy invites auction", "none", 0, 0, 30, "0.0000 TCN", 2, metaTestAuctionEndTime, 0 ] );

meta.setauction( [4, "alliance invites", "faction invites auction", "alliance invites auction", "none", 0, 0, 30, "0.0000 TCN", 2, metaTestAuctionEndTime, 0 ] );

meta.setauction( [5, "dominion invites", "faction invites auction", "dominion invites auction", "none", 0, 0, 30, "0.0000 TCN", 2, metaTestAuctionEndTime, 0 ] );

//-------------------------------------------------------------------------------------
// Items (id must be >= 1000000)
//-------------------------------------------------------------------------------------

meta._struct("item", ["id", "name", "description", "category", "asset_url", "rarity", "level", "count", "faction_id", "cost", "dutch_cost_end", "dutch_step_amount", "dutch_step_secs", "dutch_cost_start", "dutch_steps", "dutch_start"] );

meta.setitem( [1000000, "item1", "faction-free item 60s dutch step", "some item category", "none", 0, 0, 1000, 0, "100.0000 TCN", "1.0000 TCN", "1.0100 TCN", 60, "100.0000 TCN", 0, metaTestStartTime] );
meta.setitem( [1000001, "item2", "faction-free item 1h dutch step", "some item category", "none", 1, 2, 1000, 0, "180.0000 TCN", "30.0000 TCN", "0.1000 TCN", 3600, "180.0000 TCN", 0, metaTestStartTime] );
meta.setitem( [1000002, "item3", "faction-free fixed cost", "some item category", "none", 2, 0, 1000, 0, "12.0000 TCN", "12.0000 TCN", "0.0000 TCN", 0, "12.0000 TCN", 0, metaTestStartTime] );
meta.setitem( [1000003, "item4", "empire item fixed cost", "some item category", "none", 1, 1, 250, 1, "25.0000 TCN", "25.0000 TCN", "0.0000 TCN", 0, "25.0000 TCN", 0, metaTestStartTime] );
meta.setitem( [1000004, "item5", "confederacy item fixed cost", "some item category", "none", 1, 1, 250, 2, "25.0000 TCN", "25.0000 TCN", "0.0000 TCN", 0, "25.0000 TCN", 0, metaTestStartTime] );
meta.setitem( [1000005, "item6", "alliance item fixed cost", "some item category", "none", 1, 1, 250, 3, "25.0000 TCN", "25.0000 TCN", "0.0000 TCN", 0, "25.0000 TCN", 0, metaTestStartTime] );
meta.setitem( [1000006, "item7", "dominion item fixed cost", "some item category", "none", 1, 1, 250, 4, "25.0000 TCN", "25.0000 TCN", "0.0000 TCN", 0, "25.0000 TCN", 0, metaTestStartTime] );

//-------------------------------------------------------------------------------------
// Start metagame
//-------------------------------------------------------------------------------------

meta.init(metaTestAllAuctionsEndTime, metaTestMetaGameEndTime);

let metaGlobal = meta.global();
fixtureLog("meta contract global object after init: " + JSON.stringify(metaGlobal) );

let clockObjCurrentTime = clock.clockinfo().rows[0].current_time;

fixtureLog("current system time (irrelevant)  = " + new Date().toISOString());
fixtureLog("current clock contract value      = " + clockObjCurrentTime);
fixtureLog("meta global all_auctions_end      = " + metaGlobal.rows[0].all_auctions_end);
fixtureLog("meta global meta_game_end         = " + metaGlobal.rows[0].meta_game_end);

if (new Date(clockObjCurrentTime) < new Date(metaGlobal.rows[0].meta_game_end)) {
    fixtureLog("Metagame has NOT ended. This is expected.");
} else {
    fixtureError("Metagame HAS ended. This is bad.");
}

//-------------------------------------------------------------------------------------
// Create some players for the tests, give them money, each open/deposit in meta.
//   (also demo'ing _() as an alternative name to _auth(), and auth chaining)
//-------------------------------------------------------------------------------------

meta._struct("player", ["owner", "asset_url", "referrer", "faction_id", "last_staking_action", "last_bid_action", "last_transfer_action", "last_reqinvite_action", "actions", "actions_reset_time"] );

// players  1 -  5 : faction 0  (metaplayer1, metaplayer2 ...)
// players 11 - 15 : faction 1  (metaplayer11, metaplayer12 ...)
// etc.
for (let i = 1; i <= 5; i++) {
    for (let faction = 0; faction <= 4; faction++) {

        let n = (faction * 10) + i;
        let player  = `metaplayer${n}`;

        cleos(`system newaccount eosio ${player} ${DEVELOPER_PUBLIC_KEY} --buy-ram-kbytes 50 --stake-net "10000.0000 EOS" --stake-cpu "10000.0000 EOS" --transfer`);

        meta._().setplayer( [player, "none", "", faction, TIME_POINT_MIN, TIME_POINT_MIN, TIME_POINT_MIN, TIME_POINT_MIN, 0, TIME_POINT_MIN] );

        let hegemon = `hegemon.${doh_target}`;
        tokens._auth(hegemon);
        tokens.transfer(hegemon, player, "10000.0000 TCN", "");

        meta._(player).open(player, TCN_SYMBOL, player);

        tokens._auth(player).transfer(player, meta._contract(), "1000.0000 TCN", "deposit");
    }
}
