import React, { useContext } from 'react';
import { NearbyCounties } from "./CountyListRender.js"
import { withHeader } from "./ContentWrapping.js"
import { MyTabs } from "./MyTabs.js"
import { CountryContext } from "./CountryContext";
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { CountyHospitalsWidget } from "./Hospitals"
import * as Util from "./Util"
import { GraphSection } from './graphs/Graphs';
import { SectionHeader } from "./CovidUI"
import { Title } from "./Title";
import { Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const CA_statusMap = {
  "high": {
    text: "Widespread",
    color: "purple",
  },
  "substantial": {
    text: "Substantial",
    color: "red",
  },
  "moderate": {
    text: "Moderate",
    color: "orange",
  },
  "low": {
    text: "Minimal",
    color: "orange",
  },
  "4": {
    text: "Widespread",
    color: "purple",
  },
  "3": {
    text: "Substantial",
    color: "red",
  },
  "2": {
    text: "Moderate",
    color: "orange",
  },
  "1": {
    text: "Minimal",
    color: "yellow",
  },
}

const useStyles = makeStyles(theme => ({
  CA: {
    margin: 4,
  },
}));

const CountySpecificNew = (props) => {
  const classes = useStyles();

  const [countyData, setCountyData] = React.useState(null);
  React.useEffect(() => {
    props.source.fetchNewCountyInfo().then(data => setCountyData(data[0]));
  }, [props.source])

  if (!countyData) {
    return <div> Loading</div>;
  }

  console.log(countyData);
  let level = CA_statusMap[countyData.community] || {
    text: "Unknown",
    color: "blue",
  };
  const textStyle = {
    color: level && level.color,
    fontSize: 'x-large',
  }
  return <div className={classes.CA}>
    Level:<span style={textStyle}> {level.text}. </span>
    {countyData.school}
    {countyData.healthwebsites &&
      countyData.healthwebsites.map(site =>
        <span className={classes.CA} >
          <Link target="_blank" href={site} className={props.className}>
            {site}
          </Link>
        </span>
      )
    }
  </div>;
};

const PageCounty = withHeader((props) => {
  const country = useContext(CountryContext);
  const state = country.stateForTwoLetterName(props.match.params.state);
  const county = state.countyForName(props.match.params.county);

  Util.CookieSetLastCounty(state.twoLetterName, county.name);

  const tabs = [
    <NearbyCounties county={county} />,
    <CountyHospitalsWidget county={county} />,
  ];
  return (
    <>
      <Title
        title={`${county.name}, ${state.twoLetterName}`}
        desc={`${county.name} County COVID-19 30-day data visualized: `
          + `confirmed cases, new cases & death curves.`}
      />
      <USInfoTopWidget source={county} />
      <CountySpecificNew source={county} />
      <GraphSection source={county} />
      <BonusDashboards county={county} />
      <MyTabs
        labels={["Nearby", "Hospitals"]}
        urlQueryKey="table"
        urlQueryValues={['nearby', 'hospitals']}
        tabs={tabs}
      />
    </>
  );
});

const BonusDashboards = (props) => {
  const fips = props.county.fips();

  if (fips === "06085") {
    return (
      <SectionHeader>
        <a target="_blank" href="https://www.sccgov.org/sites/phd/DiseaseInformation/novel-coronavirus/Pages/dashboard.aspx" rel="noopener noreferrer" >
          Santa Clara County Coronavirus Data Dashboard
               </a>
      </SectionHeader>
    );
  } else if (fips === "06081") {
    return (
      <SectionHeader>
        <a target="_blank" href="https://www.smchealth.org/post/san-mateo-county-covid-19-data-1" rel="noopener noreferrer" >
          San Mateo County COVID-19 Data
                </a>
      </SectionHeader>
    );
  } else {
    return null;
  }
};

export { PageCounty }
