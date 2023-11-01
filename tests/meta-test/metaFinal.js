// --------------------------------------------------------------------------------------------
// Test meta game end
// --------------------------------------------------------------------------------------------

{
    // far more days than necessary to end the metagame have elapsed
    clock.clockaddsec( 86400 * 50 );

    fixtureLog( "Meta update all the way to the end of the metagame:\n" + meta.update(Number.MAX_SAFE_INTEGER) );

    let success = true;
    try {
        meta._("metaplayer11").dostake("metaplayer11", "1.000 TCN", 1);
        success = false;
    } catch (error) {
        if (error.message.includes('meta game has ended')) {
            fixtureLog("Correctly got an error from trying to do something after the meta game has ended");
        } else {
            fixtureWarningLog("Correctly got an error from trying to do something after the meta game has ended, but it's not the expected error message: " + error);
        }
    }
    assert(`${success}`, `successfully failed to do something after the meta game has ended`);
}
