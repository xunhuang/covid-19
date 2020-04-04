#/bin/bash -e

base="`dirname $0`"
cd $base

pushd .
mkdir -p sources
cd sources
if [[ ! -e cb_2018_us_county_5m.zip ]]; then
  wget https://www2.census.gov/geo/tiger/GENZ2018/kml/cb_2018_us_county_5m.zip
fi
unzip -o -d . cb_2018_us_county_5m.zip cb_2018_us_county_5m.kml
if [[ ! -e cb_2018_us_zcta510_500k.zip ]]; then
  wget https://www2.census.gov/geo/tiger/GENZ2018/kml/cb_2018_us_zcta510_500k.zip
fi
unzip -o -d . cb_2018_us_zcta510_500k.zip cb_2018_us_zcta510_500k.kml
if [[ ! -e zcta_place_rel_10.txt ]]; then
  wget https://www2.census.gov/geo/docs/maps-data/data/rel/zcta_place_rel_10.txt
fi
popd

if [[ ! -e venv ]]; then
  python3 -m virtualenv venv
  source venv/bin/activate
  pip install -r requirements.txt
fi

echo "\n"
echo "In order to run the Python scripts, first run:"
echo "source ${base}/venv/bin/activate\n"
echo "Then you will be able to run commands like"
echo "python ${base}/generate-state-counties.py --crush"
