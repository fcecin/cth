`get-doh` is a script that is responsible for downloading and setting up a proper copy of the entire doh codebase under a given directory.

Example:

  `get-doh ../local/doh/`

This tool was created so that the `cth` repository doesn't have to include `doh-contracts` directly as a submodule. This causes problems because the submodules _of_ `doh-contracts` become entangled with the `cth` local git repository in that case.

Also, we don't want `cth` to depend on `doh-contracts` for anything other than the set-target scripts which are still needed for building.

`get-doh` first clones `doh-contracts` under `cth/local/tmp/` (all of `local` is `.gitignore`d). Then it will `cp` the files in the root directory to the given target directory (say `cth/local/doh/`).

After we got the shell scripts we want, we don't want to depend on the submodule list or setup of `doh-contracts`. Instead, `get-doh` has its own idea about what are the repositories that make up the DoH codebase, and will `git clone --recursive` all of them under the target directory.
