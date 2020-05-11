import React from 'react';
import { Switch, Redirect, Route, withRouter } from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@material-ui/core/styles';
import { Splash } from './Splash.js';
import { fetchApproximatePoliticalLocation } from "./GeoLocation"
import { logger } from "./AppModule"
import { PageUS } from "./PageUS"
import { PageState } from "./PageState"
import { PageCounty } from "./PageCounty"
import { PageMetro } from "./PageMetro"
import { PageRegion } from "./pages/PageRegion";
import { Page404 } from "./Page404"
import { Country } from "./UnitedStates";
import { CountryContext } from "./CountryContext";
import { Title } from "./Title";
import { compactTheme } from "./Theme.js";
import { reverse } from 'named-urls';
import routes from "./Routes";
import { makeCountyFromDescription } from "./Util"

import { WorldContext } from './WorldContext';
import { createBasicEarth } from './models/Earth';

const App = (props) => {
  return <BrowserRouter>
    <Title />
    <ThemeProvider theme={compactTheme}>
      <MainApp  {...props} />
    </ThemeProvider>
  </BrowserRouter>;
};

const MainApp = withRouter((props) => {
  const [earth, setEarth] = React.useState(null);
  const [country, setCountry] = React.useState(null);
  const [myCounty, setMyCounty] = React.useState(null);
  React.useEffect(() => {
    setEarth(createBasicEarth);

    const myCountry = new Country();
    setCountry(myCountry);

    fetchApproximatePoliticalLocation().then(countyDescr => {
      const county = makeCountyFromDescription(myCountry, countyDescr);
      setMyCounty(county);
      logger.logEvent("AppStart", {
        myCounty: county,
      });
    });
  }, []);

  if (earth === null || country === null) {
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
    <WorldContext.Provider value={earth}>
      <CountryContext.Provider value={country}>
        <SafeRoutes />
      </CountryContext.Provider>
    </WorldContext.Provider>
  );
});

class UnhookedSafeRoutes extends React.Component {

  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location) {
      return UnhookedSafeRoutes.successStateFor(props);
    } else {
      return null;
    }
  }

  static successStateFor(props) {
    return { errored: false, location: props.location };
  }

  constructor(props) {
    super(props);
    this.state = UnhookedSafeRoutes.successStateFor(props);
  }

  componentDidCatch(error, info) {
    this.setState({ errored: true });
  }

  render() {
    if (this.state.errored) {
      // Is lying really so bad in this situation? It's probably a 404 anyway...
      return <Page404 />;
    } else {
      return (
        <Switch>
          <Route exact path={routes.county} component={PageCounty} />
          <Route exact path={routes.state} component={PageState} />
          <Route exact path={routes.united_states} component={PageUS} />
          <Route exact path={routes.metro} component={PageMetro} />
          <Route exact path={routes.united_states_recovery} component={PageUS} />
          <Route exact path={routes.region} component={PageRegion} />
          <Route exact path="*" component={Page404} status={404} />
        </Switch>
      );
    }
  }
}
const SafeRoutes = withRouter(UnhookedSafeRoutes);

export default App;
