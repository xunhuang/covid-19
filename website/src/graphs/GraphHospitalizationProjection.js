import React, { useContext } from 'react';
import { CountryContext } from "../CountryContext"
import { Country, State, County } from '../UnitedStates';
import { GraphCountyHospitalization } from "./GraphCountyHospitalization"
import { AdvancedGraph } from '../components/graphs/AdvancedGraph'
import { DataSeries } from '../models/DataSeries';
import { getRefLines } from "../Util"

const GraphAllBedProjectionState = (props) => {
  return <GraphHospitalization {...props} source={props.state} />
}

const GraphAllBedProjectionUS = (props) => {
  const country = useContext(CountryContext);
  return <GraphHospitalization {...props} source={country} />
}

const GraphHospitalization = (props) => {
  const source = props.source
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    source.hospitalizationAsync().then(data => setData(data));
  }, [source]);

  if (!data || data.length === 0) {
    return <div> Loading</div>;
  }

  let hospitalized = DataSeries.fromOldDataSourceDataPoints("Hospitalized", data, "hospitalizedCurrently");
  let icu =
    DataSeries.fromOldDataSourceDataPoints("In ICU", data, "inIcuCurrently");
  let onVentilatorCurrently =
    DataSeries.fromOldDataSourceDataPoints("On Ventilator", data, "onVentilatorCurrently")
  let icu_capacity = source.hospitals().bedsICU;

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

  return <AdvancedGraph
    serieses={
      [
        {
          series: hospitalized,
          color: "blue",
        },
        {
          series: icu,
          color: "#387908",
        },
        {
          series: onVentilatorCurrently,
          color: "red",
        },
      ]
    }
    vRefLines={getRefLines(source)}
    hRefLines={hrefs}
  />;
}

function maybeHospitalizationProjectionTabFor(source) {
  // Fuck this
  if (source instanceof Country) {
    return {
      id: 'peakhospitalization',
      label: 'Hospitalization',
      graph: (props) => <GraphAllBedProjectionUS />,
    };
  } else if (source instanceof State) {
    return {
      id: 'peakhospitalization',
      label: 'Hospitalization',
      graph: (props) => <GraphAllBedProjectionState state={props.source} />,
    };
  } else if (source instanceof County) {
    if (source.hospitalization()) {
      return {
        id: 'peakhospitalization',
        label: 'Hospitalization',
        graph: (props) => <GraphCountyHospitalization
          hospitalization={source.hospitalization()}
          source={source}
        />,
      };
    }
    return undefined;
  } else {
    return undefined;
  }
}

// cut here ---

const GraphVaccinationState = (props) => {
  return <GraphVaccination {...props} source={props.state} />
}

export const GraphVaccinationUSA = (props) => {
  const source = props.source;
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    source.vaccineDataAsync().then(data => setData(data));
  }, [source]);

  if (!data) {
    return null;
  }
  let administered = DataSeries.fromOldDataSourceDataPoints("Vaccines Administered", data, "Administered_Cumulative");
  let daily = DataSeries.fromOldDataSourceDataPoints("Vaccines Daily", data, "Administered_Daily");
  return <AdvancedGraph
    serieses={
      [
        {
          series: administered,
          color: "blue",
        },
        {
          series: daily,
          color: "green",
          rightAxis: true,
          showMovingAverage: true,
          covidspecial: true,
        },
      ]
    }
  />;
}

export const GraphVaccinationCounty = (props) => {
  const source = props.source;
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    source.vaccineDataAsync().then(data => setData(data));
  }, [source]);

  if (!data) {
    return null;
  }
  let administered = DataSeries.fromOldDataSourceDataPoints("Vaccines Administered", data, "doses_administered");
  let daily = DataSeries.fromOldDataSourceDataPoints("Daily", data, "new_doses_administered");
  let dailymoving = DataSeries.fromOldDataSourceDataPoints("Daily (7-day)", data, "new_doses_administered_seven_day_average");
  return <AdvancedGraph
    serieses={
      [
        {
          series: administered,
          color: "blue",
        },
        {
          series: daily,
          color: "green",
          rightAxis: true,
          stipple: true,
        },
        {
          series: dailymoving,
          color: "green",
          rightAxis: true,
          covidspecial: true,
        },
      ]
    }
  />;
}

const GraphVaccination = (props) => {
  // const source = props.source;
  // const [data, setData] = React.useState(null);
  // React.useEffect(() => {
  //   source.vaccineDataAsync().then(data => setData(data));
  // }, [source]);

  // if (!data) {
  //   return null;
  // }

  let admin = props.source.vaccineAdminSeries();
  // let shipped = props.source.vaccineShippedSeries();
  // let alloc = props.source.vaccineAllocSeries();
  // let given =
  // DataSeries.fromOldDataSourceDataPoints("New admin", data, "Doses_Administered");
  // let shipped2 =
  // DataSeries.fromOldDataSourceDataPoints("Doses Distributed", data, "Doses_Distributed");


  return <AdvancedGraph
    serieses={
      [
        {
          series: admin,
          color: "blue",
        },
        // {
        //   series: shipped,
        //   color: "grey",
        // },
        {
          series: admin.change().setLabel("Daily"),
          color: "#387908",
          rightAxis: true,
          covidspecial: true,
          showMovingAverage: true,
        },
      ]
    }
  // vRefLines={getRefLines(source)}
  // hRefLines={hrefs}
  />;
}

export {
  maybeHospitalizationProjectionTabFor,
  GraphAllBedProjectionState,
  GraphAllBedProjectionUS,
  GraphVaccinationState
}
