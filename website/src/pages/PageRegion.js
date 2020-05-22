import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { Chip, Paper, Typography } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MaterialLink } from '@material-ui/core';
import { Redirect, withRouter } from 'react-router-dom';
import { fade, makeStyles } from '@material-ui/core/styles';
import { AdvancedGraph } from '../components/graphs/AdvancedGraph';
import { AppBar } from '../components/chrome/AppBar';
import { BasicDataComponent } from '../models/BasicDataComponent';
import { Discussion } from '../components/chrome/Discussion';
import { DivisionTab } from '../components/tables/DivisionTable';
import { DivisionTypesComponent } from '../models/DivisionTypesComponent';
import { ChildrenComponent } from '../models/ChildrenComponent';
import { Footer } from '../Footer';
import { GeographyComponent } from '../models/GeographyComponent';
import { NameComponent } from '../models/NameComponent';
import { Path } from '../models/Path';
import { ProjectionsComponent } from '../models/ProjectionsComponent';
import { SearchInput } from '../components/chrome/SearchInput';
import { WorldContext } from '../WorldContext';
import { MapUS } from "../MapUS"
import { myShortNumber } from "../Util.js";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import moment from 'moment';

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

        <Graphs className={classes.section} path={path} />
        {
          showMap &&
          <MapWorld source={basic} geography={geography} />
        }

        <a href="#division" name="division" >
        </a>
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
  return <RouterLink className={`${classes.tag} ${selected ? classes.tagSelected : ''}`} href={routeTo} to={routeTo}>
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

const useGraphStyles = makeStyles(theme => ({
  graph: {
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: '4px',
    padding: '8px',
  },
  comparisons: {
    alignItems: 'center',
    display: 'flex',
    margin: theme.spacing(1, 0),
  },
  comparisonSearch: {
    backgroundColor: theme.palette.action.hover,
    margin: theme.spacing(0, 2),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  chip: {
    margin: theme.spacing(0, 1),
  },
}));

const Graphs = (props) => {
  const classes = useGraphStyles();
  const world = useContext(WorldContext);
  const basic = world.get(props.path, BasicDataComponent);

  const [comparingWith, setComparingWith] = React.useState(() => []);
  const addComparison = (path) => {
    const name = world.get(path, NameComponent);
    const basic = world.get(path, BasicDataComponent);
    setComparingWith(comparingWith.concat([{
      path,
      name,
      basic,
    }]));
  };
  const removeComparison = (i) => {
    const copied = [...comparingWith];
    copied.splice(i, 1);
    setComparingWith(copied);
  };

  return (
    <div className={props.className}>
      <div className={classes.comparisons}>
        <Typography>Compare with: </Typography>
        <SearchInput
          className={classes.comparisonSearch}
          onChoice={addComparison}
        />
        {comparingWith.map(({ path, name }, i) => {
          return (
            <Chip
              key={path.string()}
              className={classes.chip}
              onDelete={() => removeComparison(i)}
              label={name.english()}
            />
          );
        })}
      </div>

      {/* {[DailyChangeGraph, DailyTotalGraph, DoublingGraph].map((Graph, i) => ( */}
      {[DailyChangeGraph].map((Graph, i) => (
        <Graph
          key={i}
          basic={basic}
          comparingWith={comparingWith}
          className={classes.graph}
        />
      ))}
    </div>
  );
};

const baseToggleButtonStyles = {
  height: 'initial',
  textTransform: 'initial',
};

const useLegendStyles = makeStyles(theme => ({
  serieses: {
    border: `1px solid ${fade(theme.palette.action.active, 0.12)}`,
    display: 'flex',
    flexWrap: 'wrap',
    maxWidth: '500px',
  },
  series: {
    border: 'none',
    color: fade(theme.palette.action.active, 0.12),
    '&.selected': {
      backgroundColor: 'initial',
      color: fade(theme.palette.action.active, 0.8),
      fontWeight: 'initial',
    },
    ...baseToggleButtonStyles,
  },
  icon: {
    paddingRight: '4px',
  },
}));

const Legend = (props) => {
  const classes = useLegendStyles();
  console.log(props.spec)
  return (
    <ToggleButtonGroup
      exclusive={true}
      value={props.selected}
      onChange={(event, desired) => props.onChange(desired)}
      className={classes.serieses}>
      {props.spec.map(series => {
        console.log(series.key);
        return <ToggleButton
          key={series.key}
          value={series.key}
          classes={{ root: classes.series, selected: 'selected' }}>
          {series.series.label_}
        </ToggleButton>
      }
      )}
    </ToggleButtonGroup>
  );
};


const DailyChangeGraph = (props) => {
  const basic = props.basic;
  const isCompareMode = props.comparingWith.length > 0;
  const serieseDef = [
    {
      seriesGen: (source) => source.confirmed().change(),
      color: '#7ed0d0',
      key: "confirm",
    },
    {
      seriesGen: (source) => source.confirmed().fitVirusCV19Prediction().change().dropFirst(),
      color: 'pink',
      key: "trend",
    },
    {
      seriesGen: (source) => source.recovered().change(),
      color: 'green',
      key: "recovery",
    },
    {
      seriesGen: (source) => source.died().change(),
      color: 'red',
      key: "death",
    },
  ];

  let t0point = basic.confirmed().pointLargerEqualThan(100);

  const serieses = serieseDef.map(s => {
    let series = s.seriesGen(basic);
    if (t0point) {
      series.setT0(t0point[0].unix())
    }
    return {
      ...s,
      series: series,
    }
  })

  let graphSeries = serieses.map(s => s);

  const [selected, setSelected] = React.useState(serieses[0].key);

  let compareSeriesSelector = null;

  if (isCompareMode) {
    compareSeriesSelector =
      <Legend
        spec={serieses}
        selected={selected}
        onChange={setSelected}
      />
    const colors = [
      '#7ed0d0',
      'pink',
      'green',
      'red',
      'purple',
      'black',
    ];
    let colorIndex = 0;
    graphSeries = serieses.filter(s => {
      return s.key === selected;
    });
    for (const { name, basic } of props.comparingWith) {
      basic.confirmed().points();
      let t0point = basic.confirmed().pointLargerEqualThan(100);
      let series = serieseDef.find(s => s.key === selected).seriesGen(basic).suffixLabel(`(${name.english()})`);
      if (t0point) {
        series.setT0(t0point[0].unix())
      }
      graphSeries.push({
        series: series,
        color: colors[colorIndex++],
        stipple: true,
      });
    }
  }

  return (
    <div>
      {compareSeriesSelector}
      <AdvancedGraph
        className={props.className}
        serieses={graphSeries}
        alignT0={true}
      />
    </div>
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
