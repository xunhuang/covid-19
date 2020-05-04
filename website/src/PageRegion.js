import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {Link as MaterialLink, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';
import {fade, makeStyles} from '@material-ui/core/styles';
import {withRouter} from 'react-router-dom';

import {AdvancedGraph} from './graphs/AdvancedGraph';
import {BasicDataComponent} from './models/BasicDataComponent';
import {ChildrenComponent} from './models/ChildrenComponent';
import {DivisionTypesComponent} from './models/DivisionTypesComponent';
import {NameComponent} from './models/NameComponent';
import {Path} from './models/Path';
import {WorldContext} from './WorldContext';

const shortNumber = require('short-number');

const HORIZONTAL_MARGIN = '16px';

const useStyles = makeStyles(theme => ({
  body: {
    background: '#fafafa',
    padding: HORIZONTAL_MARGIN,
  },
  appBar: {
    backgroundColor: theme.palette.secondary.main,
    padding: `${HORIZONTAL_MARGIN} calc(${HORIZONTAL_MARGIN} * 2)`,
  },
  appTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: HORIZONTAL_MARGIN,
  },
  section: {
    margin: '16px 0 24px 0',
  },
  graph: {
    border: '1px solid',
    borderColor: theme.palette.divider,
    borderRadius: '4px',
    padding: '8px',
  },
}));

export const PageRegion = withRouter((props) => {
  const world = useContext(WorldContext);
  const path = Path.parse('/' + props.match.params[0]);

  const basic = world.get(path, BasicDataComponent);
  const divisions = world.get(path, DivisionTypesComponent);

  const classes = useStyles();
  return (
    <>
      <div className={classes.appBar}>
        <Typography variant="h6" className={classes.appTitle}>
          COVID-19.direct
        </Typography>
      </div>
      <div className={classes.body}>
        <Paper className={classes.content}>
          <Title className={classes.section} path={path} />

          <AdvancedGraph
            className={`${classes.section} ${classes.graph}`}
            serieses={[{
                series: basic.confirmed().change(),
                color: 'teal',
                trend: 'orange',
              }, {
                series: basic.confirmed(),
                color: 'gray',
                initial: 'off',
              }, {
                series: basic.active(),
                color: 'pink',
                initial: 'off',
              }, {
                series: basic.recovered(),
                color: 'green',
                initial: 'off',
              }, {
                series: basic.died().change(),
                color: 'purple',
              }, {
                series: basic.died(),
                color: 'red',
                initial: 'off',
              },
            ]}
          />

          {divisions &&
            divisions.types().map(({id, plural}) =>
              <Division
                  key={id}
                  id={id}
                  plural={plural}
                  parent={path}
                  className={classes.section}
              />
            )}
        </Paper>
      </div>
    </>);
});

const useTitleStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  node: {
    marginBottom: '16px',
    marginRight: '24px',
  },
  parentLink: {
    borderRadius: '8px',
    color: fade(theme.palette.text.primary, 0.5),
    padding: '0 4px',
    textDecoration: 'none',
    '&:hover': {
      background: '#efefef',
    }
  },
  numbers: {
    color: theme.palette.text.secondary,
    display: 'flex',
  },
  number: {
    borderTop: '2px solid',
    flexGrow: 1,
    paddingTop: '4px',
    '&:not(:first-child)': {
      paddingLeft: '4px',
    },
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
    text: name.english(),
  }];

  let parentCursor = props.path.parent();
  while (parentCursor) {
    const parentName = world.get(parentCursor, NameComponent);
    if (parentName) {
      names.push({
        path: parentCursor,
        text:
            <RouterLink
                className={classes.parentLink}
                to={'/country' + parentCursor.string()}>
              {parentName.english()}
            </RouterLink>,
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
  }

  return (
    <div className={`${classes.container} ${props.className}`}>
      {names.map(({path, text, numbers}, i) =>
        <div key={path.string()} className={classes.node}>
          <Typography variant="h4">{text}</Typography>
          <div className={classes.numbers}>
            {numbers.map(({plural, color, value, change}) =>
              <div
                  key={plural}
                  className={classes.number}
                  style={{borderColor: color}}>
                {shortNumber(value)}
                {i === 0 && ` ${plural} `}
                (+{shortNumber(change)})
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Title.propTypes = {
  className: PropTypes.string,
  path: PropTypes.instanceOf(Path).isRequired,
};

const Division = (props) => {
  const world = useContext(WorldContext);
  const children =
      world.get(
              props.id ? props.parent.child(props.id) : props.parent,
              ChildrenComponent)
          .children();
  const rows = [];
  for (const child of children) {
    const [name, basic] =
        world.getMultiple(child, [NameComponent, BasicDataComponent]);
    if (!name || !basic) {
      continue;
    }

    rows.push({
      path: child,
      name: name.english(),
      data: basic,
    });
  }

  const classes = useStyles();
  return (
    <div className={props.className}>
      <Typography variant="h6">{props.plural}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Confirmed</TableCell>
            <TableCell>New</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>Recovered</TableCell>
            <TableCell>Died</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({path, name, data}) => (
            <TableRow key={name}>
              <TableCell>
                <MaterialLink component={RouterLink} to={'/country' + path.string()}>
                  {name}
                </MaterialLink>
              </TableCell>
              <TableCell>{data.confirmed().lastValue()}</TableCell>
              <TableCell>{data.confirmed().change().today()}</TableCell>
              <TableCell>{data.active().lastValue()}</TableCell>
              <TableCell>{data.recovered().lastValue()}</TableCell>
              <TableCell>{data.died().lastValue()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

Division.propTypes = {
  id: PropTypes.string.isRequired,
  plural: PropTypes.string.isRequired,
  parent: PropTypes.instanceOf(Path).isRequired,
  className: PropTypes.string,
};
