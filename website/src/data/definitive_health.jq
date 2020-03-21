# this file sums the NUM_ICU_BEDS (and other bed type ) by county.
# note that CNTY_FIPS is not globally unique, only unique within a state
[[.features |.[]  |.properties | 
  {
    NUM_LICENSED_BEDS, 
    NUM_LICENSED_BEDS, 
    NUM_STAFFED_BEDS, 
    BED_UTILIZATION, 
    CNTY_FIPS, 
    NUM_ICU_BEDS, 
    COUNTY_NAME,
    STATE_NAME,
    STATE_FIPS,
    AA: (.STATE_FIPS + .CNTY_FIPS),
    }
 | (select(.AA!=null))] |  group_by(.AA) [] | {
   COUNTY_FLIPS: .[0].AA,
   STATE_NAME: .[0].STATE_NAME,
   COUNTY_NAME: .[0].COUNTY_NAME,
   NUM_ICU_BEDS: [.[] |select (.NUM_ICU_BEDS > 0) ] | map(.NUM_ICU_BEDS) |add,
   NUM_LICENSED_BEDS:[.[] |select (.NUM_LICENSED_BEDS > 0) ] | map(.NUM_LICENSED_BEDS) |add,
   NUM_STAFFED_BEDS:[.[] |select (.NUM_STAFFED_BEDS > 0) ] | map(.NUM_STAFFED_BEDS) |add
  }
] 