import React from 'react';
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import { Link as MaterialLink } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import FacebookIcon from '@material-ui/icons/Facebook';
import CreditPopover from './CreditHover'
import { DataCreditWidget } from "./graphs/DataCredit"
import { asDialogue } from "./FooterDialogue"

const useStyles = makeStyles(theme => ({
    topContainer: {
        marginTop: '2vh',
        paddingBottom: '2vh',
    },
    footerLink: {
        textAlign: 'center',
    },
    linkContainer: {
        padding: '1vh'
    },
    iconRoot: {
        textAlign: 'center',
    },
    githubIcon: {
        color: '#00aeef',
        margin: '0 auto',
    },
    creditParagraph: {
        textAlign: 'center',
        display: 'block',
        padding: '1vh'
    },
}));

const Footer = (props) => {
    const classes = useStyles();

    const footerLinkProps = {
        variant: 'button',
        className: classes.footerLink,
        color: 'textSecondary'
    };
    const footerLinks = [
        ["Terms of Service", (event) => window.location.href="https://docs.google.com/document/d/10bsmpX1VVi2myFAHtP_gqHeGauDHz_9t1YQnjxMc_ng/edit?usp=sharing"],
        ["Data Credits", (event) => handleClick(event, 'data-cred')]
    ];

    const [openedPopoverId, setOpenedPopoverId] = React.useState(null);
    const handleClick = (event, popoverId) => {
        event.preventDefault();
        setOpenedPopoverId(popoverId);
    };
    const handleClose = () => {
        setOpenedPopoverId(null);
    }

    return (
        <Grid container className={classes.topContainer} justify="space-evenly" alignItems="center" direction="row" >
            <Grid item xs={12} sm={1} />
            <Grid item container xs={12} sm={4} className={classes.linkContainer} justify="center" direction="column">
                {footerLinks.map(linkPair => {
                    return (<MaterialLink {...footerLinkProps} key={linkPair[0]} href="#" onClick={linkPair[1]}>{linkPair[0]}</MaterialLink>)
                })}
            </Grid>
            <Grid item xs={12} sm={2}>
                <Grid container justify="center" className={classes.iconRoot}>
                    <Grid item xs={3} sm={6}>
                        <MaterialLink href="https://github.com/xunhuang/covid-19" className={classes.githubIcon}>
                            <GitHubIcon fontSize="large" />
                        </MaterialLink>
                    </Grid>
                    <Grid item xs={3} sm={6}>
                        <MaterialLink href="https://www.facebook.com/groups/890203761415663" className={classes.githubIcon}>
                            <FacebookIcon fontSize="large" />
                        </MaterialLink>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Typography variant='caption' color='textSecondary' className={classes.creditParagraph}>
                    This website is is 100% volunteer developed, open source and funded by user donations.
                    Click <MaterialLink href="#" onClick={(e) => handleClick(e, 'cred-popover')}>here for volunteers</MaterialLink> that
                    made significant contributions.
                </Typography>
                {asDialogue(CreditPopover, "Special Thanks To", openedPopoverId === 'cred-popover', handleClose)}
                {asDialogue(DataCreditWidget, "Data Credits", openedPopoverId === 'data-cred', handleClose)}
            </Grid>
            <Grid item xs={12} sm={1} />
        </Grid>
    );

}

export { Footer }
