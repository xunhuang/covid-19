import React from 'react';
import Typography from '@material-ui/core/Typography'

const DataCreditWidget = () => {
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
            </Typography>
        </div>
    );
}

export { DataCreditWidget };
