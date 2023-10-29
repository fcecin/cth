// -----------------------------------------------------------------------
// DoHTestLib.js
//
// This module just pulls all the other modules in the JS test library
//   and makes them available to a test script.
// -----------------------------------------------------------------------

Object.assign(global, require('DoHTestDriver'));
Object.assign(global, require('DoHTestFixture'));
Object.assign(global, require('DoHTest'));

// Could be assigned to a "reflect" global var, but nah
// Let's stuff everything in the global object
Object.assign(global, require('DoHTestReflect'));
