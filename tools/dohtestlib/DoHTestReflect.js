// -----------------------------------------------------------------------
// DoHTestReflect.js -- *** PROTOTYPE / WORK IN PROGRESS ***
//
// This module provides a reflection proxy to DoHTestFixture.js's cleos()
//   function, so that you can do things like this (instead of composing
//   giant string arguments to cleos() calls yourself):
//
//     const proxy = getProxyForContract(`meta.${doh_target}`);
//     proxy._setSigner("inviteesname");
//     proxy.acceptinvite("invitersname", "inviteesname");
//     proxy._setSelfSigner();
//     proxy.clear();
//
// Which is equivalent to the following DoHTestFixture.js cleos() calls:
//
//     cleos("push action meta.${doh_target} acceptinvite '{"inviter":"invitersname","invitee":"inviteesname"}' --force-unique -p inviteesname");
//     cleos("push action meta.${doh_target} clear '{}' --force-unique -p meta.${doh_target}");
//
// TODO:
// - validate all param types vs. the ABI before the call (not ESSENTIAL, but it would produce better diagnostic messages)
// - proxy._getTable();
// -----------------------------------------------------------------------

const fx = require('DoHTestFixture');

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
                            // TODO: actually check the type of each field;
                            //       if it's also an ABI struct, should call a recursive function from here to do further type checking.
                            //       eventually could end up checking on all ABI types, including arrays of primitives, of structs, etc.
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
            return fx.cleos(`push action ${contractAccountName} ${actionName} '${paramString}' --force-unique -p ${library._signer}`);
        };
    });
    library._setSelfSigner = function () { library._signer = contractAccountName; };
    library._setSigner = function (signerName) { library._signer = signerName; };
    library._setSelfSigner();
    return library;
}

// -----------------------------------------------------------------------
// End of library.
// -----------------------------------------------------------------------

module.exports = {
    getProxyForContract,
};
