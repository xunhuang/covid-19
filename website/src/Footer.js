import React from 'react';
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import { Link as MaterialLink } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import FacebookIcon from '@material-ui/icons/Facebook';
import Popover from '@material-ui/core/Popover';
import CreditPopover from './CreditHover'

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
        display: 'grid'
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
        item: true,
        className: classes.footerLink,
        color: 'textSecondary'
    };

    const menuLinks = [
        ["Terms of Service", "https://docs.google.com/document/d/10bsmpX1VVi2myFAHtP_gqHeGauDHz_9t1YQnjxMc_ng/edit?usp=sharing"],
        ["Data Credits", "/credit/data"]
    ];

    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'credit-popover' : undefined;

    return (
        <Grid container className={classes.topContainer} justify="space-evenly" alignItems="center" direction="row" >
            <Grid item xs={12} sm={1} />
            <Grid item container xs={12} sm={4} className={classes.linkContainer} justify="center" direction="column">
                {menuLinks.map(linkPair => {
                    return (<MaterialLink {...footerLinkProps} href={linkPair[1]}>{linkPair[0]}</MaterialLink>)
                })}
            </Grid>
            <Grid item xs={12} sm={2}>
                <Grid container className={classes.root}>
                    <Grid item xs={6} sm={6}>
                        <MaterialLink href="https://github.com/xunhuang/covid-19" className={classes.githubIcon}>
                            <GitHubIcon fontSize="large" className={classes.githubIcon}/>
                        </MaterialLink>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                    <MaterialLink href="https://www.facebook.com/COVID-19direct-107176574273347/" className={classes.githubIcon}>
                        <FacebookIcon fontSize="large" className={classes.githubIcon}/>
                    </MaterialLink>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12} sm={4}>
                <Typography variant='caption' color='textSecondary' className={classes.creditParagraph}>
                    This website is is 100% volunteer developed, open source and funded by user donations.
                    Click <MaterialLink onClick={handleClick}>here for volunteers</MaterialLink> that
                    made significant contributions.
                </Typography>
                <Popover
                    id={id}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                >
                    <CreditPopover/>
                </Popover>
            </Grid>
            <Grid item xs={12} sm={1} />
        </Grid>
    );

}

export { Footer }
