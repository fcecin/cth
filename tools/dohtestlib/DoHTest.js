// -----------------------------------------------------------------------
// DoHTest.js provides functions that help DoH tests write higher-level
//   test logic that isn't just invoking cth_cleos/cth_cleos_pipe.
//
// This calls DoHTestDriver.js to init/finish the best driver available
//   for running tests (currently "doh-hotstart").
//
// It also hides the details for bringing up and tearing down the DoH
//   blockchain test environment via init/finish, and provides other
//   misc utility functions for writing tests like crashed/failed.
// -----------------------------------------------------------------------
// This library assumes it is unpacked in the global object.
// This library requires its dependencies to be already unpacked in
//   the global object: DoHTestDriver.js & DoHTestFixture.js
// -----------------------------------------------------------------------

const fs = require('fs');
const vm = require('vm');
const child_process = require('child_process');

// -----------------------------------------------------------------------
// Load required modules in the global scope if can't find them there
// -----------------------------------------------------------------------

// pulls DohTestDriver
if (typeof fixtureRun === 'undefined') { Object.assign(global, require('DoHTestFixture')); }

// FIXME/TODO: need to make this dependent on DoHTest due to getError() being called here,
//   or just get rid of the attempted modularity and just merge DoHTest and DoHTestFixture.

// -----------------------------------------------------------------------
// Exported constants
// -----------------------------------------------------------------------

const TIME_POINT_MAX = "2106-02-07T06:28:15.000";
const TIME_POINT_MIN = "1970-01-01T00:00:00.000";

const DEVELOPER_PUBLIC_KEY = "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV";

const TCN_SYMBOL = "4,TCN";

// -----------------------------------------------------------------------
// Private state
// -----------------------------------------------------------------------

// map of DoH error code to DoH error message
const dohErrorMap = new Map();

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
    const ret = doh_init(doh_target, doh_gm);
    if (ret) {
        console.log("ERROR: TEST: init(): doh_init() failed");
        process.exit(1);
    }
    doh_hotstart_instance_port = doh_hotstart_start(doh_target);
    if (doh_hotstart_instance_port < 0) {
        console.log("ERROR: TEST: init(): doh_hotstart_start() failed code: " + instance_port);
        process.exit(1);
    }

    // Finally, try to find and parse the error codes for getError().
    const actualtarget = doh_get_target_from_suffix(doh_target);
    const errfile = cth_get_root_dir() + "/local/" + actualtarget + "/doh-contracts/doh-common-code/error_codes.hpp";
    if (! fs.existsSync(errfile)) {
        console.log(`WARNING: TEST: init(): cannot find DoH error codes file '${errfile}'. Error code translation is not available.`);
    } else {
        const headerContent = fs.readFileSync(errfile, 'utf8');
        const regex = /codes\.push_back\(std::make_pair\((\d+), "([^"]+)"\)\);/g;
        let match;
        let count = 0;
        while ((match = regex.exec(headerContent)) !== null) {
            const errorCode = parseInt(match[1]);
            const errorMessage = match[2];
            dohErrorMap.set(errorCode, errorMessage);
            count++;
        }
        console.log(`TEST: init(): parsed ${count} DoH error codes from '${errfile}'.`);
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
    const ret = doh_hotstart_clear(doh_hotstart_instance_port);
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
// Utility functions
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// check
//
// crashes the test if value is undefined, logging varname.
// -----------------------------------------------------------------------

function check(varname, value) {
    if (value === undefined) {
        console.log(`ERROR: TEST: checkDefined(): "${varname}" is undefined.\n`);
        crashed();
    }
}

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
// getError
//
// given an error code (e.g. "10143") return the DoH error message.
// -----------------------------------------------------------------------

function getError(errcode) {
    if (typeof errcode === "string")
        errcode = parseInt(errcode); // because dohErrorMap keys are 'number'
    const m = dohErrorMap.get(errcode);
    if (m) {
        return m;
    } else {
        return `ERROR: getError(): DoH error code ${errcode} not found.`;
    }
}

// -----------------------------------------------------------------------
// Functions that deal with the DoH clock and contract time
// These will use a global variable "clock" that should be a
//   DoHTestReflect.js proxy object to the clock contract.
// -----------------------------------------------------------------------

function getContractTime() {
    if (typeof clock !== 'undefined') {
        // global proxy var "clock" to clock.hg? contract is defined
        let o = clock.clockinfo();
        if (o !== undefined && o.rows !== undefined && Array.isArray(o.rows) && o.rows.length) {
            // found clock singleton and it is created, so replace date with the clock contract's time
            return o.rows[0].current_time;
        }
    }
    // default that will be used if no proxy to the clock contract defined by the caller or clock
    //   singleton wasn't created. in either case, we will return current system time, which should
    //   sufficiently correlate with or track the time that contracts are using.
    let s = new Date().toISOString();
    if (s.endsWith("Z")) s = s.slice(0, -1); // strip UTC timezone char (last non-digit char if it's there)
    return s;
}

function addSecondsToTime(timeISOStr, secondsToAdd) {
    if (!timeISOStr.endsWith("Z")) timeISOStr += 'Z'; // add the UTC char if it's not there before doing time math
    let date = new Date(timeISOStr);
    date.setSeconds(date.getSeconds() + secondsToAdd);
    let s = date.toISOString();
    if (s.endsWith("Z")) s = s.slice(0, -1); // strip UTC timezone char (last non-digit char if it's there)
    return s;
}

// -----------------------------------------------------------------------
// From/to TCN amount helpers
// -----------------------------------------------------------------------

function fromTCN(val) {
    if (typeof val !== 'string')
      throw new Error('ERROR: fromTCN(): input must be a string in the format "0.0000 TCN"');
    const tcnRegex = /^(\d+(\.\d{4})?)\sTCN$/;
    const match = val.match(tcnRegex);
    if (!match)
        throw new Error('ERROR: fromTCN(): Invalid TCN format. Use "0.0000 TCN".');
    return parseFloat(match[1]);
}

function toTCN(val) {
    if (typeof val !== 'number')
        throw new Error('ERROR: toTCN(): input must be a number.');
    if (isNaN(val))
        throw new Error('ERRORL toTCN(): invalid number input.');
    return val.toFixed(4) + ' TCN';
}

// -----------------------------------------------------------------------
// Miscellaneous functions to help with manipulating eosio::name,
//   128-bit table keys, token symbols, ...
// -----------------------------------------------------------------------

// helper (internal)
function char_to_symbol(c) {
    if (c >= 'a' && c <= 'z') {
        return (c.charCodeAt(0) - 'a'.charCodeAt(0) + 6).toString();
    } else if (c >= '1' && c <= '5') {
        return (c.charCodeAt(0) - '1'.charCodeAt(0) + 1).toString();
    } else {
        return '0';
    }
}

// helper (internal)
function symbol_to_char(symbol) {
    if (symbol >= 6 && symbol <= 31) {
        return String.fromCharCode(symbol + 'a'.charCodeAt(0) - 6);
    } else if (symbol >= 1 && symbol <= 5) {
        return String.fromCharCode(symbol + '1'.charCodeAt(0) - 1);
    } else {
        return '';
    }
}

function to128(hi_u64, lo_u64) {
    if (hi_u64 === undefined) {
        throw new Error("ERROR get_128 hi");
    }
    if (lo_u64 === undefined) {
        throw new Error("ERROR get_128 lo");
    }
    const u128 = BigInt(hi_u64) << BigInt(64) | BigInt(lo_u64);
    return u128.toString();
}

function tohi64(hi) {
    if (hi === undefined) {
        throw new Error("ERROR get_hi64");
    }
    return (BigInt(hi) >> BigInt(64)).toString();
}

const __64bitmask__ = (BigInt(1) << BigInt(64)) - BigInt(1);

function tolo64(lo) {
    if (lo === undefined) {
        throw new Error("ERROR get_lo64");
    }
    return (BigInt(lo) & __64bitmask__).toString();
}

function fromName(str) {
    if (str === undefined) {
        throw new Error("ERROR name_to_u64: undef name");
    }
    if (!isValidName(str)) {
        throw new Error("ERROR name_to_u64: invalid name");
    }
    let n = BigInt(0);
    let i = 0;
    while (i < str.length && i < 12) {
        n |= (BigInt(char_to_symbol(str[i]) & 0x1f) << BigInt(64 - 5 * (i + 1)));
        i++;
    }
    if (i < str.length && i === 12) {
        n |= BigInt(char_to_symbol(str[i]) & 0x0f);
    }
    return n.toString();
}

function toName(n) {
    if (n === undefined) {
        throw new Error("ERROR u64_to_name: undef num");
    }
    let str = '';
    for (let i = 0; i < 12; i++) {
        const shift = 64 - 5 * (i + 1);
        const symbol = (n >> shift) & 0x1f;
        const char = symbol_to_char(symbol);
        if (!char) {
            break;
        }
        str += char;
    }
    return str;
}

function getSymbolCode(str) {
    if (str === undefined) {
        throw new Error("ERROR get_symbol_code: no symbol str");
    }
    if (str.length < 1 || str.length > 7) {
        throw new Error("ERROR get_symbol_code: symbol str must have between 1 and 7 characters");
    }
    let len = str.length;
    let result = BigInt(0);
    for (let i = 0; i < len; i++) {
        if (!str.match(/^[A-Z]+$/)) {
            throw new Error("ERROR: Invalid character in symbol name");
        }
        result |= (BigInt(str.charCodeAt(i)) << (8 * i));
    }
    return result.toString();
}

function getSymbolName(number) {
    if (number === undefined) {
        throw new Error("ERROR get_symbol_name: no symbol number");
    }
    if (number < 0 || number > 72057594037927935) {
        throw new Error("ERROR get_symbol_name: symbol number out of range");
    }
    let result = '';
    for (let i = 0; i < 7; i++) {
        const charCode = (number >> (8 * i)) & 0xFF;
        if (charCode === 0) {
            break;
        }
        if (charCode < 65 || charCode > 90) {
            throw new Error("ERROR: Invalid character in symbol name");
        }
        result += String.fromCharCode(charCode);
    }
    return result;
}

function isValidName(str) {
    if (str.length < 1 || str.length > 12) {
        return false;
    }
    if (!str.match(/^(?!.*[^1-5a-z\.])[1-5a-z\.]+$/)) {
        return false;
    }
    if (str.startsWith('.') || str.endsWith('.') || str.includes('..')) {
        return false;
    }
    return true;
}

// -----------------------------------------------------------------------
// DoH high-level testcase logic functions
//
// All of these functions expect the following global variables to be set:
//   doh_target: hegemon contracts suffix, e.g. "hg3"
//   tcn_target: token contracts suffix, e.g. "tc3"
//   doh_gm: game master account for hegemon::setgm()
// -----------------------------------------------------------------------

// Private helper function for testcase logic functions that can fail/crash
function handleError(error) {

    // If inside a fixture test, just rethrow the error and this fixture test will
    //   fail and the test will continue to the next fixture test.
    if (fixtureRunning())
        throw error;

    // Not inside fixture test: this is a regular, fatal failure at the top context
    console.log(error);
    finish();
    process.exit(1);
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

function createBasicGame(use_clock = true) {
    fixtureLog("createBasicGame(): started.");
    try {
        if (use_clock) {
            cleos(`push action clock.${doh_target} useclock '{}' -p clock.${doh_target}`);
            cleos(`push action clock.${doh_target} sethash '{"hash":"092ba25b75b0ee1ac79c5a1aa1df28a5129cd8d15b878fdb50dc804fda79dbc8"}' --force-unique -p clock.${doh_target}`);
        }

        cleos(`push action staking.${tcn_target} init '{ "epoch":"1", "distrib_contracts": [ "energy.${tcn_target}", "rep.${tcn_target}"], "drip_contracts": [ "main.${tcn_target}", "players.${tcn_target}"] }' -p staking.${tcn_target}`);

        cleos(`push action hegemon.${doh_target} addfaction '{"id":1, "global_entity_id":52, "name":"Empire", "code":"em", "flag_asset_url":"/factions-flags/flag-empire.jpg"}' -p hegemon.${doh_target}`);
        cleos(`push action hegemon.${doh_target} addfaction '{"id":2, "global_entity_id":53, "name":"Confederacy", "code":"co", "flag_asset_url":"/factions-flags/flag-confederacy.jpg"}' -p hegemon.${doh_target}`);
        cleos(`push action hegemon.${doh_target} addfaction '{"id":3, "global_entity_id":54, "name":"Alliance", "code":"al", "flag_asset_url":"/factions-flags/flag-alliance.jpg"}' -p hegemon.${doh_target}`);
        cleos(`push action hegemon.${doh_target} addfaction '{"id":4, "global_entity_id":55, "name":"Dominion", "code":"do", "flag_asset_url":"/factions-flags/flag-dominion.jpg"}' -p hegemon.${doh_target}`);

        cleos(`push action crafting.${doh_target} addeffect '{"id":1, "name":"Plains", "description":"Farming production output increased by 50%. Mining production output decreased by 50%", "modifiers":[{ "modified_stat" : 3, "modifier_operator": 1, "condition": { "target":2, "filter":null, "value": 3 }, "value": 50 }, { "modified_stat" : 3, "modifier_operator": 1, "condition": { "target":2, "filter":null, "value": 1 }, "value": -50 }], "duration":-1 }' -p crafting.${doh_target} `);

        cleos(`push action hegemon.${doh_target} addplanet '{"id":1, "area_map":"tulon", "q_coord":0, "r_coord":0, "name":"Tulon", "code":"tu", "asset_url":"/planets/tulon.png", "r_color":255, "g_color":255, "b_color":255}' -p hegemon.${doh_target}`);

        cleos(`push action hegemon.${doh_target} addregion '{"id":1, "area_map":"tulon", "name":"Nefari", "code":"ne"}' -p hegemon.${doh_target}`);

        cleos(`push action hegemon.${doh_target} addterrain '{"id":1, "type":"Plains", "map_asset_urls":["/tiles/tile-plains.jpg"], "background_asset_url":"/character-backgrounds/character-background-plains.png", "building_slots":6, "effects":[1]}' -p hegemon.${doh_target}`);

        cleos(`push action hegemon.${doh_target} addtile '{"id":1,"area_map":"tulon","region_id":1,"q_coord":0,"r_coord":0,"terrain_type":1}' -p hegemon.${doh_target}`);
        cleos(`push action hegemon.${doh_target} addtile '{"id":2,"area_map":"tulon","region_id":1,"q_coord":0,"r_coord":1,"terrain_type":1}' -p hegemon.${doh_target}`);

        cleos(`push action staking.${tcn_target} enable '{}' -p staking.${tcn_target}`);

        // must set GM before first regplayer
        cleos(`push action hegemon.${doh_target} setgm '{"player":"${doh_gm}"}' -p hegemon.${doh_target}`);

    } catch (error) {
        handleError(error);
    }
    fixtureLog("createBasicGame(): finished OK.");
}

// -----------------------------------------------------------------------
// createBasicPlayers
//
// Registers dohplayer1 and dohplayer2, and three characters.
// -----------------------------------------------------------------------

function createBasicPlayers(use_clock = true) {
    fixtureLog("createBasicPlayers(): started.");
    try {
        cleos(`system newaccount eosio dohplayer1 EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV --stake-cpu '10000.0000 EOS' --stake-net '10000.0000 EOS' --buy-ram-kbytes 1000 --transfer`);
        cleos(`system newaccount eosio dohplayer2 EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV --stake-cpu '10000.0000 EOS' --stake-net '10000.0000 EOS' --buy-ram-kbytes 1000 --transfer`);

        cleos(`push action names.${doh_target} addcname '{"id":1, "first_name":"Jimmy", "middle_name":"", "last_name":"Page", "asset_url":"/characters/character-jimmy-page-neutral.png", "faction_id":2}' -p names.${doh_target}`);
        cleos(`push action names.${doh_target} addcname '{"id":2, "first_name":"Robert", "middle_name":"", "last_name":"Plant", "asset_url":"/characters/character-robert-plant-neutral.png", "faction_id":2}' -p names.${doh_target}`);
        cleos(`push action names.${doh_target} addcname '{"id":3, "first_name":"Jimi", "middle_name":"", "last_name":"Hendrix", "asset_url":"/characters/character-jimi-hendrix-neutral.png", "faction_id":4}' -p names.${doh_target}`);

        cleos(`push action dejavu.${doh_target} setplayer '{"p":{"owner":"dohplayer1", "asset_url":"/players/dominion/player-confederacy-01.png", "count":0, "reputation":0, "faction_id":2, "location_tile_id":1}}' -p hegemon.${doh_target}`);
        cleos(`push action dejavu.${doh_target} setplayer '{"p":{"owner":"dohplayer2", "asset_url":"/players/dominion/player-dominion-02.png", "count":0, "reputation":0, "faction_id":4, "location_tile_id":1}}' -p hegemon.${doh_target}`);

        cleos(`push action hegemon.${doh_target} regplayer '{"player":"dohplayer1", "opt_out_of_politics":false}' --force-unique -p dohplayer1`);
        cleos(`push action hegemon.${doh_target} regplayer '{"player":"dohplayer2", "opt_out_of_politics":false}' --force-unique -p dohplayer2`);

        cleos(`push action hegemon.${doh_target} createchar '{"player":"dohplayer1"}' --force-unique -p dohplayer1`);
        cleos(`push action hegemon.${doh_target} createchar '{"player":"dohplayer1"}' --force-unique -p dohplayer1`);
        cleos(`push action hegemon.${doh_target} createchar '{"player":"dohplayer2"}' --force-unique -p dohplayer2`);

        // FIXME: Should have a check clock initialized thing that looks at the blockchain to figure it out
        if (use_clock) cleos(`push action clock.${doh_target} clockaddsec '{"seconds":120}' --force-unique -p clock.${doh_target}`); //;
    } catch (error) {
        handleError(error);
    }
    fixtureLog("createBasicPlayers(): finished OK.");
}

// -----------------------------------------------------------------------
// createBasicEconomy
//
// Basic drip config and TCN token creation
// -----------------------------------------------------------------------

function createBasicEconomy() {
    fixtureLog("createBasicEconomy(): started.");
    try {
        cleos(`push action main.${tcn_target} adddrip '{"symbol":"4,TCN", "contract":"tokens.${tcn_target}", "buckets":["players.${tcn_target}"], "shares":[10000]}' --force-unique -p main.${tcn_target}@active`);
        cleos(`push action players.${tcn_target} adddrip '{"symbol":"4,TCN", "contract":"tokens.${tcn_target}", "buckets":["energy.${tcn_target}","rep.${tcn_target}"], "shares":[7000, 3000]}' --force-unique -p players.${tcn_target}@active`);
        cleos(`push action tokens.${tcn_target} create '{"issuer":"hegemon.${doh_target}", "maximum_supply":"100000000000.0000 TCN"}' -p tokens.${tcn_target}@active`);
        cleos(`push action tokens.${tcn_target} issue '{"to":"hegemon.${doh_target}", "quantity":"100000000.0000 TCN", "memo":"initial issuance"}' -p hegemon.${doh_target}@active`);
        cleos(`transfer hegemon.${doh_target} reserve.${tcn_target} "100000000.0000 TCN" "" --contract tokens.${tcn_target} -p hegemon.${doh_target}@active`);
        // mint another 100 million free-floating TCN for testing purposes (e.g. give it to players etc.)
        cleos(`push action tokens.${tcn_target} issue '{"to":"hegemon.${doh_target}", "quantity":"100000000.0000 TCN", "memo":"testing allowance"}' -p hegemon.${doh_target}@active`);

    } catch (error) {
        handleError(error);
    }
    fixtureLog("createBasicEconomy(): finished OK.");
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

    // Utility functions
    check,
    epochSecsFromDateString,
    getError,
    getContractTime,
    addSecondsToTime,
    fromTCN,
    toTCN,
    to128,
    tohi64,
    tolo64,
    fromName,
    toName,
    getSymbolCode,
    getSymbolName,
    isValidName,

    // Testcase building blocks
    createBasicGame,
    createBasicPlayers,
    createBasicEconomy,

    // Constants
    TIME_POINT_MAX,
    TIME_POINT_MIN,
    DEVELOPER_PUBLIC_KEY,
    TCN_SYMBOL,
};
