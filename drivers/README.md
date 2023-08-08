
The `drivers` directory contains scripts that conform to the expected test driver interface. They are responsible for starting and stopping the test environment, i.e. the blockchain node and its state, such as the system contracts, and/or perhaps contracts and data for the project under testing (depends on the driver).

Each test will typically invoke the specific driver that it is written for, to instantiate the blockchain/contract testing environment that it is designed for.

Test drivers can also be developed in separate repositories and downloaded as submodules.

Driver implementation strategies (driver types):

Drivers are named 'start' (as in 'coldstart' or 'hotstart') when they start and stop nodeos instances. 'cold' drivers start up everything from scratch (takes several seconds). 'hot' drivers start from snapshots or chainbases (which are instant) and may or may not include pre-deployed application contracts (or a version of them). A good practice is to use 'cs' as a test name prefix for coldstart, and 'hs' for hotstart.

Drivers are named 'chain' when the blockchain node is already running, but the application contracts aren't deployed (or, if they ARE deployed, they will be undeployed or redeployed, possibly including wiping off all tables of all contracts). Recommended test prefix is 'ch'.

Drivers are named 'perma' when they merely connect to a blockchain that is already running and that already has the game contracts deployed. This strategy clears the contracts being tested before the test logic is run for each test. Recommended test prefix is 'pm'.

Drivers are named 'live' when they are 'perma' but do NOT clear the contracts before running: they just play in a live environment with other actors. Recommended test prefix is 'lv'.





