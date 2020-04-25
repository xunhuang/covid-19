import React, { useContext } from 'react';
import { withHeader } from "./Header.js"
import { CountryContext } from "./CountryContext";
import { USInfoTopWidget } from './USInfoTopWidget.js'
import * as Util from "./Util.js"
import { Box } from '@material-ui/core';
import { Title } from './Title';

const textStyle = {
    color: 'white',
    fontSize: 'x-large',
}

const Page404 = withHeader(() => {
    const country = useContext(CountryContext);
    const default_county_info = Util.getDefaultCounty();
    const state = country.stateForTwoLetterName(default_county_info.state)
    const county = state.countyForName(default_county_info.county)
    return (
        <>
            <Title
                title="Page not found"
                desc={`${country.name} county-level COVID-19 30-day data visualized: `
                          + `confirmed cases, new cases & death curves, `
                          + `testing results & hospitalization numbers.`}
            />
            <USInfoTopWidget source={county || state} />
            <Box
                display="flex"
                height={80}
                bgcolor="#00aeef"
                alignItems="center"
                justifyContent="center"
            >
                <h1 style={textStyle}>
                    Oops! That page couldn&apos;t be found.
                </h1>
            </Box>
        </>
    );
});

export { Page404 }
