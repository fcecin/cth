# -----------------------------------------------------------------------
# DoHGoodies
#
# Perl utility functions for writing DoH tests.
#
# This library can be imported easily by Perl testcases like this
# (if they are following the cth directory hierarchy):
#
#   use lib '../../tools/doh-goodies';
#   use DoHGoodies;
# -----------------------------------------------------------------------

package DoHGoodies;

use strict;
use warnings;

use Exporter qw(import);
our @EXPORT = qw(
    doh_init
    doh_hotstart_start
    doh_hotstart_stop
    doh_hotstart_clear
    doh_get_tcn_target
    doh_get_char_energy
    doh_extract_tcn_amount
);

# -----------------------------------------------------------------------
# Uses CthGoodies
# -----------------------------------------------------------------------

use lib '../doh-goodies';
use CthGoodies;

# -----------------------------------------------------------------------
# Global state
# -----------------------------------------------------------------------

my $doh_target;      # main contract suffix being used (hgm, hg1, hg2, ...)

my $default_signer;  # sign txs with anything; for actions that don't require_auth

# -----------------------------------------------------------------------
# doh_init
#
# Initialize the library.
# Sets "cleos-driver" as the cleos driver for cthgoodies.
#
# input:
#   $doh_target : suffix for DoH contract names.
#   $default_signer : account to sign transactions with for when it
#      does not matter who's signing it.
#
# outputs:
#   $retval : zero if OK, nonzero if some error (very bad, test should
#     fail).
# -----------------------------------------------------------------------

sub doh_init {
    $doh_target = shift;
    if (! defined $doh_target) {
        print "ERROR: doh_init: doh_target is undefined\n";
        return 1;
    }
    $default_signer = shift;
    if (! defined $default_signer) {
        print "ERROR: doh_init: default_signer is undefined\n";
        return 1;
    }
    return cth_set_cleos_provider("cleos-driver");
}

# -----------------------------------------------------------------------
# doh_hotstart_start
#
# Gets a hotstart instance created.
#
# outputs:
#   $instance_port : greater than zero if we got an instance up, or a
#     negative value on error.
# -----------------------------------------------------------------------

sub doh_hotstart_start {
    if (! defined $doh_target) {
        print "ERROR: doh_hotstart_start: doh_target is undefined; must call doh_init() first.\n";
        return -1;
    }

    my ($ret, $out, $args);

    $ret = cth_set_cleos_provider("cleos-driver");
    if ($ret) {
        print "ERROR: doh_hotstart_start: cth_set_cleos_provider failed\n";
        return -1;
    }

    # Assemble a label for the new instance
    use FindBin qw($RealBin);
    use File::Basename;
    my $instance_uid = $$ . "_" . fileparse($RealBin);
    print "doh_hotstart start: generated instance UID (doh-hotstart --label): $instance_uid\n";

    # run doh-hotstart start
    $args = "start --target " . $doh_target . " --label '$instance_uid'";
    ($out, $ret) = cth_call_driver("doh-hotstart", $args);
    if ($ret) {
        print "ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '$args' failed\n";
        return -1;
    }

    # Figure out which port was given to this instance_uid
    $args = "findinstance $instance_uid";
    ($out, $ret) = cth_call_driver("doh-hotstart", $args);
    if ($ret) {
        print "ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '$args' failed\n";
        return -1;
    }

    # point cth_cleos to the correct nodeos URL (doh-hotstart invariant: web port is P2P port + 10000)
    my $instance_port = $out;
    my $instance_port_http = $instance_port + 10000;
    $ret = cth_set_cleos_url("http://127.0.0.1:$instance_port_http");
    if ($ret) {
        print "ERROR: doh_hotstart_start: cth_set_cleos_url failed.\n";
        return -1;
    }

    print "doh_hotstart start: successfully started at P2P port $instance_port (HTTP port: $instance_port_http)\n";
    return $instance_port;
}

# -----------------------------------------------------------------------
# doh_hotstart_stop
#
# Stops a hotstart instance (does not clear it).
#
# input:
#   $instace_port : the instance port to stop.
#
# outputs:
#   $retval : zero on success, nonzero on failure.
# -----------------------------------------------------------------------

sub doh_hotstart_stop {
    my $instance_port = shift;
    if (! defined $instance_port) {
        print "ERROR: doh_hotstart_stop: instance_port is undefined\n";
        return -1;
    }

    # run doh-hotstart stop
    my $args = "stop --port $instance_port";
    my $ret = cth_call_driver("doh-hotstart", $args);
    if ($ret) {
        print "ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '$args' failed\n";
        return -1;
    }

    return 0;
}

# -----------------------------------------------------------------------
# doh_hotstart_clear
#
# Stops and clears (rm -rf) a hotstart instance directory.
#
# input:
#   $instace_port : the instance port to stop and clear.
#
# outputs:
#   $retval : zero on success, nonzero on failure.
# -----------------------------------------------------------------------

sub doh_hotstart_clear {
    my $instance_port = shift;
    if (! defined $instance_port) {
        print "ERROR: doh_hotstart_clear: instance_port is undefined\n";
        return -1;
    }

    # run doh-hotstart clear
    my $args = "clear --port $instance_port";
    my $ret = cth_call_driver("doh-hotstart", $args);
    if ($ret) {
        print "ERROR: doh_hotstart_start: cth_call_driver doh-hotstart '$args' failed\n";
        return -1;
    }

    return 0;
}

# -----------------------------------------------------------------------
# doh_get_tcn_target
#
# Return the tcn target name for a given hgm target name.
#
# inputs:
#   $hgm : target name (hgm/hg1/hg2/...)
#
# output:
#   $tcn : valid corresponding TCN target (tcn/tc1/tc2/...)
#
# This sub will die on any errors.
# -----------------------------------------------------------------------

sub doh_get_tcn_target {
    my $hgm = shift;
    if (! defined $hgm) { die "ERROR: doh_get_tcn_target: hgm is undefined\n"; }
    if ($hgm eq 'hgm') {
        return "tcn";
    } elsif ($hgm =~ /^hg\d$/) {
        return "tc" . substr($hgm, -1);
    } else {
        die "ERROR: Cannot infer tcn target for doh target: $hgm\n";
    }
}

# -----------------------------------------------------------------------
# doh_get_char_energy
#
# Returns the current energy level for a given character id.
#
# inputs:
#   $charid : character ID
#
# output:
#   $energy : energy amount ("xxx.yyy" real/float number) or -1
#     on any error.
# -----------------------------------------------------------------------

sub doh_get_char_energy {
    my ($charid) = @_;
    if (! defined $charid) {
        print "ERROR: doh_get_char_energy: charid argument is undefined\n";
        return -1;
    }

    if (! defined $doh_target) {
        print "ERROR: doh_get_char_energy: doh_target is undefined\n";
        return -1;
    }

    # TODO/REVIEW:
    # --verbose should force the blockchain stack to return ALL of the print()s made by the action's contract code.
    # If the blockchain we are using is configured to discard print()s, this will not work, and we will have to implement
    #    this action in some other way.
    # The good news is that when that DOES happen (i.e. blockchain configured to kill print()s) the test will cleanly fail
    #    and you will quickly know that that's what's going on.
    # At least for immediate-term development (ie. with doh-coldstart), this will do. And perhaps it will work for every
    #    realistic test setup as well (i.e. why would you spin up a non-print() blockchain for running tests?).
    # This also cleanly breaks if the existing prints are messed with.
    #
    # ANOTHER way to do it would be to create a function that has a side-effect. That is, it does not JUST get the char
    #  energy. Instead, it performs an action, which calls check_action, which will THEN update the energy field of
    #  the character. In deterministic clock mode (what we use for all, or at least most, testing) then it is just a
    #  matter of reading the "energy" field of the character. This would be best with a dummy game action that spends
    #  zero energy, i.e. you just apply the energy regeneration to the energy field, set last action time to now, and
    #  that's it. But this requires support from the hegemon contract.
    #
    my $energy_str = cth_cleos_pipe(qq|--verbose push action hegemon.${doh_target} calcenergy '[$charid]' --force-unique -p $default_signer|);

    if (!defined $energy_str) {
        print "ERROR: doh_get_char_energy: energy_str undefined.\n";
        return -1;
    }

    if ($energy_str =~ /resulting_energy\s+([\d\.e+-]+)/) {
        return $1;
    } else {
        print "ERROR: doh_get_char_energy: cannot calculate the character energy from the output of calcenergy($charid): $energy_str\n";
        return -1;
    }
}

# -----------------------------------------------------------------------
# doh_extract_tcn_amount
#
# Extract the TCN amount from a "XXX.YYY TCN" string (with or
#   without quotes or other surrounding noise).
#
# inputs:
#   $amount_str : TCN amount string
#
# output:
#   $amount : TCN amount ("xxx.yyy" real/float number) or -1
#     on any error.
# -----------------------------------------------------------------------

sub doh_extract_tcn_amount {
    my ($amount_str) = @_;
    if (! defined $amount_str) {
        print "ERROR: doh_extract_tcn_amount: amount_str argument is undefined\n";
        return -1;
    }
    if ($amount_str =~ /(\d+\.\d+)\s+TCN/) {
        return $1;
    } else {
        return -1;
    }
}

# -----------------------------------------------------------------------
# End of library.
# -----------------------------------------------------------------------

1;
