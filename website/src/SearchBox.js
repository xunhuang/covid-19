import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import Select from 'react-select';
import { useHistory } from "react-router-dom";
import { Grid } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography'
import { Link as MaterialLink } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

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
}));

const SearchBox = (props) => {
    const classes = useStyles();
    const consumedCountryState = useContext(CountryContext);
    const country = consumedCountryState.country;
    const myCounty = consumedCountryState.county;
    const myState = consumedCountryState.state;
    console.log(myCounty)
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
            <Grid item md={10} sm={9} xs={8}>
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
            <Grid item md={2} sm={3} xs={4}>
                <Typography noWrap variant="body2" className={`${classes.findLocation} ${classes.link}`}>
                    <MaterialLink target="_blank" onClick={() => findLocationAndRedirect(consumedCountryState, history)} className={`${classes.findLocation}`} >
                        Find My Location
                    </MaterialLink>
                </Typography>
            </Grid>
        </Grid>
    );
}

const findLocationAndRedirect = (consumedCountryState, history) => {
    consumedCountryState.updateCountry(true, (newState) => {
        console.log("new state:")
        console.log(newState);
        let destination;
        if (newState.county) {
            destination = newState.county
        } else if (newState.state) {
            destination = newState.state
        } else {
            destination = newState.country
        }
        const params = new URLSearchParams(history.location.search);
        const to = destination.routeTo() + "?" + params.toString();
        history.push(to);
    })
    console.log("sent update")
}

export { SearchBox }
