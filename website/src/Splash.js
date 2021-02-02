import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(theme => ({
    grow: {
        flexGrow: 1,
    },
    title: {
        display: 'block',
        color: '#FFFFFF',
        background: '#00aeef',
        padding: 25,
        margin: 25,
        borderRadius: 20,

    },
    subtitle: {
        display: 'block',
        color: '#00aeef',
        padding: 5,
        margin: 5,
    },
    rootSplash: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "60vh",
        flexGrow: 1,
    },
}));

const Splash = (props) => {
    const classes = useStyles();
    return (
        <div className={classes.rootSplash}>
            <div>
                <Toolbar>
                    <div className={classes.grow}> </div>
                    <Typography className={classes.title} variant="h2" noWrap>
                        Vaccinate!
        </Typography>
                    <div className={classes.grow}> </div>
                </Toolbar>
                <Toolbar>
                    <div className={classes.grow}> </div>
                    <Typography className={classes.subtitle} variant="h5" noWrap>
                        #Wear_A_Mask
          </Typography>
                    <div className={classes.grow}> </div>
                </Toolbar>
                <Toolbar>
                    <div className={classes.grow}> </div>
                    <Typography className={classes.subtitle} variant="h5" noWrap>
                        this too shall pass
          </Typography>
                    <div className={classes.grow}> </div>
                </Toolbar>
            </div>
        </div>);
}

export { Splash }
