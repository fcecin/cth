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
#
# Library example (complete):
#   use Exporter qw(import);
#   our @EXPORT = qw(some_function another_function);
#   sub some_function { print "Hello, from some_function!\n"; }
#   sub another_function { print "Hello, from another_function!\n"; }
# -----------------------------------------------------------------------

package CthGoodies;

use strict;
use warnings;


# TODO
#- testar o cth_standard parser
codigo que usa: (nome da funcao e lib ta errado)
#!/usr/bin/perl

use strict;
use warnings;
use CommandLineParser qw(parse_command_line);

my @switches = ('help', 'verbose', 'debug');
my @options  = ('input', 'output');

my $parsed_options = parse_command_line(\@switches, \@options);

# Access the values of options
if (defined $parsed_options->{'input'}) {
    print "Input file: ", $parsed_options->{'input'}, "\n";
}
if (defined $parsed_options->{'output'}) {
    print "Output file: ", $parsed_options->{'output'}, "\n";
}

# Rest of your program logic here...


    


use Exporter qw(import);
our @EXPORT = qw(cth_standard_test_command_line_args_parser);

sub cth_standard_test_command_line_args_parser {
    my ($switches_ref, $options_ref) = @_;

    my %options_map = ();
    my %valid_options = ();
    my $options_spec = join('|', map { $_ . '=s' } @$options_ref);

    GetOptionsFromArray(
        \@ARGV,
        map { $_ . '!' => \$options_map{$_} } @$switches_ref,
        map { $_ => sub { my ($opt_name, $opt_value) = @_; $valid_options{$opt_name} = $opt_value; } } @$options_ref
    ) or die "Error parsing command-line arguments.";

    # Check for undefined switches
    foreach my $switch (keys %options_map) {
        if (!defined $options_map{$switch}) {
            die "Unknown switch: $switch";
        }
    }

    # Check for undefined options
    foreach my $option (@$options_ref) {
        if (!defined $valid_options{$option}) {
            warn "Warning: Option --$option is missing.";
        }
    }

    # Check for extra options provided in the command-line
    foreach my $opt_name (keys %valid_options) {
        unless (grep { $_ eq $opt_name } @$options_ref) {
            warn "Warning: Unknown option --$opt_name";
        }
    }

    return \%valid_options;
}

1;
