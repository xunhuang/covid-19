import React from 'react';
import Paper from '@material-ui/core/Paper';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Badge from '@material-ui/core/Badge';
import { withStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router-dom'
import { AtAGlance } from './AtAGlance.js'
import { ChildrenAtAGlance } from './ChildrenAtAGlance.js'
import { CovidCompare } from './CovidCompare.js'
import { GraphDaysToDoubleOverTime } from './GraphDaysToDoubleOverTime'
import { GraphGrowthRateOverTime } from './GraphGrowthRateOverTime'
import { maybeHospitalizationProjectionTabFor } from './GraphHospitalizationProjection';
import { maybeMapTabFor } from '../Map';
import { maybeRecoveryAndDeathTabFor } from './GraphRecoveryAndDeath.js'
import { maybeTestingTabFor } from './GraphTestingEffort'
import { maybeDailyTabFor } from './GraphDaily'
import { Country, State, County } from "../UnitedStates"

const styles = theme => ({
  content: {
    margin: '0 2px 2px 2px',
  },
  location: {
    margin: '2px 0',
  },
  detailedToggles: {
    margin: '12px 0',
  },
  tabContent: {
    padding: '2px',
  }
});

const RibbonBadge = withStyles({
  badge: {
    borderRadius: '0px',
    fontSize: '0.3rem',
    transform: 'rotate(15deg)',
    height: '10px',
    minWidth: '10px',
    right: '-15px',
  }
})(Badge);


class UnhookedGraphSection extends React.Component {

  static getDerivedStateFromProps(props, state) {
    const desired = UnhookedGraphSection.getDesiredState(props);
    if (!state || state.tab !== desired.tab) {
      return desired;
    } else {
      return null;
    }
  }

  static getDesiredState(props) {
    return { tab: getUnvalidated(props.location, 'tab') };
  }

  constructor(props) {
    super(props);
    this.state = UnhookedGraphSection.getDesiredState(props);
  }

  render() {
    const classes = this.props.classes;
    const history = this.props.history;
    const source = this.props.source;
    const tabs = new Map();

    tabs.set('glance', {
      label: "At a glance",
      content: AtAGlance,
    });

    if (!(source instanceof County)) {
      tabs.set('childrenglance', {
        label: "Sub-Regions",
        content: ChildrenAtAGlance,
        showRibbon: true,
      });
    }

    const maybeDaily = maybeDailyTabFor(source);
    if (maybeDaily) {
      tabs.set(maybeDaily.id, {
        label: maybeDaily.label,
        content: maybeDaily.graph,
      });
    }

    if (source instanceof County) {
      tabs.set("compare", {
        label: "Compare",
        content: CovidCompare,
        showRibbon: true,
      });
    }

    [maybeHospitalizationProjectionTabFor]
      .map(factory => factory(source))
      .filter(tab => tab)
      .forEach(tab =>
        tabs.set(tab.id, {
          label: tab.label,
          content: tab.graph,
        }));

    if (source instanceof State || source instanceof Country) {
      const maybeTesting = maybeTestingTabFor(source)
      if (maybeTesting) {
        tabs.set(maybeTesting.id, {
          label: maybeTesting.label,
          content: maybeTesting.graph,
        });
      }
    }
    const maybeMap = maybeMapTabFor(source);
    if (maybeMap) {
      tabs.set(maybeMap.id, {
        label: maybeMap.label,
        content: maybeMap.content,
        // showRibbon: true,  // TO SHOW THE RIBBON ADD A LINE LIKE THIS
      });
    }

    tabs.set('growthRate', {
      label: "Growth",
      content: GraphGrowthRateOverTime,
    });

    tabs.set('days2x', {
      label: "Doubling",
      content: GraphDaysToDoubleOverTime,
    });

    const maybeRecovery = maybeRecoveryAndDeathTabFor(source);
    if (maybeRecovery && (source instanceof State || source instanceof Country)) {
      tabs.set(maybeRecovery.id, {
        label: "Recovery",
        content: maybeRecovery.graph,
      });
    }

    const headings = [...tabs.keys()];
    let tab;
    if (headings.includes(this.state.tab)) {
      tab = this.state.tab;
    } else {
      tab = headings[0];
    }

    const switchTo = (e, index) => {
      const desire = headings[index];
      this.setState({ tab: desire });
      pushChangeTo(history, 'tab', desire);
    };
    const TabContent = tabs.get(tab).content;

    return (
      <div className={classes.content}>
        <Tabs
          value={headings.indexOf(tab)}
          onChange={switchTo}
          variant="scrollable"
          scrollButtons="auto">
          {[...tabs.values()].map(tab => {
            const label = tab.showRibbon ? <RibbonBadge badgeContent='New' color="error">{tab.label}</RibbonBadge> : tab.label;
            return <Tab label={label} key={tab.label} />;
          })}
        </Tabs>
        <Paper className={classes.tabContent}>
          <TabContent source={source} />
        </Paper>
      </div>
    );
  }
}
export const GraphSection =
  withRouter(withStyles(styles)(UnhookedGraphSection));

function getUnvalidated(location, key) {
  const params = new URLSearchParams(location.search);
  if (params.has(key)) {
    return params.get(key);
  } else {
    return undefined;
  }
}

function pushChangeTo(history, key, value) {
  const params = new URLSearchParams(history.location.search);
  params.set(key, value);
  history.location.search = params.toString();
  history.push(history.location)
}
