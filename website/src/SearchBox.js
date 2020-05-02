import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import Select from 'react-select';
import { useHistory } from "react-router-dom";
import { Grid } from '@material-ui/core';
import Typography from '@material-ui/core/Typography'
import { Link as MaterialLink } from '@material-ui/core';
import GpsFixedIcon from '@material-ui/icons/GpsFixed';
import { makeStyles } from '@material-ui/core/styles';
import { fetchCounty } from "./GeoLocation"
import { BrowserView, MobileView } from 'react-device-detect'
import { makeCountyFromDescription } from "./Util"

const useStyles = makeStyles(theme => ({
    button: {
        display: 'block',
        margin: '0 auto',
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    findLocation: {
        padding: 2,
        background: '#00aeef',
        borderRadius: 15,
        justifyContent: "center",
        display: "flex",
        color: "white",
    },
    link: {
        marginLeft: '1vw',
        marginRight: '1vw',
    },
    gpsIcon: {
        color: '#00aeef',
        margin: '0 auto',
        display: 'grid'
    },
}));

const SearchBox = (props) => {
    const classes = useStyles();
    const country = useContext(CountryContext);
    const counties =
        country.allStates().flatMap(s => s.allCounties()).map(county => {
            return {
                display_name: `${county.name}, ${county.state().name}`,
                county: county,
                total: county.totalConfirmed() + county.newCases(),
            };
        });
    const states = country.allStates().map(
        state => {
            return {
                display_name: `${state.name} (${state.twoLetterName})`,
                state: state,
                total: state.totalConfirmed() + state.newCases(),
            }
        });
    const metros = country.allMetros().map(
        metro => {
            return {
                display_name: `${metro.name}, ${metro.state().name}`,
                metro: metro,
                total: metro.totalConfirmed() + metro.newCases(),
            }
        });
    const search_list = counties.concat(states).concat(metros)
    let search_list_sorted = search_list.sort((a, b) => {
        let x = a.total;
        let y = b.total;
        if (!x) x = 0;
        if (!y) y = 0;

        return y - x;
    });
    let search_list_final = search_list_sorted
        .map(c => {
            return {
                label: `${c.display_name} (${c.total})`,
                value: c,
            };
        });
    const history = useHistory();
    return (
        <Grid container justify="space-evenly" alignItems="center" direction="row">
            <Grid item xl={11} md={10} sm={9} xs={8}>
                <Select
                    className="basic-single"
                    classNamePrefix="select"
                    styles={{
                        menu: provided => ({ ...provided, zIndex: 9999 })
                    }}
                    defaultValue={""}
                    placeholder={"Search for a County or a State"}
                    isDisabled={false}
                    isLoading={false}
                    isClearable={true}
                    isRtl={false}
                    isSearchable={true}
                    name="county_or_state_selection"
                    options={search_list_final}
                    onChange={param => {
                        if (param && param.value) {
                            let route;
                            if (param.value.county) {
                                route = param.value.county.routeTo();
                            } else if (param.value.metro) {
                                route = param.value.metro.routeTo();
                            } else {
                                route = param.value.state.routeTo();
                            }
                            history.push(route);
                        }
                    }}
                />
            </Grid>
            <Grid item xl={1} md={2} sm={3} xs={4}>
                <BrowserView>
                    <Typography variant="body2" className={`${classes.findLocation} ${classes.link}`}>
                        <MaterialLink target="_blank" onClick={() => findLocationAndRedirect(country, history)} className={`${classes.findLocation}`} >
                            Find My Location
                        </MaterialLink>
                    </Typography>
                </BrowserView>
                <MobileView>
                    <MaterialLink onClick={() => findLocationAndRedirect(country, history)} className={classes.gpsIcon}>
                        <GpsFixedIcon target="_blank" fontSize="large" className={classes.gpsIcon}/>
                    </MaterialLink>
                </MobileView>
            </Grid>
        </Grid>
    );
}

const findLocationAndRedirect = async (country, history) => {
    const countyDescr = await fetchCounty(true);
    const newCountyObj = makeCountyFromDescription(country, countyDescr);
    const params = new URLSearchParams(history.location.search);
    const to = newCountyObj.routeTo() + "?" + params.toString();
    history.push(to);
}

export { SearchBox }
