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
    source.testingAsync().then(data => setData(data));
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

const GraphVaccination = (props) => {
  const source = props.source;

  // let hospitalized = DataSeries.fromOldDataSourceDataPoints("Vaccine Administered", data, "doses_admin_total");
  let admin = props.source.vaccineAdminSeries();
  let shipped = props.source.vaccineShippedSeries();
  let alloc = props.source.vaccineAllocSeries();
  // let icu =
  //   DataSeries.fromOldDataSourceDataPoints("In ICU", data, "inIcuCurrently");
  // let onVentilatorCurrently =
  //   DataSeries.fromOldDataSourceDataPoints("On Ventilator", data, "onVentilatorCurrently")


  return <AdvancedGraph
    serieses={
      [
        {
          series: admin,
          color: "blue",
        },
        {
          series: alloc,
          color: "green",
        },
        {
          series: shipped,
          color: "grey",
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
