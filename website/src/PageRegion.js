import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {Link as MaterialLink, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography} from '@material-ui/core';
import {Link as RouterLink} from 'react-router-dom';
import {makeStyles} from '@material-ui/core/styles';
import {withRouter} from 'react-router-dom';

import {AdvancedGraph} from './graphs/AdvancedGraph';
import {BasicDataComponent} from './models/BasicDataComponent';
import {ChildrenComponent} from './models/ChildrenComponent';
import {DivisionTypesComponent} from './models/DivisionTypesComponent';
import {NameComponent} from './models/NameComponent';
import {Path} from './models/Path';
import {WorldContext} from './WorldContext';

const useStyles = makeStyles(theme => ({
  body: {
    margin: '8px',
  },
  section: {
    margin: '16px',
    padding: '8px',
  },
}));

export const PageRegion = withRouter((props) => {
  const world = useContext(WorldContext);
  const path = Path.parse('/' + props.match.params[0]);

  const name = world.get(path, NameComponent);
  const basic = world.get(path, BasicDataComponent);
  const divisions = world.get(path, DivisionTypesComponent);

  const namedParents = [];
  let parentCursor = path.parent();
  while (parentCursor) {
    const parentName = world.get(parentCursor, NameComponent);
    if (parentName) {
      namedParents.push({
        name: parentName.english(),
        path: parentCursor,
      });
    }

    parentCursor = parentCursor.parent();
  }

  const classes = useStyles();
  return (
		<div className={classes.body}>
      {name &&
          <Typography variant="h4">
            {name.english()}{namedParents.map(({name, path}) =>
                <span key={name}>
                  {', '}
                  <MaterialLink component={RouterLink} to={'/country' + path.string()}>
                    {name}
                  </MaterialLink>
                </span>
            )}
          </Typography>}

      <Paper className={classes.section}>
        <AdvancedGraph
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
      </Paper>

      {divisions &&
        divisions.types().map(({id, plural}) =>
          <Division key={id} id={id} plural={plural} parent={path} />
        )}
    </div>);
});

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
    <>
      <Typography variant="h6">{props.plural}</Typography>
      <Paper className={classes.section}>
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
      </Paper>
    </>
  );
};

Division.propTypes = {
  id: PropTypes.string.isRequired,
  plural: PropTypes.string.isRequired,
  parent: PropTypes.instanceOf(Path).isRequired,
};
