# -----------------------------------------------------------------------
# CthGoodies
#
# Perl utility functions for writing cth tests.
#
# This library can be imported easily by Perl testcases like this
# (if they are following the cth directory hierarchy):
#
#   use lib '../../tools/cth-goodies';
#   use CthGoodies;
# -----------------------------------------------------------------------

package CthGoodies;

use strict;
use warnings;

use Exporter qw(import);
our @EXPORT = qw(cth_set_cleos_provider cth_set_cleos_url cth_cleos cth_assert cth_standard_args_parser cth_call_driver);

# -----------------------------------------------------------------------
# Global state
# -----------------------------------------------------------------------

# no cleos provider configured by default
my $cleos_provider_driver;
my $cleos_provider_dir;

# no cleos url argument by default 
my $cleos_url_param = '';

# -----------------------------------------------------------------------
# cth_set_cleos_provider
#
# This configures the library to use the given driver as the cleos
#   provider. We assume the standard cth directory structure, so the
#   driver name directly translates to its expected directory location.
# Calls to cth_cleos will use the keosd.sock and the default.wallet
#   that is in that location.
#
# inputs:
#   $driver : name of the driver that creates and runs the wallet when
#     started, e.g. "cleos-driver".
#
# outputs:
#   $retval : zero if OK, nonzero if some error (very bad, test should
#     fail).
# -----------------------------------------------------------------------

sub cth_set_cleos_provider {
    my ($driver) = @_;
    if (! defined $driver) {
        print "ERROR: cth_set_cleos_provider: driver argument is undefined\n";
        return 1;
    }
    my $driver_dir = "../../drivers/$driver";
    if (! -d $driver_dir) {
        print "ERROR: cth_set_cleos_provider: driver $driver not found at '$driver_dir'\n";
        return 1;
    }
    $cleos_provider_driver = $driver;
    $cleos_provider_dir    = $driver_dir;
    return 0;
}

# -----------------------------------------------------------------------
# cth_set_cleos_url
#
# This sets the --url= parameter value to be passed to cleos in every
#   subsequent call to cth_cleos().
#
# inputs:
#   $url : nodeos URL
#
# This sub will die if the given url is undefined, otherwise it does
#   no validation of the given URL string. 
# -----------------------------------------------------------------------

sub cth_set_cleos_url {
    my ($url) = @_;
    if (! defined $url) {
        print "ERROR: cth_set_cleos_url: url argument is undefined\n";
        return 1;
    }
    if ($url eq '') {
        $cleos_url_param = '';
    } else {
        $cleos_url_param = "--url=${url}";
    }
}

# -----------------------------------------------------------------------
# cth_cleos
#
# Use the configured cleos provider to call cleos. Returns zero if all
#   went well, otherwise returns nonzero (very bad, test should fail).
#
# inputs:
#   $args : arguments to cleos, with the exception of --wallet-url,
#     which is set to the directory of the configured cleos provider.
#
# outouts:
#  $retval : zero if all OK, nonzero if failed.
# -----------------------------------------------------------------------

sub cth_cleos {

    my ($args) = @_;
    if (! defined $args) {
        print "ERROR: cth_cleos: args argument is undefined\n";
        return 1;
    }

    if (!defined $cleos_provider_driver || !defined $cleos_provider_dir) {
        print "ERROR: cth_cleos: cleos provider was not set\n";
        return 1;
    }

    my $cmd = "cleos $cleos_url_param --wallet-url unix://$cleos_provider_dir/keosd.sock --verbose $args";
    
    print "cth_cleos: run command: $cmd\n";

    my $output = `$cmd 2>&1`;
    my $retval = $?;
    if ($retval) {
        print "cth_cleos: command returned a nonzero (error) code: $retval\n";
    } else {
        print "cth_cleos: command successful (returned zero)\n";
    }
    print "cth_cleos: command output: $output\n";

    return $retval;
}

# -----------------------------------------------------------------------
# cth_assert
#
# Check if an expression evaluates to true. Returns 0 if it is true,
#   or 1 if it is false.
# Expression must be a valid Perl expression and should generally not
#   reference any variables.
#
# inputs:
#   $desc : assertion description
#   $expr : expression to evaluate
#
# output:
#   $retval : 0 if assert succeeds, 1 if assert fails
# -----------------------------------------------------------------------

sub cth_assert {
    my ($desc, $expr) = @_;
    if (! defined $desc) {
        print "ERROR: cth_assert: desc argument is undefined\n";
        return 1;
    }
    if (! defined $expr) {
        print "ERROR: cth_cleos: expr argument is undefined\n";
        return 1;
    }
    if ($expr) {
        print "cth_assert: '$desc': '$expr' is true.\n";
        return 0;
    } else {
        print "ERROR: cth_assert: '$desc': '$expr' is false.\n";
        return 1;
    }
}

# -----------------------------------------------------------------------
# cth_standard_args_parser
#
# A standard command-line argument parser for testcases to use, which
#   resolves the arguments that are fed by the cth harness into them
#   (or that a manual caller to the test can emulate).
# This method actually dies if there is an error, because it should not
#   be invoked after e.g. drivers are initialized. So there's no cleanup
#   to do if this dies.
#
# inputs:
#    $switches_str : space-separated string with list of switches that
#      the calling test understands.
#    $options_str : space-separated string with list of options that
#      the calling test understands.
#
# outputs:
#    $switches_ref : Perl HASH ref to a key-value hash where the key is
#      the switch name (key name) and the value is the switch value.
#    $options_ref : Perl HASH ref to a key-value hash where the key is
#      the option name (key name) and the value is the option value.
#
# This is called by the test script, which receives the command-line
#    arguments. The arguments are taken directly from the @ARGV global.
#
# If the test (caller) has received any switch not listed here, this
#   sub fails, taking the test with it. That means the test is not
#   engineered towards the environment of the test run.
#
# If the test receives any options not listed here, the argument parser
#   will print a warning, but the test will continue. The option will
#   just be ignored.
# -----------------------------------------------------------------------

sub cth_standard_args_parser {

    my ($switches_str, $options_str) = @_;
    die "ERROR: cth_standard_args_parser: switches argument is undefined" unless defined $switches_str;
    die "ERROR: cth_standard_args_parser: options argument is undefined" unless defined $options_str;

    # Split the strings at space characters to create arrays
    my @switches = split(/\s+/, $switches_str);
    my @options = split(/\s+/, $options_str);

    my %switches;
    my %options;

    my @args = @ARGV;  # this is a no-op

    while (@args) {
        my $arg = shift @args;
        if ($arg =~ /^-o|--option$/) {
            # Handle -o option=value or --option option=value format
            my $next_arg = shift @args;
            if ($next_arg && $next_arg !~ /^-/) {
                if ($next_arg =~ /^(\w+)=(.*)/) {
                    my $optname = $1;
                    my $value = $2;
                    $options{$optname} = $value;
                } else {
                    die "ERROR: cth_standard_args_parser: Invalid option: $next_arg\n";
                }
            } else {
                die "ERROR: cth_standard_args_parser: Found empty option spec\n";
            }
        } elsif ($arg =~ /^--(\w+)=(.*)/) {
            # Handle --switchname=value format
            my $switchname = $1;
            my $value = $2;
            $switches{$switchname} = $value;
        } elsif ($arg =~ /^--(\w+)/) {
            # Handle --switchname value format
            my $switchname = $1;
            my $value = shift @args;
            if ($value && $value !~ /^-/) {
                $switches{$switchname} = $value;
            } else {
                die "ERROR: cth_standard_args_parser: Missing value for switch $arg\n";
            }
        } else {
            die "ERROR: cth_standard_args_parser: Invalid argument: $arg\n";
        }
    }

    # Check that all given switches are inside the given array of switches
    for my $switch (keys %switches) {
        die "ERROR: cth_standard_args_parser: Unexpected switch: $switch\n" unless grep { $_ eq $switch } @switches;
    }

    # Print a warning for any option in the command line not in the given array
    for my $opt (keys %options) {
        print "WARNING: cth_standard_args_parser: Unexpected option '$opt' passed to the test.\n" unless grep { $_ eq $opt } @options;
    }

    # Print the parsed switches
    #print "Switches:\n";
    #while (my ($switch, $value) = each %switches) {
    #    print "--$switch => $value\n";
    #}

    # Print the parsed options
    #print "Options:\n";
    #while (my ($opt, $value) = each %options) {
    #    print "$opt => $value\n";
    #}

    return (\%switches, \%options);
}

# -----------------------------------------------------------------------
# cth_call_driver
#
# Calls the specified program-with-arguments of the specified driver.
# This assumes the cth directory structure is being followed, of course.
#
# inputs:
#    $driver : driver name to call (driver directory name)
#    $command : command (script/program) to call in the driver
#      directory, plus any parameters.
#
# output:
#    $retval : raw integer return code from the system call. If this
#      is not zero, the call has failed, and the test should fail. This
#      sub does not kill the test because it gives a chance for e.g.
#      cleanups to be performed.
# -----------------------------------------------------------------------

sub cth_call_driver {

    my ($driver, $command) = @_;
    if (! defined $driver) {
        print "ERROR: cth_call_driver: driver argument is undefined\n";
        return 1;
    }
    if (! defined $command) {
        print "ERROR: cth_call_driver: command argument is undefined\n";
        return 1;
    }

    my $command_path = "../../drivers/$driver/$command";

    print "cth_call_driver: run command: $command_path\n";

    my $output = `$command_path 2>&1`;
    my $retval = $?;
    if ($retval) {
        print "cth_call_driver: command returned a nonzero (error) code: $retval\n";
    } else {
        print "cth_call_driver: command successful (returned zero)\n";
    }
    print "cth_call_driver: command output: $output\n";

    return $retval;
}

# -----------------------------------------------------------------------
# End of library.
# -----------------------------------------------------------------------

1;
