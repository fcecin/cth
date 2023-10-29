// -----------------------------------------------------------------------
// DoHTestFixture.js
//
// The Test Fixture feature allow a single test script (cth "run" file)
//   to define and run multiple actual tests.
// -----------------------------------------------------------------------

const fs = require('fs');
const vm = require('vm');
const dohTestDriver = require('DoHTestDriver');

// -----------------------------------------------------------------------
// GLOBAL variables
// -----------------------------------------------------------------------

// set the current fixture name (for logging) whenever this module is loaded
//   by anybody during the test flow and the global variable _fixtureCurrent
//   has not been declared or has an undefined value.
// the default value will signal in the run.log file that the current running
//   test is not using the fixtures feature
if (typeof _fixtureCurrent === 'undefined' || _fixtureCurrent === undefined) {
    _fixtureCurrent = 'NO_FIXTURE';
}

// -----------------------------------------------------------------------
// Private state
// -----------------------------------------------------------------------

const fixtureCleanupFile = 'fixtureCleanup.js';

// fixture test name --> fixture result summary string
const fixtureResultMap = new Map();

// fixture tally
let fixturePassedCount = 0;
let fixtureFailedCount = 0;

// -----------------------------------------------------------------------
// Exported variables
// -----------------------------------------------------------------------

// game constants map from the readonly contract
let doh;

// -----------------------------------------------------------------------
// cleos
//
// Wrapper to cth_cleos_pipe2 that throws a Javascript exception (error)
//   with the output as the error message., instead of returning the error
//   codes to the caller for crashing/failing the entire process.
//
// Since fixture testing runs multiple tests in the same process, an
//   error in one fixture test cannot simply exit the process.
//
// This also works EVEN if the test writer isn't using fixtures, since
//   if you throw an error and you don't catch it, it's going to crash
//   the process (good news for the createXXXGame() functions).
// -----------------------------------------------------------------------

function cleos(args) {
    let [output, error] = dohTestDriver.cth_cleos_pipe2(args);
    if (error !== 0)
        throw new Error(output);
    return output;
}

// -----------------------------------------------------------------------
// cleosNoThrow
//
// To avoid loading the driver library just for cth_cleos_pipe2.
// -----------------------------------------------------------------------

function cleosNoThrow(args) { return dohTestDriver.cth_cleos_pipe2(args); }

// -----------------------------------------------------------------------
// fixtureCrashed
//
// Crash the current running fixture test
// -----------------------------------------------------------------------

function fixtureCrashed(msg) {
    throw new Error(`ERROR: TEST [${_fixtureCurrent}]: fixtureCrashed: ${msg}`);
}

// -----------------------------------------------------------------------
// fixtureFailed
//
// Fail the current running fixture test
// -----------------------------------------------------------------------

function fixtureFailed(msg) {
    throw new Error(`ERROR: TEST [${_fixtureCurrent}]: fixtureFailed: ${msg}`);
}

// -----------------------------------------------------------------------
// fixtureLog
//
// Print msg with the current fixture name as prefix
// -----------------------------------------------------------------------

function fixtureLog(msg) {
    console.log(`TEST [${_fixtureCurrent}]: ${msg}`);
}

// -----------------------------------------------------------------------
// fixtureErrorLog
//
// Print error msg with the current fixture name as prefix
// -----------------------------------------------------------------------

function fixtureErrorLog(msg) {
    console.log(`ERROR: TEST [${_fixtureCurrent}]: ${msg}`);
}

// -----------------------------------------------------------------------
// fixtureRunning
//
// Returns true if inside of fixtureRun(), false otherwise.
// -----------------------------------------------------------------------

function fixtureRunning() {
    return (_fixtureCurrent !== 'NO_FIXTURE' && _fixtureCurrent !== 'FIXTURE_INIT' && _fixtureCurrent !== 'FIXTURE_FINISH');
}

// -----------------------------------------------------------------------
// fixtureRun
//
// Marks the start of a new test. If the test name ends with '.js', it
//   will interpret the name as a javascript file name and execute it.
// If there's a "fixtureCleanup.js" file in the test's current directory,
//   it will be loaded and executed before the test.
// -----------------------------------------------------------------------

function fixtureRun(testname) {
    _fixtureCurrent = testname;
    let result = '';
    if (fs.existsSync(fixtureCleanupFile)) {
        console.log(`TEST: fixtureRun(): loading fixture cleanup script '${fixtureCleanupFile}'...`);
        fixtureCleanupScript = fs.readFileSync(fixtureCleanupFile); // , 'utf8'
        console.log(`TEST: fixtureRun(): clearing fixture before running '${testname}'...`);
        try {
            vm.runInThisContext(fixtureCleanupScript);
        } catch (error) {
            console.log(`fixtureRun: error clearing fixture before running '${testname}': ${error}`);
            result = `Failed (can't clean up the fixture with '${fixtureCleanupScript}')`;
            fixtureFailedCount++;
        }
    }
    if (result === '') {
        console.log(`TEST: fixtureRun(): running '${testname}'...`);
        try {
            let script = fs.readFileSync(testname);
            vm.runInThisContext(script);
            result = "Passed.";
            fixturePassedCount++;
        } catch (error) {
            console.log(`TEST: fixtureRun(): error running '${testname}': ${error}`);

            // TODO: extract DoH error string (or code if can't translate) here and add to the result string

            result = "Failed.";
            fixtureFailedCount++;
        }
    }
    fixtureResultMap.set(testname, result);
    console.log(`TEST: fixtureRun(): ${testname}: ${result}`);
    _fixtureCurrent = "FIXTURE_FINISH";
}

// -----------------------------------------------------------------------
// fixtureCount
//
// Returns the number of passed and failed fixture tests.
// -----------------------------------------------------------------------

function fixtureCount() {
    return [fixturePassedCount, fixtureFailedCount];
}

// -----------------------------------------------------------------------
// fixturePrintSummary
//
// Print fixture testing summary
// -----------------------------------------------------------------------

function fixturePrintSummary() {
    console.log();
    console.log("Fixture testing summary:");
    console.log();
    for (const [key, value] of fixtureResultMap) {
        console.log(`  ${key}: ${value}`);
    }
    console.log();
}

// -----------------------------------------------------------------------
// fixtureInit
//
// Helper function that provides a standard way to init a test process.
//
// gm: game master account name
// hg: hegemon contract suffix (e.g. 'hg3')
// tc: TCN contract suffix (e.g. 'tc3')
// -----------------------------------------------------------------------

function fixtureInit(gm, hg, tc) {

    console.log("TEST: fixtureInit(): initializing test...");

    if (gm === undefined) {
        console.log("ERROR: TEST: fixtureInit(): game master is undefined");
        process.exit(1);
    }

    // Load DoHTest.js in the global scope of the test script
    Object.assign(global, require('DoHTest'));

    // default target is the 'test' target (hg3/tc3)
    hg === undefined ? hg = "hg3" : null;
    tc === undefined ? tc = "tc3" : null;

    // global variables required by DoHTest.js init() (loaded in the global object by fixtureInit())
    doh_target = hg;
    tcn_target = tc;
    doh_gm     = gm;

    // starts nodeos
    init();

    // get the game constants from the readonly contract
    doh = getConstants();

    // for when we are setting up the game (e.g. createBasicGame()) before the first
    //   DoH test is run in the fixture (to differentiate from 'NO_FIXTURE').
    _fixtureCurrent = 'FIXTURE_INIT';

    console.log("TEST: fixtureInit(): initialization OK.");
}

// -----------------------------------------------------------------------
// fixtureFinish
//
// Helper function that provides a standard way to finish a test process.
//
// This function exits the process either in success (0) or failure (1).
// -----------------------------------------------------------------------

function fixtureFinish(error) {

    console.log("TEST: fixtureFinish(): finishing test...");

    // clean up the test driver
    finish();

    if (error !== undefined) {
        // If given an error parameter, the summary is NOT printed.
        // Instead, it is assumed that the testcase run file failed entirely.
        console.log(`ERROR: TEST: fixtureFinish(): testcase was aborted by a fatal error: ${error}`);
        console.log("ERROR: TEST: fixtureFinish(): process.exit(1)");
        process.exit(1);
    } else {

        fixturePrintSummary();

        let [passCount, failCount] = fixtureCount();
        totalCount = passCount + failCount;

        if (failCount > 0) {
            console.log(`ERROR: TEST: fixtureFinish(): failed ${failCount} tests of ${totalCount} total.`);
            process.exit(1);
        } else {
            console.log(`TEST: fixtureFinish(): completed all (${totalCount}) tests successfully.`);
        }

        console.log("TEST: fixtureFinish(): process.exit(0)");
        process.exit(0);
    }
}

// -----------------------------------------------------------------------
// End of library.
// -----------------------------------------------------------------------

module.exports = {

    // Functions
    cleos,
    cleosNoThrow,
    fixtureLog,
    fixtureErrorLog,
    fixtureCrashed,
    fixtureFailed,
    fixtureRunning,
    fixtureRun,
    fixtureCount,
    fixturePrintSummary,
    fixtureInit,
    fixtureFinish,

    // Variables
    doh,
};
