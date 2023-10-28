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
    const library = {};
    if (!abi || !abi.actions || !Array.isArray(abi.actions) || !abi.structs || !Array.isArray(abi.structs)) {
        fx.fixtureCrashed(`DoHTestReflect: getProxyForContract(${contractAccountName}): ABI format is invalid.`);
    }
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
                fx.fixtureCrashed(`DoHTestReflect: [PROXY ${contractAccountName}::${actionName}]: expected ${struct.fields.length} parameter(s), got ${params.length}.`);
                return;
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
