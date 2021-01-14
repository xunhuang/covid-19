import React, { useContext } from 'react';
import { CountryContext } from "./CountryContext";
import Disqus from "disqus-react"
import { MyTabs } from "./MyTabs.js";
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles';
import { FacebookProvider, Comments } from 'react-facebook';
import { useHistory } from "react-router-dom";
import { Link as MaterialLink } from '@material-ui/core';
import { Grid } from '@material-ui/core';
import { Paper } from '@material-ui/core';
import { SectionHeader } from "./CovidUI"
import { withRouter } from 'react-router-dom'
import { Link as RouterLink } from 'react-router-dom';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { MentalHealthResourceSection } from './MentalHealthTab';
import { SearchBox } from './SearchBox';
import { Footer } from './Footer'
import { DonateLink } from './components/chrome/DonateLink';
import { SocialMediaButtons } from './components/chrome/SocialMediaButtons';

const Cookies = require("js-cookie");
const moment = require("moment");

const NewsData = require("./data/news.json");
const WhatsNewData = require("./data/whatsnew.json");

const useStyles = makeStyles(theme => ({
  topContainer: {
    display: 'flex',
    alignItems: 'baseline',
  },
  row: {
    alignItems: 'baseline',
    padding: 5,
  },
  title: {
    display: 'block',
    padding: 2,
    paddingRight: 10,
    margin: 2,
  },
  tagline: {
    display: 'flex',
    padding: 0,
    paddingTop: 10,
    paddingRight: 10,
    margin: 0,
    alignSelf: "flex-start",
    alignItems: "center",
    flexDirection: "column",
  },
  keepclam: {
    display: 'block',
    color: '#FFFFFF',
    background: '#00aeef',
    borderRadius: 0,
    padding: 2,
    margin: 2,
  },
  searchContainer: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  qpContainer: {
    display: 'none',
    background: '#e3e3e3',
    borderWidth: "1px",
    padding: 15,
    margin: 15,
  },
  qpBox: {
    display: 'flex',
    justifyContent: "space-between",
    width: "100%",
  },
  grow: {
    flex: 1,
  },
  supportUs: {
    padding: 2,
    margin: 2,
  },
  buyUsACoffee: {
    padding: 2,
    margin: 2,
    background: '#00aeef',
    borderRadius: 15,
    justifyContent: "center",
    display: "flex",
    color: "white",
  },
  newsDate: {
    margin: 6,
  },
  newsTitle: {
    margin: 4,
  },
  commentPaper: {
    overflow: 'auto',
    width: '97%',
    padding: 10,
    display: 'block',
    margin: '0 auto',
    maxHeight: "80vh",
  }
}));

const WhatsNewSection = (props) => {
  const classes = useStyles();
  const data =
    WhatsNewData.sort((a, b) => moment(b.Date, "MM/DD/YYYY").toDate() - moment(a.Date, "MM/DD/YYYY").toDate())
      .slice(0, 5);
  return <div>
    <SectionHeader>
      <Typography variant="h5" noWrap>
        What's New On Covid-19.Direct
             </Typography>
    </SectionHeader>
    {data.map((item, i) =>
      <Grid container wrap="nowrap" key={item.Feature}>
        <Grid item className={classes.newsDate}>
          <div>{moment(item.Date, "MM/DD/YYYY").format("M/D")}</div>
        </Grid>
        <Grid item className={classes.newsTitle}>
          <Typography variant="body1" noWrap>
            {(item.Link &&
              <MaterialLink to={item.Link} component={RouterLink}>
                {item.Feature}
              </MaterialLink>) ||
              item.Feature}
          </Typography>

          <Typography variant="body2" noWrap>
            {item.commentary}
          </Typography>
        </Grid>
      </Grid >
    )}
  </div >;
};

const NewsSection = (props) => {
  const classes = useStyles();
  const data =
    NewsData.sort((a, b) => moment(b.Date, "MM/DD/YYYY").toDate() - moment(a.Date, "MM/DD/YYYY").toDate())
      .slice(0, 10);
  return <div>
    <SectionHeader id="news">
      <Typography variant="h5" noWrap>
        News
             </Typography>
    </SectionHeader>
    {data.map((item, i) =>
      <Grid container alignItems="center" wrap="nowrap" key={item.link}>
        <Grid item className={classes.newsDate}>
          <div>{moment(item.Date, "MM/DD/YYYY").format("M/D")}</div>
        </Grid>
        <Grid item className={classes.newsTitle}>
          <a href={item.link}> {item.Title}</a>
        </Grid>
      </Grid >
    )}
  </div >;
};

const DonateButton = (props) => {
  const classes = useStyles();
  return (
    <Typography noWrap variant="body2" className={classes.buyUsACoffee}>
      <DonateLink className={classes.buyUsACoffee} />
    </Typography>);
}

const Banner = withRouter((props) => {
  const history = useHistory();
  const classes = useStyles();
  const country = useContext(CountryContext);
  const [showNews] = React.useState(false);

  const us_summary = country.summary();
  const url_shared =
    "https://covid-19.direct" +
    props.match.url +
    history.location.search;
  return (
    <div>
      <div className={classes.topContainer}>
        <span className={classes.title}>
          <Typography variant="h6" >
            COVID-19.direct
            </Typography>
          <SocialMediaButtons
            className={classes.socialMediaRow}
            url={url_shared}
            size={32}
          />
          <Typography variant="body2" noWrap>
            Updated: {moment(us_summary.generatedTime).format('lll')}
          </Typography>
        </span>
        <span className={classes.grow}></span>
        {/* <span className={classes.keepclam}> Keep Clam, #StayHome</span> */}
        <span className={classes.tagline}>
          {/* <Typography variant="body1" >
            this too shall pass
          </Typography> */}
          <DonateButton />
          {/* <MaterialLink variant="body1" to="/country/" component={RouterLink} >
            Beta: Rest of World
          </MaterialLink>
 */}
        </span>
      </div >
      {showNews &&
        <WhatsNewSection />
      }
    </div >
  );
});

const QPArea = (props) => {
  const QPID = "qpid_metro3";
  const classes = useStyles();
  const [open, setOpen] = React.useState(Cookies.get(QPID) === undefined);

  const handleClose = (qpid) => {
    Cookies.set(qpid, 1, 10000);
    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return <div className={classes.qpContainer}>
    <div className={classes.qpBox} >
      <div>
        We added NYC and Bay Area as a "Metro" area with multiple counties. What new metro areas
        should we include?
                    <MaterialLink href="#discussion">
          Make a suggestion here.
                    </MaterialLink>
      </div>
      <IconButton size="small" aria-label="close" color="inherit" onClick={() => { handleClose(QPID) }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </div>
  </div>
}

const withHeader = (comp, props) => {

  const disqusShortname = "covid19direct";
  const disqusConfig = {
    url: "https://covid-19.direct",
    identifier: "article-id",
    title: "main page"
  };

  const donationPageUrl = "https://www.gofundme.com/f/covid19direct-operating-cost";

  return (props) => {
    const classes = useStyles();
    let component = comp({
      // add addition things here
      ...props,
    });
    let healthDiscussion = <div>
      <SectionHeader>
        <Typography variant="h5" noWrap>
          Resources
                    </Typography>
      </SectionHeader>
      <MentalHealthResourceSection />
      <SectionHeader id="discussion">
        <Grid container alignItems="center">
          <Grid item>
            <Typography variant="h5" noWrap id="discussion">
              Discussions
                    </Typography>
          </Grid>
          <Grid item xs />
          <Grid item>
            <Typography noWrap variant="body2" className={classes.supportUs}>
              <MaterialLink target="_blank" href={donationPageUrl}>
                Like our site? Support us!
                        </MaterialLink>
            </Typography>
          </Grid>
        </Grid>
      </SectionHeader>
      <Paper elevation={3} className={classes.commentPaper}>
        <MyTabs
          labels={['Disqus', 'FB Comments']}
          urlQueryKey="discussions"
          urlQueryValues={['disqus', 'facebook']}
          tabs={[
            (
              <Disqus.DiscussionEmbed
                shortname={disqusShortname}
                config={disqusConfig}
              />
            ), (
              <FacebookProvider appId="201788627783795">
                <Comments href="https://covid-19.direct/" />
              </FacebookProvider>
            )
          ]}
        />
      </Paper>
    </div>;

    let header = <header className="App-header">
      <Banner />
      <QPArea />
      <div className={classes.searchContainer}>
        <SearchBox />
      </div>
      {component}
      {false && <NewsSection />}
      {healthDiscussion}
      <Footer />
    </header >

    return header;
  }
};


export { withHeader }
