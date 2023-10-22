// -----------------------------------------------------------------------
// DoHTest.js provides functions that help DoH tests write higher-level
//   test logic that isn't just invoking cth_cleos/cth_cleos_pipe.
//
// It also hides the details for bringing up and tearing down the DoH
//   blockchain test environment via init/finish, and provides other
//   misc utility functions for writing tests like crashed/failed.
// -----------------------------------------------------------------------

const child_process = require('child_process');

const dohTestDriver = require('DoHTestDriver');

// -----------------------------------------------------------------------
// Management functions
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// init
//
// Helper for initializing the test environment using the DoHTestDriver
//  library. Should be the first thing called by the testcase.
//
// Reads the following Node.js global variables:
//   doh_gm: game master account
//   doh_target: DoH compilation/deployment target (e.g. "hg3")
//
// Defines and writes the following Node.js global variables:
//   doh_hotstart_instance_port: P2P port of the started nodeos
// -----------------------------------------------------------------------

function init() {
    console.log("TEST: init(): setting up test environment...");
    if (typeof doh_target === 'undefined') {
        console.log("ERROR: TEST: init(): cannot find doh_target; tests must define a doh_target variable.");
        process.exit(1);
    }
    if (typeof doh_gm === 'undefined') {
        console.log("ERROR: TEST: init(): cannot find doh_gm; tests must define a doh_gm variable.");
        process.exit(1);
    }
    const ret = dohTestDriver.doh_init(doh_target, doh_gm);
    if (ret) {
        console.log("ERROR: TEST: init(): doh_init() failed");
        process.exit(1);
    }
    doh_hotstart_instance_port = dohTestDriver.doh_hotstart_start(doh_target);
    if (doh_hotstart_instance_port < 0) {
        console.log("ERROR: TEST: init(): doh_hotstart_start() failed code: " + instance_port);
        process.exit(1);
    }
    console.log("TEST: init(): OK");
}

// -----------------------------------------------------------------------
// finish
//
// Stops and wipes the nodeos instance created by the doh_hotstart driver
//   through init().
//
// Reads the following Node.js global variables:
//   doh_hotstart_instance_port: P2P port of the started nodeos
// -----------------------------------------------------------------------

function finish() {
    console.log("TEST: finish(): starting cleanup...");
    if (typeof doh_hotstart_instance_port === 'undefined') {
        console.log("ERROR: TEST: finish(): cannot find doh_hotstart_instance_port; it's likely that testInit() wasn't called.");
        process.exit(1);
    }
    const ret = dohTestDriver.doh_hotstart_clear(doh_hotstart_instance_port);
    if (ret) {
        console.log("ERROR: TEST: finish(): doh_hotstart_clear() failed");
        process.exit(1);
    }
    console.log("TEST: finish(): cleanup OK.");
}

// -----------------------------------------------------------------------
// crashed
//
// Simple test helper function to notify when a testcase has crashed
// -----------------------------------------------------------------------

function crashed() {
    console.log("ERROR: TEST: crashed(): test has crashed.");
    finish();
    process.exit(1);
}

// -----------------------------------------------------------------------
// failed
//
// Simple test helper function to notify when a testcase has failed
// -----------------------------------------------------------------------

function failed() {
    console.log("ERROR: TEST: failed(): test has failed.");
    finish();
    process.exit(1);
}

// -----------------------------------------------------------------------
// DoH high-level testcase logic functions
//
// All of these functions expect the following global variables to be set:
//   doh_target: hegemon contracts suffix, e.g. "hg3"
//   tcn_target: token contracts suffix, e.g. "tc3"
//   doh_gm: game master account for hegemon::setgm()
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// epochSecsFromDateString
//
// return seconds from epoch given a typical date string fetched from
//   contracts.
// -----------------------------------------------------------------------

function epochSecsFromDateString(date_string) {
    // Perl version: qx(TZ=UTC date -d "$date_string" +"%s");
    return child_process.execSync(`TZ=UTC date -d "${date_string}" +"%s"`, { encoding: 'utf-8' }).trim();
}

// -----------------------------------------------------------------------
// createBasicGame
//
// Defines and initializes a very basic DoH world.
// It will also set the game master account name (defined by global var
//   ${doh_gm}).
//
// It's a world with two plains tiles.
// To finish it up call e.g. createBasicPlayers() afterwards.
// -----------------------------------------------------------------------

function createBasicGame() {

    console.log("TEST: createBasicGame(): started.\n");

    cth_cleos(`push action clock.${doh_target} useclock '{}' -p clock.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action staking.${tcn_target} init '{ "epoch":"1", "distrib_contracts": [ "energy.${tcn_target}", "rep.${tcn_target}"], "drip_contracts": [ "main.${tcn_target}", "players.${tcn_target}"] }' -p staking.${tcn_target}`) ? crashed() : null;

    cth_cleos(`push action clock.${doh_target} sethash '{"hash":"092ba25b75b0ee1ac79c5a1aa1df28a5129cd8d15b878fdb50dc804fda79dbc8"}' --force-unique -p clock.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} addfaction '{"id":1, "global_entity_id":52, "name":"Empire", "code":"em", "flag_asset_url":"/factions-flags/flag-empire.jpg"}' -p hegemon.${doh_target}`) ? crashed() : null;
    cth_cleos(`push action hegemon.${doh_target} addfaction '{"id":2, "global_entity_id":53, "name":"Confederacy", "code":"co", "flag_asset_url":"/factions-flags/flag-confederacy.jpg"}' -p hegemon.${doh_target}`) ? crashed() : null;
    cth_cleos(`push action hegemon.${doh_target} addfaction '{"id":3, "global_entity_id":54, "name":"Alliance", "code":"al", "flag_asset_url":"/factions-flags/flag-alliance.jpg"}' -p hegemon.${doh_target}`) ? crashed() : null;
    cth_cleos(`push action hegemon.${doh_target} addfaction '{"id":4, "global_entity_id":55, "name":"Dominion", "code":"do", "flag_asset_url":"/factions-flags/flag-dominion.jpg"}' -p hegemon.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action crafting.${doh_target} addeffect '{"id":1, "name":"Plains", "description":"Farming production output increased by 50%. Mining production output decreased by 50%", "modifiers":[{ "modified_stat" : 3, "modifier_operator": 1, "condition": { "target":2, "filter":null, "value": 3 }, "value": 50 }, { "modified_stat" : 3, "modifier_operator": 1, "condition": { "target":2, "filter":null, "value": 1 }, "value": -50 }], "duration":-1 }' -p crafting.${doh_target} `) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} addplanet '{"id":1, "area_map":"tulon", "q_coord":0, "r_coord":0, "name":"Tulon", "code":"tu", "asset_url":"/planets/tulon.png", "r_color":255, "g_color":255, "b_color":255}' -p hegemon.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} addregion '{"id":1, "area_map":"tulon", "name":"Nefari", "code":"ne"}' -p hegemon.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} addterrain '{"id":1, "type":"Plains", "map_asset_urls":["/tiles/tile-plains.jpg"], "background_asset_url":"/character-backgrounds/character-background-plains.png", "building_slots":6, "effects":[1]}' -p hegemon.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} addtile '{"id":1,"area_map":"tulon","region_id":1,"q_coord":0,"r_coord":0,"terrain_type":1}' -p hegemon.${doh_target}`) ? crashed() : null;
    cth_cleos(`push action hegemon.${doh_target} addtile '{"id":2,"area_map":"tulon","region_id":1,"q_coord":0,"r_coord":1,"terrain_type":1}' -p hegemon.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action staking.${tcn_target} enable '{}' -p staking.${tcn_target}`) ? crashed() : null;

    // must set GM before first regplayer
    cth_cleos(`push action hegemon.${doh_target} setgm '{"player":"${doh_gm}"}' -p hegemon.${doh_target}`) ? crashed() : null;

    console.log("TEST: createBasicGame(): finished OK.\n");
}

// -----------------------------------------------------------------------
// createBasicPlayers
//
// Registers dohplayer1 and dohplayer2, and three characters.
// -----------------------------------------------------------------------

function createBasicPlayers() {

    cth_cleos("system newaccount eosio dohplayer1 EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV --stake-cpu '10000.0000 EOS' --stake-net '10000.0000 EOS' --buy-ram-kbytes 1000 --transfer") ? crashed() : null;

    cth_cleos("system newaccount eosio dohplayer2 EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV --stake-cpu '10000.0000 EOS' --stake-net '10000.0000 EOS' --buy-ram-kbytes 1000 --transfer") ? crashed() : null;

    cth_cleos(`push action names.${doh_target} addcname '{"id":1, "first_name":"Jimmy", "middle_name":"", "last_name":"Page", "asset_url":"/characters/character-jimmy-page-neutral.png", "faction_id":2}' -p names.${doh_target}`) ? crashed() : null;
    cth_cleos(`push action names.${doh_target} addcname '{"id":2, "first_name":"Robert", "middle_name":"", "last_name":"Plant", "asset_url":"/characters/character-robert-plant-neutral.png", "faction_id":2}' -p names.${doh_target}`) ? crashed() : null;
    cth_cleos(`push action names.${doh_target} addcname '{"id":3, "first_name":"Jimi", "middle_name":"", "last_name":"Hendrix", "asset_url":"/characters/character-jimi-hendrix-neutral.png", "faction_id":4}' -p names.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action dejavu.${doh_target} setplayer '{"p":{"owner":"dohplayer1", "asset_url":"/players/dominion/player-confederacy-01.png", "count":0, "reputation":0, "faction_id":2, "location_tile_id":1}}' -p hegemon.${doh_target}`) ? crashed() : null;
    cth_cleos(`push action dejavu.${doh_target} setplayer '{"p":{"owner":"dohplayer2", "asset_url":"/players/dominion/player-dominion-02.png", "count":0, "reputation":0, "faction_id":4, "location_tile_id":1}}' -p hegemon.${doh_target}`) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} regplayer '{"player":"dohplayer1", "opt_out_of_politics":false}' --force-unique -p dohplayer1`) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} regplayer '{"player":"dohplayer2", "opt_out_of_politics":false}' --force-unique -p dohplayer2`) ? crashed() : null;

    cth_cleos(`push action hegemon.${doh_target} createchar '{"player":"dohplayer1"}' --force-unique -p dohplayer1`) ? crashed() : null;
    cth_cleos(`push action hegemon.${doh_target} createchar '{"player":"dohplayer1"}' --force-unique -p dohplayer1`) ? crashed() : null;
    cth_cleos(`push action hegemon.${doh_target} createchar '{"player":"dohplayer2"}' --force-unique -p dohplayer2`) ? crashed() : null;

    cth_cleos(`push action clock.${doh_target} clockaddsec '{"seconds":120}' --force-unique -p clock.${doh_target}`) ? crashed() : null;
}

// -----------------------------------------------------------------------
// End of library.
// -----------------------------------------------------------------------

module.exports = {

    // Management
    init,
    finish,
    crashed,
    failed,

    // Testcase construction
    epochSecsFromDateString,
    createBasicGame,
    createBasicPlayers,
};
