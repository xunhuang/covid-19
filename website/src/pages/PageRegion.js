import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { AppBar as MaterialAppBar, Paper, Toolbar, Typography } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MaterialLink } from '@material-ui/core';
import { Redirect, withRouter } from 'react-router-dom';
import { fade, makeStyles, useTheme } from '@material-ui/core/styles';

import { AdvancedGraph } from '../components/graphs/AdvancedGraph';
import { BasicDataComponent } from '../models/BasicDataComponent';
import { Discussion } from '../components/chrome/Discussion';
import { DivisionTab } from '../components/tables/DivisionTable';
import { DivisionTypesComponent } from '../models/DivisionTypesComponent';
import { ChildrenComponent } from '../models/ChildrenComponent';
import { DonateLink } from '../components/chrome/DonateLink';
import { Footer } from '../Footer';
import { GeographyComponent } from '../models/GeographyComponent';
import { NameComponent } from '../models/NameComponent';
import { Path } from '../models/Path';
import { ProjectionsComponent } from '../models/ProjectionsComponent';
import { SearchInput } from '../components/chrome/SearchInput';
import { SocialMediaButtons } from '../components/chrome/SocialMediaButtons';
import { WorldContext } from '../WorldContext';
import { MapUS } from "../MapUS"
import { myShortNumber } from "../Util.js";

const shortNumber = require('short-number');

const HORIZONTAL_MARGIN = '16px';
const NEARBY_TO_SHOW = 10;

const useStyles = makeStyles(theme => ({
  body: {
    background: '#fafafa',
  },
  content: {
    padding: HORIZONTAL_MARGIN,
    //margin: HORIZONTAL_MARGIN,
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
  tag: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "column",
    textAlign: "center",
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    flexGrow: "1",
    margin: 3,
    color: "black",
    textDecoration: "none",
  },
  tagSelected: {
    color: "#FFFFFF",
    backgroundColor: "#00aeef",
  },
  tagTitle: {
    marginTop: 5,
  },
  tagSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    alignContent: "flex-end",
  },
  topTag: {
    fontSize: "0.5rem",
  },
  smallTag: {
    fontSize: "0.5rem",
  },
  mainTag: {
    fontSize: "1.0rem",
  },
  grow: {
    flexGrow: 1,
  },
  row: {
    padding: theme.spacing(1, 1),
    justifyContent: "space-between",
    display: "flex",
  },
  rowNoBeds: {
    justifyContent: "center",
  },
}));

const MapWorld = withRouter((props) => {
  return <MapUS  {...props} />;
});

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

  const [basic, divisions, geography] =
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
  const showMap = geography || !parentDivision;

  return (
    <div className={classes.body}>
      <AppBar />

      <Paper className={classes.content}>
        <Title className={classes.section} path={path} />
        <LocationSummaryTitle className={classes.section} path={path} />

        {
          showMap &&
          <MapWorld source={basic} geography={geography} />
        }

        {[DailyChangeGraph, DailyTotalGraph, DoublingGraph].map((Graph, i) => (
          <Graph
            key={i}
            basic={basic}
            // projections={projections}
            className={`${classes.section} ${classes.graph}`}
          />
        ))}

        <a name="division" />
        {divisions &&
          divisions.types().map(({ id, plural }) =>
            <DivisionTab
              key={id}
              plural={plural}
              parent={id ? path.child(id) : path}
              className={classes.section}
            />
          )}

        {showNearby &&
          <DivisionTab
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
    alignItems: 'center',
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
    flexShrink: 2,
    justifyContent: 'flex-end',
    textAlign: 'end',
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
          <SearchInput className={classes.expander} />
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
  tagSticky: {
    backgroundColor: "#FFFFFF",
    position: "sticky",
    top: 0,
    left: 0,
    zIndex: "1",
  },
  tagContainer: {
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'nowrap',
    // margin: '0 -12px', // ??
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

const Tag = withRouter((props) => {
  let title = props.title;

  const routeTo = props.link;
  const selected = props.selected; // match.url === routeTo;
  const confirmNumbers = props.numbers.find(s => s.plural === "cases");
  const confirmed = confirmNumbers.value;
  const confirmedNew = confirmNumbers.change;

  const deathsNumbers = props.numbers.find(s => s.plural === "deaths");
  const deaths = deathsNumbers.value;
  const deathsNew = deathsNumbers.change;

  const classes = useStyles();
  return <RouterLink className={`${classes.tag} ${selected ? classes.tagSelected : ''}`} to={routeTo}>
    <div className={classes.tagTitle}> {title} </div>
    <div className={`${classes.row} `} >
      <section className={classes.tagSection}>
        <div className={classes.topTag}>
          +{myShortNumber(confirmedNew)}
        </div>
        <div className={classes.mainTag}>
          {myShortNumber(confirmed)} </div>
        <div className={classes.smallTag}>
          Confirmed </div>
      </section>
      <section className={classes.tagSection}>
        <div className={classes.topTag}>
          +{myShortNumber(deathsNew)}
        </div>
        <div className={classes.main1GTag}>
          {myShortNumber(deaths)} </div>
        <div className={classes.smallTag}>
          Deaths </div>
      </section>
    </div>
  </RouterLink>;
});

const AprilTitle = (props) => {
  const names = props.names;
  const classes = useTitleStyles();
  return (
    // noOverflow because we're using negative margins
    <div className={`${props.className} ${props.noOverflow}`}>
      <div className={classes.container}>
        {names.map(({ path, text, numbers, squish, link }, i) =>
          <div
            key={path.string()}
            className={`${classes.node} ${squish ? 'squish' : ''}`}>
            <Typography variant={squish ? 'subtitle1' : 'h4'}>
              <RouterLink
                className={`${classes.text} ${classes.parentLink}`}
                to={link}>
                {text}
              </RouterLink>
            </Typography>
            <div className={classes.numbers}>
              {numbers.map(({ plural, color, value, change }) =>
                value > 0 && (
                  <div
                    key={plural}
                    className={classes.number}
                    style={{ borderColor: color }}>
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
}

const WilsonTitle = (props) => {
  const classes = useTitleStyles();
  const tagclasses = useStyles();
  const world = useContext(WorldContext);
  const names = props.names;
  const divisions = world.get(props.path, DivisionTypesComponent);
  const first = divisions && divisions.types()[0];
  const children =
      first && world.get(
          first.id ? props.path.child(first.id) : props.path,
          ChildrenComponent);

  return (
    <div className={classes.tagSticky} >
      <div className={classes.tagContainer}>
        {
          first && children &&
          <MaterialLink className={tagclasses.tag} href="#division">
            <div className={tagclasses.tagTitle}> Dive in </div>
            <div className={`${tagclasses.row} ${tagclasses.rowNoBeds}`} >
              <section className={tagclasses.tagSection}>
                <div className={tagclasses.topTag}>
                </div>
                <div className={tagclasses.mainTag}>
                  {children.children().length}
                </div>
                <div className={tagclasses.smallTag}>
                  {first.plural}
                </div>
              </section>
            </div>
          </MaterialLink>
        }
        {names.map(({ path, text, numbers, squish, link }, i) =>
          <Tag
            key={path.string()}
            title={text}
            selected={!squish}
            numbers={numbers}
            link={link}
          >
          </Tag>
        )}
      </div>
    </div>
  );
}

function getNames(world, path) {
  const name = world.get(path, NameComponent);
  if (!name) {
    return "";
  }

  const names = [{
    path: path,
    text: name.english(),
  }];

  let parentCursor = path.parent();
  while (parentCursor) {
    const parentName = world.get(parentCursor, NameComponent);
    if (parentName) {
      names.push({
        path: parentCursor,
        text: parentName.english(),
        link: '/country' + parentCursor.string(),
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
  return names;
};

const Title = (props) => {
  const world = useContext(WorldContext);
  const names = getNames(world, props.path);

  // return <AprilTitle names={names} />;
  return <WilsonTitle names={names} path={props.path} />;
};

const useSummaryStyle = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: "space-around",
  },
  aspect: {
    flexDirection: "column",
    display: 'flex',
    flexWrap: 'wrap',
    padding: '4px',
    margin: '5px 5px',
    flexGrow: 1,
    overflow: 'hidden',
  },
  innerDiv: {
    flexDirection: "column",
    alignContent: 'center',
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    // padding: '4px',
    // margin: '5px 5px',
    flexGrow: 1,
  },
  label: {
    fontSize: '.7em',
  },
  total: {
    flexGrow: 1,
    fontSize: '1.1em',
  },
  change: {
    flexGrow: 1,
    fontSize: '0.5em',
    minHeight: "0.5em"
  },
}));

const LocationSummaryTitle = (props) => {
  const world = useContext(WorldContext);
  const names = getNames(world, props.path);

  const numbers = names[0].numbers;
  const classes = useSummaryStyle();

  return (
    <div className={classes.container}>
      {numbers.map(({ plural, color, value, change }) =>
        value > 0 && (
          <Paper className={classes.aspect} >
            <div className={classes.innerDiv} style={{ color: color }}>
              <div className={classes.change}>
                {change > 0 && `+${shortNumber(change)}`}
              </div>
              <div className={classes.total}>
                {shortNumber(value)}
              </div>
              <div className={classes.label}>
                {plural}
              </div>
            </div>
          </Paper>
        )
      )}
    </div>
  );
};

Title.propTypes = {
  className: PropTypes.string,
  path: PropTypes.instanceOf(Path).isRequired,
};

const DailyChangeGraph = (props) => {
  const basic = props.basic;
  const serieses = [
    {
      series: basic.confirmed().change(),
      color: '#7ed0d0',
    },
    {
      series: basic.confirmed().fitVirusCV19Prediction().change(),
      color: 'pink',
    },
    {
      series: basic.recovered().change(),
      color: 'green',
    },
    {
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
      }, {
        series: basic.confirmed().fitVirusCV19Prediction(),
        color: 'pink',
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
