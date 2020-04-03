import React from 'react';
import { ResponsiveContainer, LineChart, Label, Line, ReferenceLine, ReferenceArea, YAxis, XAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import Switch from '@material-ui/core/Switch';
import Grid from '@material-ui/core/Grid';
import { scaleSymlog } from 'd3-scale';
import { DataCreditWidget } from './DataCredit';
import { datesToDays, fitExponentialTrendingLine } from './TrendFitting';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import Link from '@material-ui/core/Link';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { myShortNumber } from './Util';

const fileDownload = require('js-file-download');
const moment = require("moment");

const scale = scaleSymlog().domain([0, 'dataMax']);

const useStyles = makeStyles(theme => ({
    customtooltip: {
        backgroundColor: "#FFFFFF",
    },
    grow: {
        flex: 1,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 130,
        maxWidth: 300,
    },
}));

const CustomTooltip = (props) => {
    const classes = useStyles();
    const { active } = props;
    if (active) {
        const today = moment().format("M/D");
        const { payload, label } = props;
        let confirmed;
        let newcase;
        let death;

        payload.map(p => {
            p = p.payload;
            if ("confirmed" in p) {
                confirmed = p.confirmed;
            }
            if ("pending_confirmed" in p) {
                confirmed = p.pending_confirmed;
            }
            if ("newcase" in p) {
                newcase = p.newcase;
            }
            if ("pending_newcase" in p) {
                newcase = p.pending_newcase;
            }
            if ("pending_death" in p) {
                death = p.pending_death;
            }
            if ("death" in p) {
                death = p.death;
            }
            return null;
        });

        if (typeof payload[0] == 'undefined') {
            // This can happen when all the three lines are hidden
            return null;
        }
        let pending_help;
        if (today === payload[0].payload.name) {
            pending_help = "Last # potentially incomplete";
        }

        return (
            <div className={classes.customtooltip}>
                <Typography variant="body1" noWrap>
                    {label}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`Confirmed: ${confirmed}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {`New: ${newcase}`}
                </Typography>
                <Typography variant="body2" noWrap>
                    {pending_help}
                </Typography>
                <Typography variant="body2" noWrap>
                    Total Death: {death}
                </Typography>
            </div>
        );
    }
    return null;
}

const AntSwitch = withStyles(theme => ({
    root: {
        width: 28,
        height: 16,
        padding: 0,
        display: 'flex',
    },
    switchBase: {
        padding: 2,
        color: theme.palette.grey[500],
        '&$checked': {
            transform: 'translateX(12px)',
            color: theme.palette.common.white,
            '& + $track': {
                opacity: 1,
                backgroundColor: "#00aeef",
                borderColor: theme.palette.primary.main,
                border: `0px solid ${theme.palette.grey[500]}`,
            },
        },
    },
    thumb: {
        width: 12,
        height: 12,
        boxShadow: 'none',
    },
    track: {
        border: `1px solid ${theme.palette.grey[500]}`,
        borderRadius: 16 / 2,
        opacity: 1,
        height: "auto",
        backgroundColor: theme.palette.common.white,
    },
    checked: {},
}))(Switch);

const MENU_ITEM_HEIGHT = 48;
const MENU_ITEM_PADDING_TOP = 8;
const GraphOptionsMenuProps = {
    PaperProps: {
        style: {
            maxHeight: MENU_ITEM_HEIGHT * 4.5 + MENU_ITEM_PADDING_TOP,
            width: 150,
        },
    },
};

const daysToDoubleLabelChildren = (options) => {
    const { x, y, showlog, daysToDouble } = options;
    return [
        // Placeholder to accomodate label
        <ReferenceArea fillOpacity="0" alwaysShow x1={x} x2={x} y1={y * (showlog ? 4 : 1.1)} y2={y * (showlog ? 4 : 1.1)} />,
        <ReferenceArea fillOpacity="0" x1={x} x2={x} y1={y} y2={y}>
            <Label value={`Double every ${daysToDouble.toFixed(1)} days*`} offset={5} position="insideBottomRight" />
        </ReferenceArea>
    ];
}

const BasicGraphNewCases = (props) => {

    const classes = useStyles();
    const [state, setState] = React.useState({
        showlog: false,
        show2weeks: false,
        plusNearby: false,
        showConfirmed: true,
        showNewCase: true,
        showDeath: true,
    });

    const [open, setOpen] = React.useState(false);
    const [openDownload, setOpenDownload] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };
    const handleCloseDownload = () => {
        setOpenDownload(false);
    };

    const handleLogScaleToggle = event => {
        setState({ ...state, showlog: !state.showlog });
    };

    const handle2WeeksToggle = event => {
        setState({ ...state, show2weeks: !state.show2weeks });
    };

    let graphOptions = [
        { name: 'Total', value: state.showConfirmed },
        { name: 'New', value: state.showNewCase },
        { name: 'Death', value: state.showDeath },
    ];

    const handleGraphOptionsChange = event => {
        let selected = event.target.value;
        setState({
            ...state,
            showConfirmed: selected.includes('Total'),
            showNewCase: selected.includes('New'),
            showDeath: selected.includes('Death'),
        });
    };

    let data = props.data;
    data = data.map(d => {
        d.name = moment(d.fulldate, "MM/DD/YYYY").format("M/D");
        return d;
    });

    let newdata = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (i === 0) {
            item.newcase = data[i].confirmed;
        } else {
            item.newcase = data[i].confirmed - data[i - 1].confirmed;
        }
        newdata.push(item)
    }
    data = newdata;

    if (data.length > 2) {
        let newdata = data.slice(0, data.length - 2);
        let second_last = data[data.length - 2];
        let last = data[data.length - 1];
        second_last.pending_confirmed = second_last.confirmed;
        second_last.pending_newcase = second_last.newcase;
        second_last.pending_death = second_last.death;
        let newlast = {
            name: last.name,
            fulldate: moment().format("MM/DD/YYYY"),
            pending_confirmed: last.confirmed,
            pending_newcase: last.newcase,
            pending_death: last.death,
        };
        newdata.push(second_last);
        newdata.push(newlast);
        data = newdata;
    }

    /**
     * Add Trending Line
     */
    const startDate = data[0].name;
    const dates = data.map(d => d.name);
    const daysFromStart = datesToDays(startDate, dates);
    const confirmed = data.map(d => d.confirmed);
    const results = fitExponentialTrendingLine(daysFromStart, confirmed, 10);
    let daysToDouble = null;
    let lastTrendingData = null;
    if (results != null) {
        data = data.map((d, idx) => {
            d.trending_line = results.fittedYs[idx];
            return d;
        });
        daysToDouble = results.daysToDouble;
        lastTrendingData = data[data.length - 1];
    }

    if (state.show2weeks) {
        const cutoff = moment().subtract(14, 'days')
        data = data.filter(d => {
            return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
        });
    } else {

        const cutoff = moment().subtract(30, 'days')
        data = data.filter(d => {
            return moment(d.fulldate, "MM/DD/YYYY").isAfter(cutoff)
        });
    }

    const formatYAxis = (tickItem) => {
        return myShortNumber(tickItem);
    }

    data = data.sort((a, b) => moment(a.fulldate, "MM/DD/YYYY").isAfter(moment(b.fulldate, "MM/DD/YYYY")));

    /**
     * Vertical reference lines.
     * Example usage:
     *     let vRefLines = [
     *         {date: '3/20', label: 'shelter in place'},
     *         {date: '3/25', label: 'some other event'},
     *     ];
     *     <BasicGraphNewCases vRefLines={vRefLines} .../>
     */
    let vRefLines = (typeof props.vRefLines == 'undefined') ?
        null :
        props.vRefLines.map((l, idx) =>
            <ReferenceLine key={`vrefline${idx}`} x={l.date} label={{ value: l.label, fill: '#b3b3b3' }} stroke="#e3e3e3" strokeWidth={3} />
        )

    /**
     * Horizontal reference lines.
     * Example usage:
     *     let hRefLines = [
     *         {y: '100', label: '# ventilators'},
     *         {y: '1000', label: '# beds'},
     *     ];
     *     <BasicGraphNewCases hRefLines={hRefLines} .../>
     */
    let hRefLines = (typeof props.hRefLines == 'undefined') ?
        null :
        props.hRefLines.map((l, idx) =>
            <ReferenceLine key={`hrefline${idx}`} y={l.y} label={l.label} stroke="#e3e3e3" strokeWidth={2} />
        )

    return <>
        <Grid container alignItems="center" spacing={1}>
            <Grid item>
                <AntSwitch checked={state.showlog} onClick={handleLogScaleToggle} />
            </Grid>
            <Grid item onClick={handleLogScaleToggle}>
                <Typography>
                    Log
                </Typography>
            </Grid>
            <Grid item></Grid>

            <Grid item>
                <AntSwitch checked={state.show30days} onClick={handle2WeeksToggle} />
            </Grid>
            <Grid item onClick={handle2WeeksToggle}>
                <Typography>
                    2 weeks
                </Typography>
            </Grid>
            <Grid item></Grid>
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle id="alert-dialog-title">{"Data Credit"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <DataCreditWidget></DataCreditWidget>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary" autoFocus>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
            <Grid item xs></Grid>

            <Grid item>
                <FormControl size="medium" className={classes.formControl}>
                    <Select
                        id="new-case-graph-options-checkbox"
                        multiple
                        value={graphOptions.filter(o => o.value).map(o => o.name)}
                        onChange={handleGraphOptionsChange}
                        input={<Input />}
                        renderValue={selected => 'Lines'}
                        MenuProps={GraphOptionsMenuProps}
                    >
                        {graphOptions.map((option) => (
                            <MenuItem key={option.name} value={option.name}>
                                <Checkbox checked={option.value} />
                                <ListItemText primary={option.name} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
        <ResponsiveContainer height={300} >
            <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
                <Tooltip content={<CustomTooltip />} />
                <XAxis dataKey="name" />
                {
                    state.showlog ?
                        <YAxis yAxisId={0} scale={scale} /> :
                        <YAxis yAxisId={0} tickFormatter={formatYAxis} />
                }

                <CartesianGrid stroke="#d5d5d5" strokeDasharray="5 5" />
                {state.showConfirmed && <Line type="monotone" dataKey="trending_line" stroke="#9c9c9c" yAxisId={0} dot={false} isAnimationActive={false} strokeWidth={2} />}
                {state.showConfirmed && <Line type="monotone" dataKey="confirmed" stroke="#ff7300" yAxisId={0} strokeWidth={2} />}
                {state.showConfirmed && <Line type="monotone" dataKey="pending_confirmed" stroke="#ff7300" strokeDasharray="1 1" strokeWidth={2} />}

                {state.showNewCase && <Line type="monotone" dataKey="newcase" stroke="#387908" yAxisId={0} strokeWidth={2} />}
                {state.showNewCase && <Line type="monotone" dataKey="pending_newcase" stroke="#387908" strokeDasharray="1 1" strokeWidth={2} />}

                {state.showDeath && <Line type="monotone" dataKey="death" stroke="#000000" yAxisId={0} strokeWidth={3} />}
                {state.showDeath && <Line type="monotone" dataKey="pending_death" stroke="#000000" strokeDasharray="1 1" strokeWidth={2} />}
                <Line visibility="hidden" dataKey="pending_death" />

                {vRefLines}
                {hRefLines}

                {state.showConfirmed && lastTrendingData != null && daysToDoubleLabelChildren({
                    x: lastTrendingData.name,
                    y: lastTrendingData.trending_line,
                    daysToDouble,
                    showlog: state.showlog
                }
                )}

                <Legend verticalAlign="top" payload={[
                    { value: 'Total ', type: 'line', color: '#ff7300' },
                    { value: 'New Cases', type: 'line', color: '#389708' },
                    { value: 'Death', type: 'line', color: '#000000' },
                ]} />

            </LineChart></ResponsiveContainer>

        <Grid container direction="column" spacing={1}>
            <Grid item>
                <Grid container alignItems="center" spacing={1}>
                    <Grid item onClick={handleClickOpen} >
                        <Typography variant="body2" noWrap>
                            Data Credit: Click for details.
                        </Typography>
                    </Grid>
                    <Grid item>
                    </Grid>
                    <Grid item className={classes.grow} />
                    <Grid item onClick={
                        () => {
                            fileDownload(JSON.stringify(data, 2, 2), "covid-data.json");
                            setOpenDownload(true);
                        }
                    }>
                        <Typography variant="body2" noWrap>
                            Data Download
                        </Typography>
                    </Grid>
                    <Dialog
                        open={openDownload}
                        onClose={handleCloseDownload}
                    >
                        <DialogTitle id="alert-dialog-title">{"Download Complete"}</DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                Disclaimer: The format data likely to change over time.
                                </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDownload} color="primary" autoFocus>
                                OK
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Grid>
            </Grid>
            <Grid item>
                <Box component="span" fontSize={12} lineHeight="normal" display="block">
                    * Trend fitted with
                    <Link href="https://simplestatistics.org/docs/#linearregression" target="blank"> linear regression </Link>
                    on log₂ of cases last 7 days

                </Box>
            </Grid>
        </Grid>
    </>
}

export { BasicGraphNewCases, AntSwitch };
