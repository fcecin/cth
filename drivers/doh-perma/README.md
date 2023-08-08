
doh-perma is a simple, reference DoH test driver that wipes out DoH contract state on an existing blockchain and DoH contract deployment. It needs no installation.

This driver has no clear action, because e.g. clearing a remote URL contract may take too long (if that's what's it is being used for -- a perma deployment on a remote testnet) and you don't want that when doing 'cth -c dummy' just for tests that trigger local drivers anyway. You could try to distinguish a localhost use of the driver from a remote use, but for now that's not necessary. Tests will clean up the perma deployment themselves.

IMPORTANT: This driver must be 'configure'd first before it will work. It will refuse to 'start' if it is not 'configure'd first.

To configure the driver, call:
  configure --target=(suffix)

Replace (suffix) with hgm, hg1, hg2, or another valid DoH contracts target.

If you are going to use a cleos URL that's not the default (https://127.0.0.1:8888), you must also configure that:

  configure --cleos_url=(nodeos HTTP URL)

Just like e.g. doh-coldstart, this reference driver does not support parallel execution.
