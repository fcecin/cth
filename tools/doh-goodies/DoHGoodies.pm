# -----------------------------------------------------------------------
# DoHGoodies
#
# Perl utility functions for writing DoH tests.
#
# This library can be imported easily by Perl testcases like this, since
# the module include path should be taken care of by cth:
#
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
    doh_get_constants
    doh_extract_tcn_amount
);

my %doh_constants = (); # doh_hotstart_start() fills it with all DoH readonly constants

# -----------------------------------------------------------------------
# PERL5LIB env var should contain all useful paths under cth/tools/
# -----------------------------------------------------------------------

use CthGoodies;
use JSON::Tiny;

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
    my $ret = cth_set_cleos_provider("cleos-driver");
    if ($ret) {
        print "ERROR: doh_init: cth_set_cleos_provider failed\n";
        return 1;
    }
    return 0;
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
    # This doubles as requiring doh_init() to be called first (here we need the cleos provider to be set)
    if (! defined $doh_target) {
        print "ERROR: doh_hotstart_start: doh_target is undefined; must call doh_init() first.\n";
        return -1;
    }

    my ($ret, $out, $args);

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

    # attempt to read the readonly contract to fill in %doh_constants
    my $json_constants = cth_cleos_pipe(qq|--verbose push action readonly.${doh_target} getconstants '{}' --read --json|);   # --force-unique -p $default_signer|);
    if (!defined $json_constants) {
        print "WARNING: doh_hotstart_start : error trying to fetch constants from readonly.${doh_target} (cleos readonly query error). '\%doh_constants' hash will be empty.\n";
    } else {
        my $data = JSON::Tiny::decode_json($json_constants);
        if (ref($data) eq 'HASH' && defined $data->{processed}{action_traces}[0]{return_value_data}) {
            my $return_value_data = $data->{processed}{action_traces}[0]{return_value_data};
            for my $constant_key (keys %$return_value_data) {
                %doh_constants = (%doh_constants, %{$return_value_data->{$constant_key}});
            }
            if (%doh_constants) {
                print "doh_hotstart_start: successfully loaded and parsed the following DoH constants from readonly contract: ";
                my @constant_names = sort keys %doh_constants;
                foreach my $key (@constant_names) { print "$key " };
                print "\n";
            } else {
                print "WARNING: doh_hotstart_start: No constants found in the JSON data. '\%doh_constants' hash will be empty.\n";
            }
        } else {
            print "WARNING: doh_hotstart_start: error trying to fetch constants from readonly.${doh_target} (parse error). '\%doh_constants' hash will be empty.\n";
        }
    }

    print "doh_hotstart_start: successfully started at P2P port $instance_port (HTTP port: $instance_port_http)\n";
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
    my $args = "stopinstance --port $instance_port";
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
    my $args = "clearinstance --port $instance_port";
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
# doh_get_constants
#
# Returns a copy of the %doh_constants hash, which is empty by default,
#   but is initialized during the doh_hotstart_start() with all the DoH
#   constants from the DoH readonly contract.
#
# Example:
#   my %doh = doh_get_constants();
#   print "Mining costs " . $doh{GAMEPLAY_ENERGY_COST} . " energy.\n";
# -----------------------------------------------------------------------

sub doh_get_constants {
    return %doh_constants;
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
# doh_get_suffix_from_target
#
# Convert e.g. 'prod' to 'hgm'.
#
# inputs:
#   $target : e.g. "staging"
#
# output:
#   $suffix : e.g. "hg1"; crashes if input is garbage.
# -----------------------------------------------------------------------

sub doh_get_suffix_from_target {
    my $target = shift;
    die("ERROR: doh_get_suffix_from_target(): undefined target") unless defined $target;
    my $suffix;
    if ($target eq "prod")       { $suffix = "hgm"; }
    elsif ($target eq "staging") { $suffix = "hg1"; }
    elsif ($target eq "dev")     { $suffix = "hg2"; }
    elsif ($target eq "test")    { $suffix = "hg3"; }
    elsif ($target eq "debug")   { $suffix = "hg4"; }
    else {
        die("ERROR: doh_get_suffix_from_target(): unknown target '$target'\n");
    }
    return $suffix;
}

# -----------------------------------------------------------------------
# doh_get_target_from_suffix
#
# Convert e.g. 'hgm' to 'prod'.
#
# inputs:
#   $suffix : e.g. "hg3"
#
# output:
#   $target : e.g. "test"; crashes if input is garbage.
# -----------------------------------------------------------------------

sub doh_get_target_from_suffix {
    my $suffix = shift;
    die("ERROR: doh_get_target_from_suffix(): undefined suffix") unless defined $suffix;
    my $target;
    if ($suffix eq "hgm")    { $target = "prod"; }
    elsif ($suffix eq "hg1") { $target = "staging"; }
    elsif ($suffix eq "hg2") { $target = "dev"; }
    elsif ($suffix eq "hg3") { $target = "test"; }
    elsif ($suffix eq "hg4") { $target = "debug"; }
    else {
        die("ERROR: doh_get_target_from_suffix(): unknown suffix '$suffix'\n");
    }
    return $target;
}

# -----------------------------------------------------------------------
# End of library.
# -----------------------------------------------------------------------

1;
