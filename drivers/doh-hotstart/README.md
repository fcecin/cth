`doh-hotstart` is a driver that `start`s nodeos from a chainbase that already has the system contracts deployed and all DoH accounts and contracts deployed. It also supports parallel test execution by starting and stopping nodeos using specific local ports.

`start` will start one new instance under a new `/local/doh-hotstart/<p2p-port-number>` and return that p2p port value to the caller. It takes the desired DoH target (e.g. 'hg3') as a command-line argument.

`stopinstance` takes as argument the p2p port number of the instance to stop (`--port <num>`). It does not erase the data directory.

`clearinstance` takes as argument the p2p port number of the instance to clear (`--port <num>`). This will call `stopinstance` to ensure the instance is stopped, and then clear its data directory.

`stop` will stop all instances.

`clear` will clear all instances.

`nuke` will forcibly destroy ALL `doh-hotstart` instances in the system and erase all data in `/local/doh-hotstart/`.

`install` must be called after the installation of the `coldstart` and `doh-coldstart` driver dependencies, and will build the chainbase for a fast start.
