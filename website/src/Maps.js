import React from 'react';
import SVG from 'react-inlinesvg';
import { withStyles } from "@material-ui/core/styles";

const AllData = require("./data/AllData.json");

const useStyles = theme => ({
  mapContainer: {
    height: '100vh', // for full screen page, not required
    overflow: 'hidden',
    position: 'relative',
    touchAction: 'none',
    width: '100%', // for full screen page, not required
  },
  map: {
    height: 'auto',
    transformOrigin: 'top left',
    width: '100%',
    willChange: 'transform',
    '& > *': {
      fill: '#dadada',
      stroke: '#fff',
      strokeWidth: '0.1',
    },
  },
  pin: {
    background: '#444',
    borderRadius: '8px',
    color: '#efefef',
    padding: '4px',
    pointerEvents: 'none',
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
  },
});

class RawPin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      header: undefined,
      content: undefined,
      center: undefined,
    };
  }

  render() {
    if (!this.state.center) {
      return <div></div>;
    }

    const {classes} = this.props;
    const divStyle = {
      left: this.state.center.x,
      top: this.state.center.y,
    };

    return (
      <div className={classes.pin} style={divStyle}>
        <header>{this.state.header || ''}</header>
        <content>{this.state.content || ''}</content>
      </div>);
  }
}

const Pin = withStyles(useStyles)(RawPin);

class RawMap extends React.Component {
  constructor(props) {
    super(props);
    this.container = React.createRef();
    this.element = React.createRef();
    this.pin = React.createRef();
    this.mouseState = undefined;
    this.pinCenter = undefined;
  }

  componentDidUpdate() {
    if (this.element.current) {
      this.renderColors_();
    }
  }

  render() {
    const {classes} = this.props;
    return (
        <div
            className={classes.mapContainer}
            ref={this.container}>
          <SVG
              onLoad={this.svgLoaded_}
              onMouseDown={this.mouseDown_}
              onMouseMove={this.mouseMove_}
              onMouseUp={this.mouseUp_}
              innerRef={this.element}
              className={classes.map}
              src={process.env.PUBLIC_URL + '/us_counties_map.svg'} />
        <Pin ref={this.pin} center={this.pinCenter} />
      </div>);
  }

  svgLoaded_ = () => {
    const [x, y, width, height] =
        this.element.current.getAttribute('viewBox')
            .split(' ')
            .map(n => parseInt(n));
    this.viewBoxSize = {width, height};
    this.transform = {x: 0, y: 0, zoom: 1};
    this.updateTransform_();
    this.renderColors_();

    // React doesn't support passive events yet
    this.element.current.addEventListener(
        'wheel', this.wheel_, {passive: false});
  };

  renderColors_() {
    const entries = Object.entries(this.props.colors);
    this.setColorsBatch_(entries, 0);
  }

  setColorsBatch_(entries, index) {
    requestAnimationFrame(() => {
      const nextBatch = Math.min(index + 100, entries.length);

      for (let i = index; i < nextBatch; i += 1) {
        const [id, color] = entries[i];
        const county =
            this.element.current.querySelector(`[data-fips="${parseInt(id)}"]`);
        if (county) {
          county.style.fill = color;
        } else {
          console.error(`Not rendering ${id}`);
        }
      }

      if (nextBatch < entries.length) {
        this.setColorsBatch_(entries, nextBatch);
      }
    });
  }

  mouseDown_ = (e) => {
    this.mouseState = {action: 'down', x: e.clientX, y: e.clientY};
  };

  mouseMove_ = (e) => { 
    if (!this.mouseState) {
      return true;
    }

    const state = this.mouseState;
    if (state.action === 'down') {
      const at = {x: e.clientX, y: e.clientY};
      if (distance(state, at) > 4) {
        state.action = 'drag';
      }
    }

    if (state.action === 'drag') {
      this.transform.x += e.clientX - state.x;
      this.transform.y += e.clientY - state.y;
      this.updateTransform_();
      state.x = e.clientX;
      state.y = e.clientY;
      return false;
    }
  };

  mouseUp_ = (e) => {
    if (!this.mouseState) {
      return true;
    }

    const at = {x: e.clientX, y: e.clientY};
    const state = this.mouseState;
    if (state.action === 'down'
        && distance(at, state) < 4
        && this.props.getPinText) {
      const target = e.target;
      if (target.hasAttribute('data-fips')) {
        const text = this.props.getPinText(
            target.getAttribute('data-fips').padStart(5, '0'));
        this.pin.current.setState(prevState => ({
          ...prevState,
          ...text,
        }));

        const rect = target.getBoundingClientRect();
        this.pinCenter = {
          x: (rect.x + rect.width / 2 - this.transform.x)
              / this.transform.zoom,
          y: (rect.y + rect.height / 2 - this.transform.y)
              / this.transform.zoom,
        };

        this.updatePinTransform_();
      }
    }

    this.mouseState = undefined;
  };

  wheel_ = (e) => {
    e.preventDefault();

    const was = this.transform.zoom;
    this.transform.zoom -= 0.01 * e.deltaY;

    // First, determine where our current center will be when we zoom.
    const cx = this.transform.x / was * this.transform.zoom;
    const cy = this.transform.y / was * this.transform.zoom;

    // Then, determine how many pixels the cursor under the mouse will have
    // moved.
    const rect = this.container.current.getBoundingClientRect();
    const dz = this.transform.zoom - was;
    const dx = -(e.clientX - rect.left) / this.transform.zoom * dz;
    const dy = -(e.clientY - rect.top) / this.transform.zoom * dz;

    this.transform.x = cx + dx;
    this.transform.y = cy + dy;

    requestAnimationFrame(() => {
      // There's a time and a place for will-change (panning), but scaling is not
      // it.
      // See: https://greensock.com/will-change/ (Partial solution)
      this.element.current.style.willChange = 'initial';
      this.updateTransform_();

      requestAnimationFrame(() => {
        this.element.current.style.willChange = '';
      });
    });
  };

  updateTransform_() {
    this.clampTransform_();
    this.updateMapTransform_();
    this.updatePinTransform_();
  }

  clampTransform_() {
    const containerRect = this.container.current.getBoundingClientRect();
    const elementRect = this.element.current.getBoundingClientRect();
    this.transform.x = clamp(
            this.transform.x,
            containerRect.width - elementRect.width,
            0);
    this.transform.y =
        clamp(
            this.transform.y,
            containerRect.height - elementRect.height,
            0);
    this.transform.zoom = clamp(this.transform.zoom, 1, 4);
  }

  updateMapTransform_() {
    const {x, y, zoom} = this.transform;
    this.element.current.style.transform =
        `matrix(${zoom}, 0, 0, ${zoom}, ${x}, ${y})`;
  }

  updatePinTransform_() {
    if (this.pin.current && this.pinCenter) {
      const center = this.pinCenter;
      const {x, y, zoom} = this.transform;
      this.pin.current.setState(prevState => ({
        ...prevState,
        center: {
          x: `${zoom * center.x + x}px`,
          y: `${zoom * center.y + y}px`,
        },
      }));
    }
  }
}

const Map = withStyles(useStyles)(RawMap);

class InfectionMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {colors: {}};
    this.mapping = {};
  }

  componentDidMount() {
    const colors = {};
    for (const [state, counties] of Object.entries(AllData)) {
      for (const [id, county] of Object.entries(counties)) {
        this.mapping[id] = {
          name: county.CountyName,
          state: county.StateName,
          deaths: county.LastConfirmed,
        };

        if (county.LastConfirmed > 0) {
          colors[id] = `hsla(0, 100%, ${80 - 7 * Math.log(county.LastConfirmed)}%, 1)`;
        } else {
          colors[id] = '';
        }
      }
    }
    this.setState({colors});
  }

  render() {
    return <Map colors={this.state.colors} getPinText={this.getPinText_} />;
  }

  getPinText_ = (county) => {
    const info = this.mapping[county];
    if (info) {
      return {
        header: `${info.name}, ${info.state}`,
        content: `${info.deaths}`,
      };
    } else {
      return {
        header: '',
        content: 'no deaths',
      };
    }
  };
}

function clamp(x, l, h) {
  if (x < l) {
    return l;
  } else if (x > h) {
    return h;
  } else {
    return x;
  }
}

function distance(a, b) {
  return (a.x - b.x)**2 + (a.y - b.y)**2;
}

export { InfectionMap }
