import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import Select from 'react-select';
import { useHistory } from "react-router-dom";

const SearchBox = (props) => {
    const consumedCountryState = useContext(CountryContext);
const country = consumedCountryState.country;
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
    return <Select
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
    />;
}

export { SearchBox }
