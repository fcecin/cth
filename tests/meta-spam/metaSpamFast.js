// --------------------------------------------------------------------------------------------
// Test the meta contract's anti-spam feature.
//
// Fast version that doesn't iterate 1000+ times
// --------------------------------------------------------------------------------------------

fixtureLog("logic started");

cleos(`push action clock.${doh_target} sethash '{"hash":"092ba25b75b0ee1ac79c5a1aa1df28a5129cd8d15b878fdb50dc804fda79dbc7"}' --force-unique -p clock.${doh_target}`);

//  create a fragment of a meta world and init it

cleos(`push action meta.${doh_target} setfaction '{"f":{"id":1,"faction_name":"empire","description":"empire description","founder":"empirefd"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setfaction '{"f":{"id":2,"faction_name":"confederacy","description":"confederacy description","founder":"confedfd"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setfaction '{"f":{"id":3,"faction_name":"alliance","description":"alliance description","founder":"alliancefd"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setfaction '{"f":{"id":4,"faction_name":"dominion","description":"dominion description","founder":"dominionfd"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setplanet '{"p":{"id":1,"planet_name":"planet1"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setplanet '{"p":{"id":2,"planet_name":"planet2"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setregion '{"r":{"id":1,"planet_id":1,"region_name":"p1r1"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setregion '{"r":{"id":2,"planet_id":1,"region_name":"p1r2"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setregion '{"r":{"id":3,"planet_id":2,"region_name":"p2r1"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setregion '{"r":{"id":4,"planet_id":2,"region_name":"p2r2"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} init '{"all_auctions_end":"${TIME_POINT_MAX}","meta_game_end":"${TIME_POINT_MAX}"}' --force-unique -p meta.${doh_target}`);

// Give some TCN to our players

cleos(`push action tokens.tc3 transfer '{"from":"hegemon.hg3", "to":"dohplayer1", "quantity":"10000.0000 TCN", "memo":""}' -p hegemon.${doh_target}\@active`);

cleos(`push action tokens.tc3 transfer '{"from":"hegemon.hg3", "to":"dohplayer2", "quantity":"10000.0000 TCN", "memo":""}' -p hegemon.${doh_target}\@active`);

// players
// rig the player record for dohplayer1 (gm) to trigger staking spam in ~5 iterations (just set last action to time point max & count to 995)

let rigged_action_count = 995;

cleos(`push action meta.${doh_target} setplayer '{"p":{"owner":"dohplayer1", "asset_url":"none", "referrer":"", "faction_id":1, "last_staking_action":"1970-01-01T00:00:00.000", "last_bid_action":"1970-01-01T00:00:00.000", "last_transfer_action":"1970-01-01T00:00:00.000", "last_reqinvite_action":"1970-01-01T00:00:00.000", "actions":${rigged_action_count}, "actions_reset_time":"${TIME_POINT_MAX}"}}' -p meta.${doh_target}`);

cleos(`push action meta.${doh_target} setplayer '{"p":{"owner":"dohplayer2", "asset_url":"none", "referrer":"", "faction_id":2, "last_staking_action":"1970-01-01T00:00:00.000", "last_bid_action":"1970-01-01T00:00:00.000", "last_transfer_action":"1970-01-01T00:00:00.000", "last_reqinvite_action":"1970-01-01T00:00:00.000", "actions":0, "actions_reset_time":"1970-01-01T00:00:00.000"}}' -p meta.${doh_target}`);

// deposit in contract so dohplayer1 can loop calling dostake later (which does have spam protection; a token transfer can't)

cleos(`push action meta.hg3 open '{"player":"dohplayer1","symbol":"4,TCN","ram_payer":"dohplayer1"}' -p dohplayer1`);

cleos(`push action tokens.tc3 transfer '{"from":"dohplayer1", "to":"meta.hg3", "quantity":"1000.0000 TCN", "memo":"deposit"}' -p dohplayer1`);

// try to trigger spam

success = false;

for (let i = rigged_action_count + 1; i < 1010; i++) {
    console.log(`i = ${i}`);

    let [output, error] = cleosNoThrow(`push action meta.${doh_target} dostake '{"owner":"${doh_gm}","amount":"0.0001 TCN","region_id":1}' --force-unique -p ${doh_gm}`);

    if (error) {
        let got_expected_error = /maximum 1000 player actions per day/.test(output);
        if (i == 1001 || got_expected_error) {
            fixtureLog(`Anti-spam mechanism is working as expected (triggered at iteration: '${i}'; got expected error message: '${got_expected_error}').`);
            success = true;
            break;
        }
        fixtureFailed("Anti-spam mechanism triggered an action failure, but not at the expected time.");
    }
}

if (! success) {
    fixtureFailed("Anti-spam mechanism failed to trigger.");
}
