import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { makeStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/core'
import { createMuiTheme } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { Link } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
    table: {
        width: "100%"
    },
    link: {
        padding: "5",
        marign: "5",
    },
}));

const compact = createMuiTheme({
    overrides: {
        MuiTableCell: {
            sizeSmall: {  //This can be referred from Material UI API documentation. 
                padding: '1px 1px 1px 1px',
            },
        },
    },
});

const DetailCaseListWidget = (props) => {
    const classes = useStyles();
    const hospitals = props.hospitals.sort((a, b) => {
        return ('' + a.HOSPITAL_NAME).localeCompare(b.HOSPITAL_NAME);
    });

    let list =
        <>
            <Typography variant="body1">
                Please follow
                <Link className={classes.link} href="https://www.cdc.gov/coronavirus/2019-ncov/if-you-are-sick/steps-when-sick.html">
                    CDC guidance.
                </Link>

                Make contact
                with your doctor to make arrangments if
                you suspect you are sick. Do not show up at a hospital unannounced
                as that would overwhelm the hospital system.
        </Typography>
            <Table className={classes.table} size="small" aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell > Name</TableCell>
                        <TableCell align="center">City</TableCell>
                        <TableCell align="left">Licensed Beds</TableCell>
                        <TableCell align="left">Staffed Beds</TableCell>
                        <TableCell align="left">ICU Beds</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <ThemeProvider theme={compact}>
                        {hospitals.map(row => (
                            <TableRow key={row.id}>
                                <TableCell component="th" scope="row">
                                    {row.HOSPITAL_NAME}
                                </TableCell>
                                <TableCell align="center">{row.HQ_CITY}</TableCell>
                                <TableCell align="left">{row.NUM_LICENSED_BEDS ? row.NUM_LICENSED_BEDS : "-"}</TableCell>
                                <TableCell align="left">{row.NUM_STAFFED_BEDS ? row.NUM_STAFFED_BEDS : "-"}</TableCell>
                                <TableCell align="left">{row.NUM_ICU_BEDS ? row.NUM_ICU_BEDS : "-"}</TableCell>
                            </TableRow>
                        ))}
                    </ThemeProvider>
                </TableBody>
            </Table >
            <Typography variant="body2" noWrap>
                <Link href="https://www.arcgis.com/apps/opsdashboard/index.html#/8c4dcccd9e3845eb89f6401f919007f2">
                    Source: Definitive Health
                </Link>
            </Typography>
        </>
    return list;
}

function snapshotToArray(snapshot) {
    var returnArr = []
    snapshot.forEach(function (childSnapshot) {
        returnArr.push(childSnapshot.data());
    });
    return returnArr;
};

async function fetchCountyHospitals(county) {
    const firebase = require("firebase");
    const db = firebase.firestore();
    return await db.collection("DEFINITIVE_HOSPITALS")
        .where("COUNTY_NAME", "==", county.name)
        .where("STATE_NAME", "==", county.state().name)
        .get().then((querySnapshot) => {
            return snapshotToArray(querySnapshot);
        });
}

const CountyHospitalsWidget = (props) => {
    const [county_hospitals, setHospitals] = React.useState(null);
    React.useEffect(() => {
        fetchCountyHospitals(props.county).then((result, b) => {
            setHospitals(result);
        });
    }, [props.state, props.county]);

    if (!county_hospitals) {
        return <div> Loading</div>;
    }
    return <DetailCaseListWidget hospitals={county_hospitals} />;
}

export {
    CountyHospitalsWidget,
}
