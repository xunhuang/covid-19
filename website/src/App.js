import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { countyModuleInit } from "./USCountyInfo.js";
import { Splash } from './Splash.js';
import { fetchCounty } from "./GeoLocation"
import { logger } from "./AppModule"
import { PageUS } from "./PageUS"
import { PageState } from "./PageState"
import { PageCounty } from "./PageCounty"
import * as Util from "./Util"

const App = (props) => {
  return <BrowserRouter>
    <MainApp  {...props} />
  </BrowserRouter>;
};

const states = require('us-state-codes');

class MyRoute extends Route {
  updateTitle() {
    let params = this.props.computedMatch.params;
    let state = params.state;
    let county = params.county;
    let titlePrefix = '';
    if (state === undefined && county === undefined) {
      titlePrefix = 'US';
    } else if (county === undefined) {
      titlePrefix = states.getStateNameByStateCode(state);
    } else {
      titlePrefix = `${county}, ${state}`;
    }
    let title = `${titlePrefix} | COVID-19 Daily Numbers`;
    document.title = title;
  }

  componentDidMount() {
    this.updateTitle();
  }

  componentDidUpdate() {
    this.updateTitle();
  }
}

const MainApp = withRouter((props) => {
  const [county, setCounty] = React.useState(null);
  const [state, setState] = React.useState(null);
  React.useEffect(() => {
    fetchCounty().then(mycounty => {
      countyModuleInit([]);
      setCounty(mycounty.county)
      setState(mycounty.state);
      logger.logEvent("AppStart", {
        county: mycounty.county,
        state: mycounty.state,
      });
    });
  }, []);

  // return <Splash />
  if (state === null) {
    return <Splash />
  }

  if (props.location.pathname === "/") {
    Util.browseTo(props.history, state, county);
  }
  return (
    <div>
      <Switch>
        {/* <Route exact path='/' component={App2} /> */}
        <MyRoute exact path='/county/:state/:county' render={(props) => <PageCounty {...props} state={state} county={county} />} />
        <MyRoute exact path='/state/:state' render={(props) => <PageState {...props} state={state} county={county} />} />
        <MyRoute exact path='/US' render={(props) => <PageUS {...props} state={state} county={county} />} />
      </Switch>
    </div>
  );
});

export default App;
