import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Switch, Route, withRouter, Link} from 'react-router-dom'
import { BrowserRouter } from 'react-router-dom';
import { countyModuleInit } from "./USCountyInfo.js";
import * as USCounty from "./USCountyInfo.js";
import { Splash } from './Splash.js';
import { NearbyCounties, CountiesForStateWidget, AllStatesListWidget } from "./CountyListRender.js"
import { BasicGraphNewCases } from "./GraphNewCases.js"
import { GraphUSTesting, GraphStateTesting } from "./GraphTestingEffort"
import { withHeader } from "./Header.js"
import { MyTabs } from "./MyTabs.js"
import { USInfoTopWidget } from './USInfoTopWidget.js'
import { GraphUSHospitalization, GraphStateHospitalization } from './GraphHospitalization.js'
import { CountyHospitalsWidget } from "./Hospitals"
import StickyFooter from 'react-sticky-footer';
import {getDefaultCounty} from './DefaultGeoData.js';

const Cookies = require("js-cookie");

const useStyles = makeStyles(theme => ({
    container: {
      margin: 25,
    },
    title: {
        display: 'flex',
        color: '#FFFFFF',
        background: '#00aeef',
        borderRadius: 5,
        padding: 25,
        fontSize: "2em",
        justifyContent: "center",
    },
    description: {
      padding: 10,
    },
    fbButton: {
      color: "white",
      backgroundColor: "rgb(24, 119, 242)",
    },
    gfmButton: {
      color: "white",
      backgroundColor: "#00b964",
    },
    button: {
      padding: "1em 1.5em",
      textDecoration: "none",
      display: "flex",
      justifyContent: "center",
      borderRadius: 5,
      fontSize: "15px",
      fontWeight: 600,
      margin: 10,
    },
}));



const DontationPage = withHeader((props) => {
  const classes = useStyles();
  const donateHeader = <div className={classes.title}> Donations </div>;
  // TODO find a better wording 
  const description = <div className={classes.description}> 
    <div>
      If you find this website useful, please consider donating to keep the service running. 
    </div>
    <div>
      We really appreciate your support. 
    </div>
  </div>; 
  const donationMethods = <div> 
    <div> 
      <a className={`${classes.button} ${classes.fbButton}`} target="_blank" href="https://www.facebook.com/donate/1564752357011737/"> 
        Donate on Facebook 
      </a>
      <a className={`${classes.button} ${classes.gfmButton}`} target="_blank" href="https://www.gofundme.com/f/frontlinerespondersfund">
        Donate on GoFundMe
      </a>
    </div>
    <div>
    </div>
  </div>;

  const {casesData} = props;
  const defaultCountyInfo = getDefaultCounty();
  return <>
    <USInfoTopWidget
        casesData={casesData}
        county={defaultCountyInfo.county}
        state={defaultCountyInfo.state}
      />
    <div className={classes.container}> 
      {description}
      {donationMethods}
    </div>
  </>
});


export default DontationPage;
