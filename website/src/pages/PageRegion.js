import PropTypes from 'prop-types';
import React, {useContext} from 'react';
import {AppBar as MaterialAppBar, Paper, Toolbar, Typography} from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';
import {Redirect, withRouter} from 'react-router-dom';
import {fade, makeStyles, useTheme} from '@material-ui/core/styles';

import {AdvancedGraph} from '../components/graphs/AdvancedGraph';
import {BasicDataComponent} from '../models/BasicDataComponent';
import {Discussion} from '../components/chrome/Discussion';
import {DivisionTable} from '../components/tables/DivisionTable';
import {DivisionTypesComponent} from '../models/DivisionTypesComponent';
import {DonateLink} from '../components/chrome/DonateLink';
import {Footer} from '../Footer';
import {GeographyComponent} from '../models/GeographyComponent';
import {NameComponent} from '../models/NameComponent';
import {Path} from '../models/Path';
import {ProjectionsComponent} from '../models/ProjectionsComponent';
import {SearchInput} from '../components/chrome/SearchInput';
import {SocialMediaButtons} from '../components/chrome/SocialMediaButtons';
import {WorldContext} from '../WorldContext';

const shortNumber = require('short-number');

const HORIZONTAL_MARGIN = '16px';
const NEARBY_TO_SHOW = 10;

const useStyles = makeStyles(theme => ({
  body: {
    background: '#fafafa',
  },
  content: {
    padding: HORIZONTAL_MARGIN,
    margin: HORIZONTAL_MARGIN,
  },
  section: {
    margin: '16px 0 24px 0',
    overflow: 'scroll',
  },
  graph: {
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: '4px',
    padding: '8px',
  },
}));

export const PageRegion = withRouter((props) => {
  const classes = useStyles();
  const world = useContext(WorldContext);
  const path = Path.parse('/' + props.match.params[0]);

  if (path.matches('/US')) {
    return <Redirect to="/US" />;
  } else if (path.matches('/US/state/:state')) {
    return <Redirect to={"/state/" + path.components[2]} />;
  } else if (path.matches('/US/state/:state/county/:county')) {
    return <Redirect to={"/county/" + path.components[2] + '/' + path.components[4]} />;
  }

  const [basic, divisions, geography, projections] =
      world.getMultiple(
          path, [
            BasicDataComponent,
            DivisionTypesComponent,
            GeographyComponent,
            ProjectionsComponent,
          ]);
  if (!basic) {
    throw new Error(`${path.string()} has no basic component`);
  }

  const parentDivision = path.parent();
  const showNearby = geography && parentDivision;
  const couldBeNearby = (candidate) =>
      !path.equals(candidate) && world.has(candidate, GeographyComponent);
  const distanceTo = (candidate) => {
    const theirGeography = world.get(candidate, GeographyComponent);
    // This is kind of garbage, we're comparing a point to a point. Really
    // should be comparing bounds, but we don't have those.
    return geography.distance(theirGeography);
  };

  return (
    <div className={classes.body}>
      <AppBar />

      <Paper className={classes.content}>
        <Title className={classes.section} path={path} />

        {[DailyChangeGraph, DoublingGraph, DailyTotalGraph].map((Graph, i) => (
          <Graph
              key={i}
              basic={basic}
              projections={projections}
              className={`${classes.section} ${classes.graph}`}
          />
        ))}

        {divisions &&
          divisions.types().map(({id, plural}) =>
            <DivisionTable
                key={id}
                plural={plural}
                parent={id ? path.child(id) : path}
                className={classes.section}
            />
          )}

        {showNearby &&
            <DivisionTable
                parent={parentDivision}
                plural="Nearby"
                className={classes.section}
                filter={couldBeNearby}
                pickLowest={{
                  count: NEARBY_TO_SHOW,
                  quantifier: distanceTo,
                }}
            />}
      </Paper>

      <Discussion className={classes.content} />

      <Footer />
    </div>
  );
});

const RELIEF_COLOR = '#fff';

const useAppBarStyles = makeStyles(theme => ({
  appBar: {
    color: RELIEF_COLOR,
    display: 'flex',
  },
  nameAndSearch: {
    display: 'flex',
    [theme.breakpoints.down('xs')]: {
      display: 'initial',
    },
  },
  appName: {
    overflow: 'visible',
  },
  donations: {
    background: RELIEF_COLOR,
    borderRadius: '8px',
    display: 'block',
    marginLeft: '16px',
    padding: '6px 8px',
    textAlign: 'center',

    '&:hover': {
      color: theme.palette.primary.light,
      filter: `drop-shadow(0 0 2px ${fade(RELIEF_COLOR, 0.95)})`,
      textDecoration: 'none',
      transform: 'translateY(-1px)',
    },
  },
  expander: {
    flexGrow: 1,
  },
  socialButtons: {
    fontSize: '1.5625em',
    lineHeight: '1em',
    whiteSpace: 'nowrap',
    '& > *': {
      marginLeft: '4px',
      verticalAlign: 'middle',
    }
  },
  socialButton: {
    '&:hover': {
      filter: `drop-shadow(0 0 2px ${fade(RELIEF_COLOR, 0.95)})`,
      transform: 'translateY(-1px)',
    },
  },
  actions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    textAlign: 'end',

    [theme.breakpoints.down('xs')]: {
      display: 'initial',
      '& > *': {
        margin: '4px 0',
      },
    },
  },
}));

const AppBar = (props) => {
  const classes = useAppBarStyles();
  const theme = useTheme();

  return (
    <MaterialAppBar position="relative">
      <Toolbar className={classes.appBar}>
        <div className={classes.nameAndSearch}>
          <Typography noWrap className={classes.appName} variant="h6">
            COVID-19.direct
          </Typography>
          <SearchInput />
        </div>

        <div className={classes.expander} />

        <div className={classes.actions}>
          <SocialMediaButtons
              backgroundColor="#fff"
              buttonClassName={classes.socialButton}
              className={classes.socialButtons}
              iconColor={theme.palette.primary.main}
          />

          <DonateLink className={classes.donations} message="Buy us a coffee!" />
        </div>
      </Toolbar>
    </MaterialAppBar>
  );
};

const useTitleStyles = makeStyles(theme => ({
  noOverflow: {
    overflow: 'hidden',
  },
  container: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0 -12px',
    width: 'calc(100% - 24px)',
  },
  node: {
    margin: '0 12px 16px 12px',
  },
  text: {
    padding: '0 8px',
    marginLeft: '-8px',
    marginRight: '8px',
  },
  parentLink: {
    borderRadius: '8px',
    color: fade(theme.palette.text.primary, 0.5),
    textDecoration: 'none',
    '&:hover': {
      background: '#efefef',
    },
  },
  numbers: {
    color: theme.palette.text.secondary,
    display: 'flex',
    flexWrap: 'wrap',

    [theme.breakpoints.down('xs')]: {
      display: 'initial',
    },
  },
  number: {
    borderLeft: '2px solid',
    borderTop: '2px solid',
    flexGrow: 1,
    padding: '4px 0 4px 4px',
    '&:not(:last-child)': {
      paddingRight: '4px',
    },
  },
}));

const Title = (props) => {
  const classes = useTitleStyles();

  const world = useContext(WorldContext);
  const name = world.get(props.path, NameComponent);
  if (!name) {
    return <></>;
  }

  const names = [{
    path: props.path,
    text: <span className={classes.text}>{name.english()}</span>,
  }];

  let parentCursor = props.path.parent();
  while (parentCursor) {
    const parentName = world.get(parentCursor, NameComponent);
    if (parentName) {
      names.push({
        path: parentCursor,
        text:
            <RouterLink
                className={`${classes.text} ${classes.parentLink}`}
                to={'/country' + parentCursor.string()}>
              {parentName.english()}
            </RouterLink>,
        squish: true,
      });
    }

    parentCursor = parentCursor.parent();
  }

  for (const name of names) {
    const basic = world.get(name.path, BasicDataComponent);
    name.numbers = [
      {
        plural: 'cases',
        color: '#00aeef',
        value: basic.confirmed().lastValue(),
        change: basic.confirmed().change().lastValue(),
      },
      {
        plural: 'deaths',
        color: 'red',
        value: basic.died().lastValue(),
        change: basic.died().change().lastValue(),
      },
    ];

    if (!name.squish) {
      name.numbers.push({
        plural: 'active',
        color: 'purple',
        value: basic.active().lastValue(),
        change: basic.active().change().lastValue(),
      }, {
        plural: 'recovered',
        color: 'green',
        value: basic.recovered().lastValue(),
        change: basic.recovered().change().lastValue(),
      });
    }
  }

  return (
    // noOverflow because we're using negative margins
    <div className={`${props.className} ${props.noOverflow}`}>
      <div className={classes.container}>
        {names.map(({path, text, numbers, squish}, i) =>
          <div
              key={path.string()}
              className={`${classes.node} ${squish ? 'squish': ''}`}>
            <Typography variant={squish ? 'subtitle1' : 'h4'}>
              {text}
            </Typography>
            <div className={classes.numbers}>
              {numbers.map(({plural, color, value, change}) =>
                value > 0 && (
                  <div
                      key={plural}
                      className={classes.number}
                      style={{borderColor: color}}>
                    {shortNumber(value)}
                    {` ${i === 0 ? plural : ''} `}
                    {change > 0 && `(+${shortNumber(change)})`}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Title.propTypes = {
  className: PropTypes.string,
  path: PropTypes.instanceOf(Path).isRequired,
};

const DailyChangeGraph = (props) => {
  const basic = props.basic;
  const serieses = [{
      series: basic.confirmed().change().smooth(),
      color: 'teal',
      trend: 'orange',
    }, {
      series: basic.confirmed().change(),
      color: '#7ed0d0',
      initial: 'off',
    }, {
      series: basic.recovered().change(),
      color: 'green',
      initial: 'off',
    }, {
      series: basic.died().change(),
      color: 'red',
    },
  ];

  const projections = props.projections;
  if (projections) {
    serieses.push({
      series: projections.confirmed().change().dropFirst(),
      color: 'gray',
      stipple: true,
    });
  }

  return (
    <AdvancedGraph
      className={props.className}
      serieses={serieses}
    />
  );
};

const DailyTotalGraph = (props) => {
  const basic = props.basic;

  return (
    <AdvancedGraph
      className={props.className}
      serieses={[{
          series: basic.confirmed(),
          color: 'teal',
          trend: 'orange',
          initial: 'off',
        }, {
          series: basic.died(),
          color: 'red',
          trend: '#ce889f',
        }, {
          series: basic.recovered(),
          color: 'green',
          trend: '#668000',
        }, {
          series: basic.active(),
          color: 'purple',
          initial: 'off',
        },
      ]}
    />
  );
};

const DoublingGraph = (props) => {
  const basic = props.basic;

  return (
    <AdvancedGraph
      className={props.className}
      serieses={[{
          series: basic.confirmed().doublingInterval(),
          color: 'teal',
          trend: '#7ed0d0',
        }, {
          series: basic.died().doublingInterval(),
          color: 'red',
          trend: '#ce889f',
        },
      ]}
    />
  );
};

