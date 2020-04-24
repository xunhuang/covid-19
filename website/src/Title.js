import React from "react";
import {Helmet} from "react-helmet";

const Title = (props) => {
  const title =
      props.title
          ? props.title + " | COVID-19 Daily Numbers Visualized"
          : "Covid-19.direct | COVID-19 Daily Numbers Visualized";
  const desc =
      props.desc
          ? props.desc
          : "US county-level COVID-19 30-day data visualized: "
              + "confirmed cases, new cases & death curves. "
              + "State-level testing results & hospitalization numbers.";

  return (
    <Helmet>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      <meta name="description" content={desc} />
      <meta property="og:description" content={desc} />
    </Helmet>
  );
};

export { Title };
