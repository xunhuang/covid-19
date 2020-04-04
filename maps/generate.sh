#!/bin/bash -e

base="`dirname $0`"
cd $base

source ./venv/bin/activate
python generate-region-zips.py --crush
python generate-state-counties.py --crush
python generate-state-zips.py --crush
./copy.sh
