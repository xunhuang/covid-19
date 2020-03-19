import React from 'react';

const DataCreditWidget = () => {
    return (
        <div>
            <h4> Data Sources </h4>
            <li>
                <a target="_blank" href="https://github.com/CSSEGISandData/COVID-19" rel="noopener noreferrer" >
                    Johns Hopkins CSSE
          </a>
            </li>
            <li>
                <a target="_blank" href="https://coronavirus.1point3acres.com/en" rel="noopener noreferrer" >
                    1point3acres.com
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
        </div>
    );
}

export { DataCreditWidget };
