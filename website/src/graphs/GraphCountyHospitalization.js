import React from 'react';
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { DataSeries } from '../models/DataSeries';
import { getRefLines } from "../Util"

const GraphCountyHospitalization = (props) => {
  let data = props.hospitalization;
  let hospitalized =
    DataSeries.fromOldDataSourceDataPoints("Hospitalized", data, "hospitalized_covid_patients");
  let icu =
    DataSeries.fromOldDataSourceDataPoints("In ICU", data, "icu_covid_patients");
  let icu_avail =
    DataSeries.fromOldDataSourceDataPoints("Available ICU Beds", data, "icu_available_beds");
  const vKeyRefLines = getRefLines(props.source);
  let icu_capacity = props.source.hospitals().bedsICU;

  let hrefs = icu_capacity ? [
    {
      value: icu_capacity,
      label: "100% ICU",
    },
    {
      value: icu_capacity / 4,
      label: "25% ICU",
    },
    {
      value: icu_capacity / 2,
      label: "50% ICU",
    },
    {
      value: icu_capacity / 4 * 3,
      label: "75% ICU",
    },
  ] : null;

  vKeyRefLines.push(
  );

  return <AdvancedGraph
    serieses={
      [
        {
          series: hospitalized,
          color: "blue",
          // covidspecial: true,
        },
        {
          series: icu,
          color: "red",
          // covidspecial: true,
        },
        {
          series: icu_avail,
          color: "#387908",
          stipple: true,
          // covidspecial: true,
        },
      ]
    }
    vRefLines={vKeyRefLines}
    hRefLines={hrefs}
  />;
};

export {
  GraphCountyHospitalization,
}
