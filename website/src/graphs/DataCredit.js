import React from 'react';
import Typography from '@material-ui/core/Typography'
import { withHeader } from "../ContentWrapping.js"

const DataCreditWidget = (props) => {
  return (
    <div>
      <Typography variant="body1">
        We are incredibly grateful to people working hard to make their data available.
            </Typography>

      <Typography variant="body2" >
        <li>
          <a target="_blank" href="https://github.com/CSSEGISandData/COVID-19" rel="noopener noreferrer" >
            Johns Hopkins CSSE
          </a>
        </li>
        <li>
          <a target="_blank" href="https://en.wikipedia.org/wiki/User:Michael_J/County_table" rel="noopener noreferrer" >
            Wikipedia county info
          </a>
        </li>
        <li>
          <a target="_blank" href="https://hifld-geoplatform.opendata.arcgis.com/search?groupIds=2900322cc0b14948a74dca886b7d7cfc" rel="noopener noreferrer" >
            Homeland Infrastructure Foundation-Level Data (HIFLD)
           </a>
        </li>
        <li>
          <a target="_blank" href="https://covidtracking.com/api/" rel="noopener noreferrer" >
            Covid tracking API
           </a>
        </li>
        <li>
          <a target="_blank" href="https://w.wiki/LeZ" rel="noopener noreferrer">
            Wikidata query for stay-at-home orders
                    </a>
        </li>
        <li>
          <a target="_blank" href="https://bnonews.com/index.php/2020/04/the-latest-coronavirus-cases/" rel="noopener noreferrer">
            BNO News
                    </a>
        </li>
        <li>
          <a target="_blank" href="https://www.npr.org/sections/health-shots/2020/04/07/825479416/new-yorks-coronavirus-deaths-may-level-off-soon-when-might-your-state-s-peak" rel="noopener noreferrer">
            NPR, The Institute for Health Metrics and Evaluation at the University of Washington, Census Bureau for Death and hospitalization projection.
                    </a>
        </li>
        <li>
          <a target="_blank" href="https://www.nlsinfo.org/usersvc/NLSY97/NLSY97Rnd9geocodeCodebookSupplement/gatt101.htm" rel="noopener noreferrer">
            MSA definition from NLSInfo.org
          </a>
        </li>
        <li>
          <a target="_blank" href="https://www.naccho.org/membership/lhd-directory" rel="noopener noreferrer">
            Local Health Departments from Naccho.org
          </a>
        </li>

      </Typography>
    </div>
  );
};

export { DataCreditWidget };
