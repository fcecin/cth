// -----------------------------------------------------------------------
// DoHTestReflect.js
//
// This module provides a reflection proxy to DoHTestFixture.js's cleos()
//   function, so that you can do things like this (instead of composing
//   giant string arguments to cleos() calls yourself):
//
//     const proxy = getProxyForContract(`meta.${doh_target}`);
//     proxy._auth("inviteesname");
//     proxy.acceptinvite("invitersname", "inviteesname");
//     proxy._auth(SELF); // CONTRACT, SELF, '', (), (undefined):  all work the same
//     proxy.clear();
//
// Which is equivalent to the following DoHTestFixture.js cleos() calls:
//
//     cleos("push action meta.${doh_target} acceptinvite '{"inviter":"invitersname","invitee":"inviteesname"}' --force-unique -p inviteesname");
//     cleos("push action meta.${doh_target} clear '{}' --force-unique -p meta.${doh_target}");
//
// Getting tables is accomplished via a _<tablename> function:
//
//     console.log(proxy.accounts( { "scope": "dohplayer1"} ));
//     console.log(proxy.players( { "scope": CONTRACT } )); // CONTRACT, SELF, '', null: all work the same
//
// -----------------------------------------------------------------------

const fx = require('DoHTestFixture');

// -----------------------------------------------------------------------
// Exported constants
// -----------------------------------------------------------------------

const CONTRACT = 'CONTRACT';
const SELF     = 'SELF';

// -----------------------------------------------------------------------
// getProxyForContract
//
// Return a complete proxy object for the given contract.
// -----------------------------------------------------------------------

function getProxyForContract(contractAccountName) {
    let abi;
    try {
        const abiString = cleos(`get abi ${contractAccountName}`);
        abi = JSON.parse(abiString);
    } catch (error) {
        fx.fixtureCrashed(`DoHTestReflect: getProxyForContract(): Error fetching and parsing ABI for ${contractAccountName}: ${error}`);
    }
    if (!abi || !abi.actions || !Array.isArray(abi.actions) || !abi.structs || !Array.isArray(abi.structs)) {
        fx.fixtureCrashed(`DoHTestReflect: getProxyForContract(${contractAccountName}): ABI format is invalid.`);
    }
    const library = {};
    abi.actions.forEach((action) => {
        const actionName = action.name;
        const structName = action.type;
        if (!structName) {
            fx.fixtureCrashed(`DoHTestReflect: getProxyForContract(${contractAccountName}): No struct type defined for action "${actionName}".`);
        }
        const struct = abi.structs.find((s) => s.name === structName);
        if (!struct) {
            fx.fixtureCrashed(`DoHTestReflect: getProxyForContract(${contractAccountName}): Struct "${structName}" not found for action "${actionName}".`);
        }
        library[actionName] = function (...params) {
            if (params.length !== struct.fields.length) {
                const paramList = params.map(element => JSON.stringify(element)).join(',');
                fx.fixtureCrashed(`DoHTestReflect: [PROXY ${contractAccountName}::${actionName}(${paramList})]: expected ${struct.fields.length} parameter(s), got ${params.length}.`);
                return;
            }
            // For each parameter, if it is one of the structs defined in the ABI, check if it's a JSON object
            //   whose field names match the ABI struct's fields. This should catch most errors.
            for (let i = 0; i < params.length; i++) {
                const paramNum = i + 1;
                const paramName = struct.fields[i].name;
                const paramType = struct.fields[i].type;
                if (abi.structs.some((struct) => struct.name === paramType)) {
                    if (typeof params[i] !== 'object') {
                        const paramList = params.map(element => JSON.stringify(element)).join(',');
                        fx.fixtureCrashed(`DoHTestReflect: [PROXY ${contractAccountName}::${actionName}(${paramList})]: Parameter #${paramNum} expected JSON object matching ABI type '${paramType}', instead got '${params[i]}'.`);
                    }
                    const matchingStruct = abi.structs.find((s) => s.name === paramType);
                    if (matchingStruct) {
                        matchingStruct.fields.forEach((field) => {
                            // Check if the field exists in the parameter object
                            if (!(field.name in params[i])) {
                                const paramList = params.map(element => JSON.stringify(element)).join(',');
                                fx.fixtureCrashed(`DoHTestReflect: [PROXY ${contractAccountName}::${actionName}(${paramList})]: Parameter #${paramNum} JSON object is missing field '${field.name}' to match ABI type '${paramType}'.`);
                            }
                            // Here we could actually check the type of each field, and if it's also an ABI struct, we could call a
                            //   recursive function from here to do further type checking. Eventually could end up checking on all
                            //   ABI types, including arrays of primitives, of structs, etc.
                            // This is probably overkill; if there's an error in the way the test writer calls the proxy, it will blow
                            //   up in the cleos call, and it's not too much work to map that to the bug location in the proxy call.
                        });
                    }
                }
            }
            const paramObj = {};
            for (let i = 0; i < params.length; i++) {
                const paramName = struct.fields[i].name;
                paramObj[paramName] = params[i];
            }
            const paramString = JSON.stringify(paramObj);
            return fx.cleos(`push action ${contractAccountName} ${actionName} '${paramString}' --force-unique -p ${library.__signer}`);
        };
    });
    library.__tableIndexInfo = new Map();
    library.__tableScope = new Map();
    abi.tables.forEach((table) => {
        const tableName = table.name;
        library.__tableIndexInfo.set(tableName, []);
        // config object for each index 1-9: [index type, encode type]
        for (let i = 1; i < 9; i++) { library.__tableIndexInfo.get(tableName).push([]); }
        // scope is saved, can be set via "scope":"" option; default is the account name
        library.__tableScope.set(tableName, contractAccountName);
        // Generate table query methods for up to 9 indices
        for (let i = 1; i < 9; i++) {
            let si = '';

            // The table function name can be the plain table name, since you cannot have
            //   actions declared with the same name as the table -- that doesn't work.
            //   So for the primary index/key, the function name is the plain table name.
            // However, when adding indices, we need an e.g. "_" to differentiate, because
            //   a "players2" action could exist together with a "players" table. When
            //   using indices > 1 (the primary index/key), it becomes e.g. "players_2".
            if (i > 1) { si = `_${i}` };
            library[`${tableName}${si}`] = function (...params) {

                let configWasSet = false;
                let q = '';
                if (i > 1) { q += ` --index ${i}`; }
                // apply all params to construct an options[0] object
                let posnum = 1;
                let options = [];  // all option objects found
                options.push({});  // reserve [0] for positional options
                for (const param of params) {
                    if (typeof param === 'object' && param !== null) {
                        options.push(param);
                    } else {
                        if (posnum == 1) {
                            options[0]["lower"] = param;
                            options[0]["upper"] = param;
                        } else if (posnum == 2) {
                            options[0]["upper"] = param;
                        } else if (posnum == 3) {
                            options[0]["limit"] = param;
                        } else if (posnum == 4) {
                            options[0]["scope"] = param;
                        } else if (posnum == 5) {
                            options[0]["binary"] = param;
                        } else if (posnum == 6) {
                            options[0]["reverse"] = param;
                        } else if (posnum == 7) {
                            options[0]["show-payer"] = param;
                        } else if (posnum == 8) {
                            options[0]["time-limit"] = param;
                        }
                        posnum += 1;
                    }
                }
                for (let oi = 1; oi < options.length; oi++) {
                    for (const key of Object.keys(options[oi])) {
                        options[0][key] = options[oi][key];
                    }
                }
                // apply resulting options[0] to $q
                for (const key of Object.keys(options[0])) {
                    let value = options[0][key];
                    if (key == "lower") {
                        q += ` --lower ${value}`;
                    } else if (key == "upper") {
                        q += ` --upper ${value}`;
                    } else if (key == "limit") {
                        q += ` --limit ${value}`;
                    } else if (key == "scope") {
                        // special values that conveniently reset to the contract account name
                        //   without having to name it explicitly e.g. {"scope":`meta.${doh_target}`}
                        if (value === undefined || value === 'CONTRACT' || value === 'SELF' || value === '') {
                            library.__tableScope.set(tableName, contractAccountName);
                        } else {
                            library.__tableScope.set(tableName, value);
                        }
                    } else if (key == "binary") {
                        q += " --binary";
                    } else if (key == "reverse") {
                        q += " --reverse";
                    } else if (key == "show-payer") {
                        q += " --show-payer";
                    } else if (key == "time-limit") {
                        q += ` --time-limit ${value}`;
                    } else if (key == "key-type") {
                        // save the key-type for (current and) future use
                        library.__tableIndexInfo.get(tableName)[i][0] = value;
                        configWasSet = true;
                    } else if (key == "encode-type") {
                        // save the encode-type for (current and) future use
                        library.__tableIndexInfo.get(tableName)[i][1] = value;
                        configWasSet = true;
                    }
                }
                // apply tableConfig
                let tableConfig = library.__tableIndexInfo.get(tableName)[i];
                if (tableConfig !== undefined) {
                    if (tableConfig.length > 0 && tableConfig[0] !== undefined && tableConfig[0] !== '') {
                        q += ` --key-type ${tableConfig[0]}`;
                    }
                    if (tableConfig.length > 1 && tableConfig[1] !== undefined && tableConfig[1] !== '') {
                        q += ` --encode-type ${tableConfig[1]}`;
                    }
                }
                // apply scope
                let scope = library.__tableScope.get(tableName);
                // if no lower but set config, will NOT make a query; we are just configuring the proxy
                if (configWasSet && posnum == 1) {
                    return undefined;
                } else {
                    // caller deals with extracting rows: , more/next key etc.
                    return fx.cleos(`get table ${contractAccountName} ${scope} ${tableName} ${q}`);
                }
            };
        }
    });
    // Internal function names must avoid name collision with ABI names ("a-z1-5.", 12 chars)
    library._auth = function (value) {
        // special values that conveniently set the signer to the contract account name.
        // if you need anything other than active permission send it in explicitly.
        if (value === undefined || value === 'CONTRACT' || value === 'SELF' || value === '') {
            library.__signer = contractAccountName;
        } else {
            library.__signer = value;
        }
    };
    library._auth();
    return library;
}

// -----------------------------------------------------------------------
// End of library.
// -----------------------------------------------------------------------

module.exports = {
    getProxyForContract,
    CONTRACT,
    SELF,
};
