import React from 'react';
import Typography from '@material-ui/core/Typography'

const DataCreditWidget = (props) => {
  const sources = [{
    label: "Johns Hopkins CSSE",
    url: "https://github.com/CSSEGISandData/COVID-19",
  }, {
    label: "Wikipedia county info",
    url: "https://en.wikipedia.org/wiki/User:Michael_J/County_table",
  }, {
    label: "Homeland Infrastructure Foundation-Level Data (HIFLD)",
    url: "https://hifld-geoplatform.opendata.arcgis.com/search?groupIds=2900322cc0b14948a74dca886b7d7cfc",
  }, {
    label: "Covid tracking API",
    url: "https://covidtracking.com/api/",
  }, {
    label: "Wikidata query for country and region data",
    url: "https://w.wiki/QJc",
  }, {
    label: "Wikidata query for stay-at-home orders",
    url: "https://w.wiki/LeZ",
  }, {
    label: "BNO News",
    url: "https://bnonews.com/index.php/2020/04/the-latest-coronavirus-cases/",
  }, {
    label: "The Institute for Health Metrics and Evaluation",
    url: "http://www.healthdata.org/covid/data-downloads",
  }, {
    label: "MSA definition from NLSInfo.org",
    url: "https://www.nlsinfo.org/usersvc/NLSY97/NLSY97Rnd9geocodeCodebookSupplement/gatt101.htm",
  }, {
    label: "Local Health Departments from Naccho.org",
    url: "https://www.naccho.org/membership/lhd-directory",
  }, {
    label: "CDC",
    url: "https://www.cdc.gov/",
  }, {
    label: "HealthData.Gov",
    url: "https://healthdata.gov/dataset/covid-19-diagnostic-laboratory-testing-pcr-testing-time-series",
  },
  ];
  sources.sort((a, b) => a.label < b.label ? -1 : 1);

  return (
    <div>
      <Typography variant="body1">
        We are incredibly grateful to people working hard to make their data available.
      </Typography>

      <Typography variant="body2" >
        {sources.map(({ label, url }) => (
          <li key={url}>
            <a target="_blank" href={url} rel="noopener noreferrer">{label}</a>
          </li>
        ))}
      </Typography>
    </div>
  );
};

export { DataCreditWidget };
