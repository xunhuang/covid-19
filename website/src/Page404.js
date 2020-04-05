import React, { useContext } from 'react';
import { withHeader } from "./Header.js"
import { CountryContext } from "./CountryContext";
import { USInfoTopWidget } from './USInfoTopWidget.js'
import * as Util from "./Util.js"
import { Box } from '@material-ui/core'

const textStyle = {
    color: 'white',
    fontSize: 'x-large',
}

const Page404 = withHeader(() => {
    const country = useContext(CountryContext);
    const default_county_info = Util.getDefaultCounty();
    const county =
        country
            .stateForTwoLetterName(default_county_info.state)
            .countyForName(default_county_info.county)
    return (
        <>
            <USInfoTopWidget county={county} selectedTab={"usa"} />
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
