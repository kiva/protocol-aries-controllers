#!/usr/bin/env bash

#
# This script requires jq to run successfully.
# https://stedolan.github.io/jq/
#
# on mac you can install it with brew
#
# this script should be run from protocol-aries directory
#
# You are  expected to update version prior to running 
# TODO figure out how to pass in the new version via command line

echo "You are  expected to update version prior to running"

do_update() {
    cp package.json temp.json
    jq -r '.dependencies."protocol-common" |= "0.1.47"' --indent 4 temp.json > package.json
    rm temp.json
    npm install
    cd ../..
}

echo "fsp" && cd implementations/fsp && do_update
echo "tdc" && cd implementations/tdc && do_update
