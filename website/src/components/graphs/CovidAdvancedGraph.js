import PropTypes from 'prop-types';
import React from 'react';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { LineChart, ReferenceLine, Label, Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fade, makeStyles } from '@material-ui/core/styles';
import { scaleSymlog } from 'd3-scale';
import { myShortNumber } from '../../Util';
import { AdvancedGraph } from "./AdvancedGraph"

import { DataSeries } from '../../models/DataSeries';
const moment = require('moment');

const baseToggleButtonStyles = {
  height: 'initial',
  textTransform: 'initial',
};

export const CovidAdvancedGraph = (props) => {
  const newSeries = [];
  for (const s of props.serieses) {
    if (s.lastDayIncomplete) {
      let main = {
        ...s,
        series: s.series.dropLastPoint(),
        stipple: false,
        lastDayIncomplete: undefined,
      };
      let last = {
        ...s,
        series: s.series.last2PointSeries().suffixLabel("incomplete"),
        stipple: true,
        lastDayIncomplete: undefined,
      }
      newSeries.push(main);
      newSeries.push(last);

      console.log(last);
      console.log(main);
    } else {
      newSeries.push(s);
    }
  }

  return <AdvancedGraph {...props} serieses={newSeries} />
}
