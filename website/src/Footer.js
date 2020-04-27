import React from 'react';
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import { Link as MaterialLink } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';

const useStyles = makeStyles(theme => ({
    topContainer: {
        paddingBottom: '2vh'
    },
    footerLink: {
        textAlign: 'center',
    },
    linkContainer: {
        padding: '1vh'
    },
    githubIcon: {
        color: '#00aeef',
        margin: '0 auto',
        textAlign: 'center',
        display: 'flex'
    },
    creditParagraph: {
        textAlign: 'center',
        display: 'flex',
        padding: '1vh'
    }
}));

const Footer = (props) => {
    const classes = useStyles();

    const footerLinkProps = {
        variant: 'button',
        item: true,
        className: classes.footerLink,
        color: 'textSecondary'
    }

    return (
        <Grid container className={classes.topContainer} justify="space-evenly" alignItems="center" direction="row" >
            <Grid item xs={12} sm={1} />
            <Grid item container xs={12} sm={4} className={classes.linkContainer} justify="center" direction="column">
                <MaterialLink {...footerLinkProps}>FAQ</MaterialLink>
                <MaterialLink {...footerLinkProps}>Terms of Service</MaterialLink>
                <MaterialLink {...footerLinkProps}>Data Credits</MaterialLink>
                <MaterialLink {...footerLinkProps}>Download Raw Data</MaterialLink>
            </Grid>
            <Grid item xs={12} sm={2}>
                <MaterialLink href="https://github.com/xunhuang/covid-19" className={classes.githubIcon}>
                    <GitHubIcon fontSize="large" className={classes.githubIcon}/>
                </MaterialLink>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Typography variant='caption' color='textSecondary' className={classes.creditParagraph}>
                    Special thanks to Person1, Person2, Person3, and Person4 for their contributions.
                    Without them, this site would not be possible.
                </Typography>
            </Grid>
            <Grid item xs={12} sm={1} />
        </Grid>
    )

}

export { Footer }
