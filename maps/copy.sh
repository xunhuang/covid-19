#/bin/bash -e

base="`dirname $0`"
cd $base/out

if [[ -e ./state-counties ]]; then
  echo "Copying state-counties"

  out="../../website/public/maps/us/states"
  for f in ./state-counties/*.svg; do
    if grep -q ' />' "${f}"; then
      echo "state-counties don't appear crushed, please regenerate with --crush"
      exit 1
    fi

    state=`echo "${f}" | sed 's/.*\/\(.*\)\.svg$/\1/'`
    mkdir -p "${out}/${state}"
    cp "$f" "${out}/${state}/counties.svg"
  done
fi

if [[ -e ./state-counties ]]; then
  echo "Copying state-zips"

  out="../../website/public/maps/us/states"
  for f in ./state-zips/*.svg; do
    if grep -q ' />' "${f}"; then
      echo "state-zips don't appear crushed, please regenerate with --crush"
      exit 1
    fi

    state=`echo "${f}" | sed 's/.*\/\(.*\)\.svg$/\1/'`
    mkdir -p "${out}/${state}"
    cp "${f}" "${out}/${state}/zips.svg"
  done
fi

if [[ -e ./region-zips ]]; then
  echo "Copying region-zips"

  out="../../website/public/maps/us/regions"
  for f in ./region-zips/*.svg; do
    if grep -q ' />' "${f}"; then
      echo "region-zips don't appear crushed, please regenerate with --crush"
      exit 1
    fi

    region=`echo "${f}" | sed 's/.*\/\(.*\)\.svg$/\1/'`
    mkdir -p "${out}/${region}"
    cp "${f}" "${out}/${region}/zips.svg"
  done
fi
