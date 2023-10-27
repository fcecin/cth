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
// - actual cleos call
// - error handling
// - proxy._getTable();
// -----------------------------------------------------------------------

const dohTestFixture = require('DoHTestFixture');

// -----------------------------------------------------------------------
// getProxyForContract
//
// Return a complete proxy object for the given contract.
// -----------------------------------------------------------------------

function getProxyForContract(contractAccountName) {

    const abiString = cleos(`get abi meta.${doh_target}`); // Replace with your actual command to get ABI

    const abi = JSON.parse(abiString);
    const library = {};

    if (!abi || !abi.actions || !Array.isArray(abi.actions)) {
        console.error("Invalid ABI format.");
        return null;
    }

    abi.actions.forEach((action) => {
        const actionName = action.name;
        const structName = action.type;

        if (!structName) {
            console.error(`No struct type defined for action "${actionName}".`);
            return;
        }

        const struct = abi.structs.find((s) => s.name === structName);

        if (!struct) {
            console.error(`Struct "${structName}" not found for action "${actionName}".`);
            return;
        }

        library[actionName] = function (...params) {
            if (params.length !== struct.fields.length) {
                console.error(`Action "${actionName}" expects ${struct.fields.length} parameter(s).`);
                return;
            }

            const paramObj = {};
            for (let i = 0; i < params.length; i++) {
                const paramName = struct.fields[i].name;
                paramObj[paramName] = params[i];
            }

            const jsonString = JSON.stringify(paramObj);
            const outputString = `CALL FIXTURE.CLEOS() HERE with something like: push action ${actionName} '${jsonString}' -p ${library._signer}`;
            console.log(outputString);
        };
    });

    library._setSelfSigner = function () {
        console.log(`Custom _setSelfSigner: ${contractAccountName}`);
        library._signer = contractAccountName;
    };
    library._setSigner = function (signerName) {
        console.log(`Custom _setSigner: ${signerName}`);
        library._signer = signerName;
    };

    library._setSelfSigner();

    return library;
}


// -----------------------------------------------------------------------
// End of library.
// -----------------------------------------------------------------------

module.exports = {
    getProxyForContract,
};
