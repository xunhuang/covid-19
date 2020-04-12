import React from 'react';
import { Switch, Redirect, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@material-ui/core/styles';
import { Splash } from './Splash.js';
import { fetchCounty } from "./GeoLocation"
import { logger } from "./AppModule"
import { PageUS } from "./PageUS"
import { PageState } from "./PageState"
import { PageCounty } from "./PageCounty"
import { PageMetro } from "./PageMetro"
import { Page404 } from "./Page404"
import { Country } from "./UnitedStates";
import { CountryContext } from "./CountryContext";
import { compactTheme } from "./Theme.js";
import { reverse } from 'named-urls';
import routes from "./Routes";
import history from "./history";

const App = (props) => {
  return <BrowserRouter>
    <ThemeProvider theme={compactTheme}>
      <MainApp  {...props} history={history} />
    </ThemeProvider>
  </BrowserRouter>;
};

const states = require('us-state-codes');

class MyRoute extends Route {
  // Update page title and description
  updateMeta() {
    let params = this.props.computedMatch.params;
    let state = params.state;
    let county = params.county;
    let metro = params.metro;

    let titlePrefix;
    let desc;
    if (state !== undefined && county !== undefined) {
      // county page
      titlePrefix = `${county}, ${state}`;
      desc = `${county} county COVID-19 30-day data visualized: confirmed cases, new cases & death curves.`;
    } else if (state !== undefined && county === undefined) {
      // state page
      let stateFullName = states.getStateNameByStateCode(state);
      titlePrefix = stateFullName;
      desc = `${stateFullName} COVID-19 30-day data visualized: confirmed cases, `
        + "new cases & death curves, testing results & hospitalization numbers.";
    } else if (metro !== undefined) {
      // metro page
      titlePrefix = metro;
      desc = `${metro} COVID-19 30-day data visualized: confirmed cases, `
        + "new cases & death curves.";
    } else {
      // 404 page or US page
      titlePrefix = (this.props.status === 404) ? 'Page Not Found' : 'US';
      desc = "US county-level COVID-19 30-day data visualized: confirmed cases, "
        + "new cases & death curves. State-level testing results & hospitalization numbers.";
    }
    let title = `${titlePrefix} | COVID-19 Daily Numbers Visualized`;
    document.title = title;
    document.querySelector('meta[name="description"]').setAttribute("content", desc);
    document.querySelector('meta[property="og:title"]').setAttribute("content", title);
    document.querySelector('meta[property="og:description"]').setAttribute("content", desc);
  }

  componentDidMount() {
    this.updateMeta();
  }

  componentDidUpdate() {
    this.updateMeta();
  }
}

const MainApp = withRouter((props) => {
  const [country, setCountry] = React.useState(null);
  const [myCounty, setMyCounty] = React.useState(null);
  React.useEffect(() => {
    const myCountry = new Country();
    setCountry(myCountry);

    fetchCounty().then(myCounty => {
      const state = myCountry.stateForTwoLetterName(myCounty.state);
      const county = state.countyForName(myCounty.county);
      setMyCounty(county);
      logger.logEvent("AppStart", {
        myCounty: county,
      });
    });
  }, []);

  if (country === null) {
    return <Splash />
  }

  if (props.location.pathname === "/") {
    if (myCounty === null) {
      return <Splash />
    } else {
      return <Redirect to={reverse(routes.county, {
        state: myCounty.state().twoLetterName,
        county: myCounty.name,
      })} />;
    }
  }

  return (
    <CountryContext.Provider value={country}>
      <Switch>
        {/* <Route exact path='/' component={App2} /> */}
        <MyRoute exact path={routes.county} component={PageCounty} />
        <MyRoute exact path={routes.state} component={PageState} />
        <MyRoute exact path={routes.united_states} component={PageUS} />
        <MyRoute exact path={routes.metro} component={PageMetro} />
        <MyRoute exact path={routes.united_states_recovery} component={PageUS} />
        <MyRoute exact path="*" component={Page404} status={404} />
      </Switch>
    </CountryContext.Provider>
  );
});

export default App;
