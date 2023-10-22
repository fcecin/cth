// -----------------------------------------------------------------------
// DoHTestDriver.js allows a test to start and stop nodeos and use cleos,
//   and provides other test-harness-related facilities.
//
// This is the "low-level" DoH JS test library.
//
// This was ported from the DoHGoodies and CthGoodies Perl libraries to
//   javascript and, at least at that point, they were equivalent.
// -----------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// -----------------------------------------------------------------------
// Global state
// -----------------------------------------------------------------------

// ----- CthGoodies state -----

// No cleos provider configured by default
let cleosProviderDriver;
let cleosProviderWorkingDir;

// No cleos URL argument by default
let cleosUrlParam = '';

// ----- DoHGoodies state -----

// main contract suffix being used (hgm, hg1, hg2, ...)
let doh_target;

// sign transactions with anything; for actions that don't require_auth
let default_signer;

// doh_hotstart_start() fills it with all DoH readonly constants
const doh_constants = {};

// -----------------------------------------------------------------------
// cth_get_root_dir
//
// Returns path to our best guess to what the root directory of the
// running cth installation is.
// This is suddenly an issue because we're now allowing tests to be
// installed "anywhere".
// This added complexity is only needed for the test library functions.
// The driver programs don't call tests, and drivers and tools are all
// still at standard, relative, well-known locations w.r.t. each other.
// -----------------------------------------------------------------------

function cth_get_root_dir() {
    return path.dirname(path.dirname(path.dirname(__filename)));
}

// -----------------------------------------------------------------------
// cth_skip_test
//
// Returns the special test skip code that the cth test runner expects.
// -----------------------------------------------------------------------

function cth_skip_test() {
    console.log("cth_skip_test: ending test with the skip return code (32)");
    process.exit(32);
}

// -----------------------------------------------------------------------
// cth_set_cleos_provider
//
// This configures the library to use the given driver as the cleos
// provider. We assume the standard cth directory structure, so the
// driver name directly translates to its expected directory location.
// Calls to cth_cleos will use the keosd.sock and the default.wallet
// that is in that location.
//
// inputs:
//   driver : name of the driver that creates and runs the wallet when
//     started, e.g. "cleos-driver".
//
// outputs:
//   retval : zero if OK, nonzero if some error (test should fail).
// -----------------------------------------------------------------------

function cth_set_cleos_provider(driver) {
    if (driver === undefined) {
        console.log("ERROR: cth_set_cleos_provider: driver argument is undefined");
        return 1;
    }

    const driverWorkingDir = path.join(cth_get_root_dir(), 'local', driver);

    cleosProviderDriver = driver;
    cleosProviderWorkingDir = path.resolve(driverWorkingDir);

    return 0;
}

// -----------------------------------------------------------------------
// cth_set_cleos_url
//
// This sets the --url= parameter value to be passed to cleos in every
//   subsequent call to cth_cleos().
//
// inputs:
//   $url : nodeos URL
//
// outputs:
//   $retval : 0 on success, 1 on error (given url is undefined)
// -----------------------------------------------------------------------

function cth_set_cleos_url(url) {
    if (url === undefined) {
        console.log("ERROR: cth_set_cleos_url: url argument is undefined");
        return 1;
    }
    if (url === '') {
        cleosUrlParam = '';
    } else {
        cleosUrlParam = `--url=${url}`;
    }
    return 0;
}

// -----------------------------------------------------------------------
// cth_cleos
//
// Use the configured cleos provider to call cleos. Returns zero if all
// went well, otherwise returns nonzero (very bad, test should fail).
//
// inputs:
//   args : arguments to cleos, with the exception of --wallet-url,
//     which is set to the working directory of the configured cleos
//     provider driver, and --url, which is set by cth_set_cleos_url.
//
// outputs:
//  retval : zero if all OK, nonzero if failed.
// -----------------------------------------------------------------------

function cth_cleos(args) {
    if (args === undefined) {
        console.log("ERROR: cth_cleos: args argument is undefined");
        return 1;
    }

    if (cleosProviderDriver === undefined || cleosProviderWorkingDir === undefined) {
        console.log("ERROR: cth_cleos: cleos provider was not set");
        return 1;
    }

    const cmd = `cleos ${cleosUrlParam} --wallet-url unix://${cleosProviderWorkingDir}/keosd.sock --verbose ${args}`;

    console.log(`cth_cleos: run command: ${cmd}`);

    try {
        const output = child_process.execSync(cmd, { stdio: 'pipe' }).toString();
        console.log(`cth_cleos: command successful, output:\n${output}`);
        return 0;
    } catch (error) {
        console.log(`ERROR: cth_cleos: command returned a nonzero (error) code: ${error.status}`);
        console.log("cth_cleos: ----- begin error dump -----");
        console.log(error);
        console.log("cth_cleos: ------ end error dump ------");
        if (error.status == 0)
            return -1;
        else 
            return error.status;
    }
}

// -----------------------------------------------------------------------
// cth_cleos_pipe
//
// This is essentially cth_cleos but with support for capturing the
// program result.
// Use the configured cleos provider to call cleos as the first command,
// followed by arguments to cleos, followed by optional piped commands
// that take the result of the first cleos call and post-process it.
// Returns a defined string with the textual output of the command, and
// returns an undefined value on error (very bad, test should fail).
//
// inputs:
//   args : arguments to cleos, with the exception of --wallet-url,
//     which is set to the directory of the configured cleos provider
//     working directory, and --url which is set by cth_set_cleos_url,
//     plus any other piped commands (|) you want to execute.
//
// outputs:
//  output : textual output of command execution if OK, undefined if error.
// -----------------------------------------------------------------------

function cth_cleos_pipe(args) {
    if (args === undefined) {
        console.log("ERROR: cth_cleos_pipe: args argument is undefined");
        return undefined;
    }

    if (cleosProviderDriver === undefined || cleosProviderWorkingDir === undefined) {
        console.log("ERROR: cth_cleos_pipe: cleos provider was not set");
        return undefined;
    }

    const cmd = `cleos ${cleosUrlParam} --wallet-url unix://${cleosProviderWorkingDir}/keosd.sock --verbose ${args}`;

    console.log(`cth_cleos_pipe: run command: ${cmd}`);

    try {
        const output = child_process.execSync(cmd, { stdio: 'pipe' }).toString();
        console.log(`cth_cleos_pipe: command successful, output:\n${output}`);
        return output.trim(); // Trimming output should be benign
    } catch (error) {
        console.log(`ERROR: cth_cleos_pipe: command returned a nonzero (error) code: ${error.status}`);
        console.log("cth_cleos_pipe: ----- begin error dump -----");
        console.log(error);
        console.log("cth_cleos_pipe: ------ end error dump ------");
        return undefined;
    }
}

// -----------------------------------------------------------------------
// cth_assert
//
// Check if an expression evaluates to true. Returns 0 if it is true,
// or 1 if it is false.
// Expression must be a valid Perl expression and should generally not
// reference any variables.
// To use expr + orig effectively, you do something like this:
//   const a = 5;
//   const b = 10;
//   const orig = 'a == b';
//   const expr = orig;
//   const ret = cth_assert("We are checking.", expr, orig);
//
// inputs:
//   desc : assertion description
//   expr : expression to evaluate (with variable substitution applied)
//   orig : (OPTIONAL) original expression (before var. substitution)
//
// output:
//   retval : 0 if assert succeeds, 1 if assert fails
// -----------------------------------------------------------------------

function cth_assert(desc, expr, orig) {
    if (desc === undefined) {
        console.log("ERROR: cth_assert: desc argument is undefined");
        return 1;
    }
    if (expr === undefined) {
        console.log("ERROR: cth_cleos: expr argument is undefined");
        return 1;
    }
    expr = expr.trim();
    try {
        const result = eval(expr);
        if (result) {
            console.log(`cth_assert: '${desc}': '${expr}' is true ${orig ? ` ('${orig}')` : ''}.`);
            return 0;
        } else {
            console.log(`cth_assert: '${desc}': '${expr}' is false ${orig ? ` ('${orig}')` : ''}.`);
            return 1;
        }
    } catch (error) {
        console.log(`ERROR: cth_assert: expression evaluation has thrown a ${error.constructor.name}: '${error.message}'`);
        console.log(`  expr: ${expr}`);
        console.log(`  desc: ${desc}`);
        if (orig !== undefined)
            console.log(`  orig:  '${expr}'`);
        return 1;
    }
}

// -----------------------------------------------------------------------
// cth_standard_args_parser
//
// A standard command-line argument parser for testcases to use, which
// resolves the arguments that are fed by the cth harness into them
// (or that a manual caller to the test can emulate).
// This method actually throws an error if there is an error because it should not
// be invoked after e.g. drivers are initialized. So there's no cleanup
// to do if this fails.
//
// inputs:
//    switchesStr : space-separated string with a list of switches that
//      the calling test understands.
//    optionsStr : space-separated string with a list of options that
//      the calling test understands.
//
// outputs:
//    switchesRef : JavaScript object with switch key-value pairs where the key is
//      the switch name (key name) and the value is the switch value.
//    optionsRef : JavaScript object with option key-value pairs where the key is
//      the option name (key name) and the value is the option value.
//
// This is called by the test script, which receives the command-line
//    arguments. The arguments are taken directly from the process.argv global.
//
// If the test (caller) has received any switch not listed here, this
//   sub fails, taking the test with it. That means the test is not
//   engineered towards the environment of the test run.
//
// If the test receives any options not listed here, the argument parser
//   will throw an error, but the test will continue. The option will
//   just be ignored.
// -----------------------------------------------------------------------

function cth_standard_args_parser(switchesStr, optionsStr) {
    if (switchesStr === undefined) {
        throw new Error("ERROR: cth_standard_args_parser: switches argument is undefined");
    }
    if (optionsStr === undefined) {
        throw new Error("ERROR: cth_standard_args_parser: options argument is undefined");
    }

    // Split the strings at space characters to create arrays
    const switches = switchesStr.split(/\s+/);
    const options = optionsStr.split(/\s+/);

    const switchesRef = {};
    const optionsRef = {};

    const args = process.argv.slice(2);

    while (args.length > 0) {
        const arg = args.shift();
        if (arg === '-o' || arg === '--option') {
            // Handle -o option=value or --option option=value format
            const nextArg = args.shift();
            if (nextArg && !nextArg.match(/^-/)) {
                if (nextArg.match(/^(\w+)=(.*)/)) {
                    const optName = RegExp.$1;
                    const value = RegExp.$2;
                    optionsRef[optName] = value;
                } else {
                    throw new Error(`ERROR: cth_standard_args_parser: Invalid option: ${nextArg}`);
                }
            } else {
                throw new Error("ERROR: cth_standard_args_parser: Found empty option spec");
            }
        } else if (arg.match(/^--(\w+)=(.*)/)) {
            // Handle --switchname=value format
            const switchName = RegExp.$1;
            const value = RegExp.$2;
            switchesRef[switchName] = value;
        } else if (arg.match(/^--(\w+)/)) {
            // Handle --switchname value format
            const switchName = RegExp.$1;
            const value = args.shift();
            if (value && !value.match(/^-/)) {
                switchesRef[switchName] = value;
            } else {
                throw new Error(`ERROR: cth_standard_args_parser: Missing value for switch ${arg}`);
            }
        } else {
            throw new Error(`ERROR: cth_standard_args_parser: Invalid argument: ${arg}`);
        }
    }

    // Check that all given switches are inside the given array of switches
    for (const switchName in switchesRef) {
        if (!switches.includes(switchName)) {
            throw new Error(`ERROR: cth_standard_args_parser: Unexpected switch: ${switchName}`);
        }
    }

    // Print a warning for any option in the command line not in the given array
    for (const optionName in optionsRef) {
        if (!options.includes(optionName)) {
            console.log(`WARNING: cth_standard_args_parser: Unexpected option '${optionName}' received.`);
        }
    }

    return [switchesRef, optionsRef];
}

// -----------------------------------------------------------------------
// cth_call_driver
//
// Calls the specified program-with-arguments of the specified driver.
// This assumes the cth directory structure is being followed, of course.
//
// inputs:
//    driver : driver name to call (driver directory name)
//    command : command (script/program) to call in the driver
//      directory, plus any parameters.
//
// output (returns a two-element array):
//    output : text output (stdout and stderr) from the command
//    retval : raw integer return code from the system call. If this
//      is not zero, the call has failed, and the test should fail. This
//      sub does not kill the test because it gives a chance for e.g.
//      cleanups to be performed.
// -----------------------------------------------------------------------

function cth_call_driver(driver, command) {
    if (driver === undefined) {
        console.log("ERROR: cth_call_driver: driver argument is undefined");
        return ["ERROR", 100000];
    }
    if (command === undefined) {
        console.log("ERROR: cth_call_driver: command argument is undefined");
        return ["ERROR", 100001];
    }

    const commandPath = path.join(cth_get_root_dir(), 'drivers', driver, command);

    console.log(`cth_call_driver: run command: ${commandPath}`);

    try {
        const output = child_process.execSync(commandPath, { stdio: 'pipe' }).toString();
        console.log(`cth_call_driver: command successful, output:\n${output}`);
        return [output, 0];
    } catch (error) {
        console.log(`ERROR: cth_call_driver: command returned a nonzero (error) code: ${error.status}`);
        console.log("cth_call_driver: ----- begin error dump -----");
        console.log(error);
        console.log("cth_call_driver: ------ end error dump ------");
        if (error.status == 0) {
            return [error, -1];
        } else {
            return [error, error.status];
        }
    }
}

// -----------------------------------------------------------------------
// cth_generate_account_names
//
// Generates a sequence of EOSIO names from a starting pattern and count.
// Example: ('aaag', 4) will return ref to a 'aaag aaah aaai aaaj' array.
//
// inputs:
//    prefix : starting pattern (included in return value)
//    pattern : number of patterns to generate by incrementing the starting
//      pattern <count> times ("digits" incremented are a-z).
//
// output:
//    patterns : JavaScript array of generated patterns.
// -----------------------------------------------------------------------

function cth_generate_account_names(prefix, pattern, count) {
    const patterns = [];

    // Convert pattern to array of characters
    const chars = pattern.split('');

    // Loop for the specified count
    for (let i = 0; i < count; i++) {
        // Construct the new pattern
        const newPattern = prefix + chars.join('');
        patterns.push(newPattern);

        // Increment the pattern for the next iteration
        let idx = chars.length - 1;
        while (idx >= 0) {
            const ord = chars[idx].charCodeAt(0) + 1;
            if (ord > 'z'.charCodeAt(0)) {
                chars[idx] = 'a';
                idx--;
            } else {
                chars[idx] = String.fromCharCode(ord);
                break;
            }
        }
    }

    return patterns;
}

// -----------------------------------------------------------------------
// doh_init
//
// Initialize the library.
// Sets "cleos-driver" as the cleos driver for cthgoodies.
//
// input:
//   $doh_target : suffix for DoH contract names.
//   $default_signer : account to sign transactions with for when it
//      does not matter who's signing it.
//
// outputs:
//   $retval : zero if OK, nonzero if some error (test should fail).
// -----------------------------------------------------------------------

function doh_init(target, signer) {
    doh_target = target;
    if (!doh_target) {
        console.log("ERROR: doh_init: doh_target is undefined");
        return 1;
    }
    default_signer = signer;
    if (!default_signer) {
        console.log("ERROR: doh_init: default_signer is undefined");
        return 1;
    }
    const ret = cth_set_cleos_provider("cleos-driver");
    if (ret) {
        console.log("ERROR: doh_init: cth_set_cleos_provider failed");
        return 1;
    }
    return 0;
}

// -----------------------------------------------------------------------
// doh_hotstart_start
//
// Gets a hotstart instance created.
//
// outputs:
//   $instance_port : greater than zero if we got an instance up, or a
//     negative value on error.
// -----------------------------------------------------------------------

function doh_hotstart_start() {
    if (!doh_target) {
        console.log("ERROR: doh_hotstart_start: doh_target is undefined; must call doh_init() first.");
        return -1;
    }

    // Assemble a label for the new instance
    const instance_uid = process.pid + "_" + require.main.filename;
    console.log("doh_hotstart start: generated instance UID (doh-hotstart --label): " + instance_uid);

    // run doh-hotstart start
    const args = "start --target " + doh_target + " --label '" + instance_uid + "'";
    const [out, ret] = cth_call_driver("doh-hotstart", args);
    if (ret) {
        console.log("ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '" + args + "' failed");
        return -1;
    }

    // Figure out which port was given to this instance_uid
    const findInstanceArgs = "findinstance " + instance_uid;
    const [outInstance, retInstance] = cth_call_driver("doh-hotstart", findInstanceArgs);
    if (retInstance) {
        console.log("ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '" + findInstanceArgs + "' failed");
        return -1;
    }

    // point cth_cleos to the correct nodeos URL (doh-hotstart invariant: web port is P2P port + 10000)
    const instancePort = parseInt(outInstance, 10);
    const instancePortHttp = instancePort + 10000;
    const retUrl = cth_set_cleos_url("http://127.0.0.1:" + instancePortHttp);
    if (retUrl) {
        console.log("ERROR: doh_hotstart_start: cth_set_cleos_url failed.");
        return -1;
    }

    // attempt to read the readonly contract to fill in %doh_constants
    try {
        const jsonConstants = cth_cleos_pipe(`--verbose push action readonly.${doh_target} getconstants '{}' --read --json`);

        if (!jsonConstants) {
            console.log("WARNING: doh_hotstart_start : error trying to fetch constants from readonly.${doh_target} (cleos readonly query error). '%doh_constants' hash will be empty.");
        } else {
            const data = JSON.parse(jsonConstants);

            if (data && data.processed && data.processed.action_traces && data.processed.action_traces.length > 0) {
                const return_value_data = data.processed.action_traces[0].return_value_data;

                if (return_value_data) {
                    for (const constant_key in return_value_data) {
                        if (return_value_data.hasOwnProperty(constant_key)) {
                            Object.assign(doh_constants, return_value_data[constant_key]);
                        }
                    }

                    if (Object.keys(doh_constants).length) {
                        console.log("doh_hotstart_start: successfully loaded and parsed the following DoH constants from readonly contract: " + Object.keys(doh_constants).join(' '));
                    } else {
                        console.log("WARNING: doh_hotstart_start: No constants found in the JSON data. '%doh_constants' hash will be empty.");
                    }
                } else {
                    console.log("WARNING: doh_hotstart_start: No return_value_data found. '%doh_constants' hash will be empty.");
                }
            } else {
                console.log("WARNING: doh_hotstart_start: error trying to fetch constants from readonly.${doh_target} (parse error). '%doh_constants' hash will be empty.");
            }
        }
    } catch (error) {
        console.error("ERROR: doh_hotstart_start: error while obtaining and/or parsing readonly constants: ", error);
    }

    console.log("doh_hotstart_start: successfully started at P2P port " + instancePort + " (HTTP port: " + instancePortHttp + ")");
    return instancePort;
}

// -----------------------------------------------------------------------
// doh_hotstart_stop
//
// Stops a hotstart instance (does not clear it).
//
// input:
//   $instace_port : the instance port to stop.
//
// outputs:
//   $retval : zero on success, nonzero on failure.
// -----------------------------------------------------------------------

function doh_hotstart_stop(instancePort) {
    if (!instancePort) {
        console.log("ERROR: doh_hotstart_stop: instancePort is undefined");
        return -1;
    }

    // run doh-hotstart stop
    const args = "stopinstance --port " + instancePort;
    const [out, ret] = cth_call_driver("doh-hotstart", args);
    if (ret) {
        console.log("ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '" + args + "' failed");
        return -1;
    }

    return 0;
}

// -----------------------------------------------------------------------
// doh_hotstart_clear
//
// Stops and clears (rm -rf) a hotstart instance directory.
//
// input:
//   $instace_port : the instance port to stop and clear.
//
// outputs:
//   $retval : zero on success, nonzero on failure.
// -----------------------------------------------------------------------

function doh_hotstart_clear(instancePort) {
    if (!instancePort) {
        console.log("ERROR: doh_hotstart_clear: instancePort is undefined");
        return -1;
    }

    // run doh-hotstart clear
    const args = "clearinstance --port " + instancePort;
    const [out, ret] = cth_call_driver("doh-hotstart", args);
    if (ret) {
        console.log("ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '" + args + "' failed");
        return -1;
    }

    return 0;
}

// -----------------------------------------------------------------------
// doh_get_tcn_target
//
// Return the tcn target name for a given hgm target name.
//
// inputs:
//   $hgm : target name (hgm/hg1/hg2/...)
//
// output:
//   $tcn : valid corresponding TCN target (tcn/tc1/tc2/...)
//
// This sub will die on any errors.
// -----------------------------------------------------------------------

function doh_get_tcn_target(hgm) {
    if (!hgm) throw new Error("ERROR: doh_get_tcn_target: hgm is undefined");
    if (hgm === 'hgm') {
        return "tcn";
    } else if (/^hg\d$/.test(hgm)) {
        return "tc" + hgm.charAt(hgm.length - 1);
    } else {
        throw new Error("ERROR: Cannot infer tcn target for doh target: " + hgm);
    }
}


// -----------------------------------------------------------------------
// doh_get_constants
//
// Returns a copy of the %doh_constants hash, which is empty by default,
//   but is initialized during the doh_hotstart_start() with all the DoH
//   constants from the DoH readonly contract.
//
// Example:
//   my %doh = doh_get_constants();
//   print "Mining costs " . $doh{GAMEPLAY_ENERGY_COST} . " energy.\n";
// -----------------------------------------------------------------------

function doh_get_constants() {
    return Object.assign({}, doh_constants);
}

// -----------------------------------------------------------------------
// doh_extract_tcn_amount
//
// Extract the TCN amount from a "XXX.YYY TCN" string (with or
//   without quotes or other surrounding noise).
//
// inputs:
//   $amount_str : TCN amount string
//
// output:
//   $amount : TCN amount ("xxx.yyy" real/float number) or -1
//     on any error.
// -----------------------------------------------------------------------

function doh_extract_tcn_amount(amount_str) {
    if (!amount_str) {
        console.log("ERROR: doh_extract_tcn_amount: amount_str argument is undefined");
        return -1;
    }
    const match = amount_str.match(/(\d+\.\d+)\s+TCN/);
    if (match) {
        return parseFloat(match[1]);
    } else {
        return -1;
    }
}

// -----------------------------------------------------------------------
// End of library.
// -----------------------------------------------------------------------

module.exports = {
    cth_get_root_dir,
    cth_skip_test,
    cth_set_cleos_provider,
    cth_set_cleos_url,
    cth_cleos,
    cth_cleos_pipe,
    cth_assert,
    cth_standard_args_parser,
    cth_call_driver,
    cth_generate_account_names,
    doh_init,
    doh_hotstart_start,
    doh_hotstart_stop,
    doh_hotstart_clear,
    doh_get_tcn_target,
    doh_get_constants,
    doh_extract_tcn_amount,
};
