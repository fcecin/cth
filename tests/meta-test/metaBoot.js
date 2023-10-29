
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

/*


// TODO, create some 10 players, we'll spend them


  test plan:

  all of these are in different fixtures for the tally, but there's no clearing because that would be (a) slow and (b) unnecessary
  the fixture will just tell which sections of the test have been successful


- set various things (init a shop)
- set the test players, open, deposit balances for them


cleos -u http://ux5.goldenplatform.com push action meta.hg3 setplanet '{"p":{"id":1,"planet_name":"planet1"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setplanet '{"p":{"id":2,"planet_name":"planet2"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setregion '{"r":{"id":1,"planet_id":1,"region_name":"p1r1"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setregion '{"r":{"id":2,"planet_id":1,"region_name":"p1r2"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setregion '{"r":{"id":3,"planet_id":2,"region_name":"p2r1"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setregion '{"r":{"id":4,"planet_id":2,"region_name":"p2r2"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setauction '{"a":{"id":1,"name":"waitlist","description":"waitlist auction","category":"faction invites auction","asset_url":"none","rarity":0,"level":0,"count":999999999,"reserve":"0.0000 TCN","type":2,"auction_end":"2023-11-30T00:00:00.000","faction_id":0}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setauction '{"a":{"id":2,"name":"empire invites","description":"empire invites auction","category":"faction invites auction","asset_url":"none","rarity":0,"level":0,"count":30,"reserve":"0.0000 TCN","type":2,"auction_end":"2023-11-30T00:00:00.000","faction_id":0}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setauction '{"a":{"id":3,"name":"confederacy invites","description":"confederacy invites auction","category":"faction invites auction","asset_url":"none","rarity":0,"level":0,"count":60,"reserve":"0.0000 TCN","type":2,"auction_end":"2023-11-30T00:00:00.000","faction_id":0}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setauction '{"a":{"id":4,"name":"alliance invites","description":"alliance invites auction","category":"alliance invites auction","asset_url":"none","rarity":0,"level":0,"count":120,"reserve":"0.0000 TCN","type":2,"auction_end":"2023-11-30T00:00:00.000","faction_id":0}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setauction '{"a":{"id":5,"name":"dominion invites","description":"dominion invites auction","category":"dominion invites auction","asset_url":"none","rarity":0,"level":0,"count":240,"reserve":"0.0000 TCN","type":2,"auction_end":"2023-11-30T00:00:00.000","faction_id":0}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setitem '{"i":{"id":1000000,"name":"item1","description":"faction-free item 60s dutch step","category":"some item category","asset_url":"none","rarity":0,"level":0,"count":1000,"faction_id":0,"cost":"100.0000 TCN","dutch_cost_end":"1.0000 TCN","dutch_step_amount":"0.0100 TCN","dutch_step_secs":60,"dutch_cost_start":"100.0000 TCN","dutch_steps":0,"dutch_start":"2023-10-22T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setitem '{"i":{"id":1000001,"name":"item2","description":"faction-free item 1h dutch step","category":"some item category","asset_url":"none","rarity":1,"level":2,"count":1000,"faction_id":0,"cost":"180.0000 TCN","dutch_cost_end":"30.0000 TCN","dutch_step_amount":"0.1000 TCN","dutch_step_secs":3600,"dutch_cost_start":"180.0000 TCN","dutch_steps":0,"dutch_start":"2023-10-22T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setitem '{"i":{"id":1000002,"name":"item3","description":"faction-free fixed cost","category":"some item category","asset_url":"none","rarity":2,"level":0,"count":1000,"faction_id":0,"cost":"12.0000 TCN","dutch_cost_end":"12.0000 TCN","dutch_step_amount":"0.0000 TCN","dutch_step_secs":0,"dutch_cost_start":"12.0000 TCN","dutch_steps":0,"dutch_start":"2023-10-22T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setitem '{"i":{"id":1000003,"name":"item4","description":"empire item fixed cost","category":"some item category","asset_url":"none","rarity":1,"level":1,"count":250,"faction_id":1,"cost":"25.0000 TCN","dutch_cost_end":"25.0000 TCN","dutch_step_amount":"0.0000 TCN","dutch_step_secs":0,"dutch_cost_start":"25.0000 TCN","dutch_steps":0,"dutch_start":"2023-10-22T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setitem '{"i":{"id":1000004,"name":"item5","description":"confederacy item fixed cost","category":"some item category","asset_url":"none","rarity":1,"level":1,"count":250,"faction_id":2,"cost":"25.0000 TCN","dutch_cost_end":"25.0000 TCN","dutch_step_amount":"0.0000 TCN","dutch_step_secs":0,"dutch_cost_start":"25.0000 TCN","dutch_steps":0,"dutch_start":"2023-10-22T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setitem '{"i":{"id":1000005,"name":"item6","description":"alliance item fixed cost","category":"some item category","asset_url":"none","rarity":1,"level":1,"count":250,"faction_id":3,"cost":"25.0000 TCN","dutch_cost_end":"25.0000 TCN","dutch_step_amount":"0.0000 TCN","dutch_step_secs":0,"dutch_cost_start":"25.0000 TCN","dutch_steps":0,"dutch_start":"2023-10-22T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setitem '{"i":{"id":1000006,"name":"item7","description":"dominion item fixed cost","category":"some item category","asset_url":"none","rarity":1,"level":1,"count":250,"faction_id":4,"cost":"25.0000 TCN","dutch_cost_end":"25.0000 TCN","dutch_step_amount":"0.0000 TCN","dutch_step_secs":0,"dutch_cost_start":"25.0000 TCN","dutch_steps":0,"dutch_start":"2023-10-22T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setplayer '{"p":{"owner":"shaq", "asset_url":"none", "referrer":"", "faction_id":2, "last_staking_action":"1970-01-01T00:00:00.000", "last_bid_action":"1970-01-01T00:00:00.000", "last_transfer_action":"1970-01-01T00:00:00.000", "last_reqinvite_action":"1970-01-01T00:00:00.000", "actions":0, "actions_reset_time":"1970-01-01T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 setplayer '{"p":{"owner":"shaq2", "asset_url":"none", "referrer":"shaq", "faction_id":1, "last_staking_action":"1970-01-01T00:00:00.000", "last_bid_action":"1970-01-01T00:00:00.000", "last_transfer_action":"1970-01-01T00:00:00.000", "last_reqinvite_action":"1970-01-01T00:00:00.000", "actions":0, "actions_reset_time":"1970-01-01T00:00:00.000"}}' -p meta.hg3

cleos -u http://ux5.goldenplatform.com push action meta.hg3 init '{"all_auctions_end":"2023-12-02T00:00:00.000","meta_game_end":"2023-12-04T00:00:00.000"}' -p meta.hg3

*/
