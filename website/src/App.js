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
import { Title } from "./Title";
import { compactTheme } from "./Theme.js";
import { reverse } from 'named-urls';
import routes from "./Routes";

const App = (props) => {
  return <BrowserRouter>
    <Title />
    <ThemeProvider theme={compactTheme}>
      <MainApp  {...props} />
    </ThemeProvider>
  </BrowserRouter>;
};

class MainAppClass extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            country: null,
            county: null,
            state: null,
            updateCountry: this.setCountryState
        };
    }

    componentDidMount() {
        this.setCountryState()
    }

    render() {
        if (this.state.country === null) {
          return <Splash />
        }

        if (this.props.location.pathname === "/") {
          if (this.state.county === null) {
            return <Splash />
          } else {
            return <Redirect to={reverse(routes.county, {
              state: this.state.county.state().twoLetterName,
              county: this.state.county.name,
            })} />;
          }
        }

        return (
          <CountryContext.Provider value={this.state.country ? this.state : undefined}>
            <SafeRoutes />
          </CountryContext.Provider>
        );
    }

    setCountryState = (useGoogleAPI = false, callBack = null) => {
        const myCountry = new Country();
        this.setState({
            country: myCountry
        })

        fetchCounty(useGoogleAPI).then(myCounty => {
          const state = myCountry.stateForTwoLetterName(myCounty.state);
          const county = state.countyForName(myCounty.county);
          this.setState({
              county: county,
              state: state
          }, callBack ? (() => { callBack(this.state); }) : (null));
          logger.logEvent("AppStart", {
            myCounty: county,
          });
        });
    }

}

const MainApp = withRouter(MainAppClass)

class UnhookedSafeRoutes extends React.Component {

  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location) {
      return UnhookedSafeRoutes.successStateFor(props);
    } else {
      return null;
    }
  }

  static successStateFor(props) {
    return {errored: false, location: props.location};
  }

  constructor(props) {
    super(props);
    this.state = UnhookedSafeRoutes.successStateFor(props);
  }

  componentDidCatch(error, info) {
    this.setState({errored: true});
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
          <Route exact path="*" component={Page404} status={404} />
        </Switch>
      );
    }
  }
}
const SafeRoutes = withRouter(UnhookedSafeRoutes);

export default App;
