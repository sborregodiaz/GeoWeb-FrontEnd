import React, { Component } from 'react';
import CanvasComponent from './ADAGUC/CanvasComponent';
import diff from 'deep-diff';
import { MODEL_LEVEL_URL } from '../constants/default_services';
import axios from 'axios';
import LoadingComponent from './LoadingComponent';
import PropTypes from 'prop-types';

export default class ProgtempComponent extends Component {
  constructor () {
    super();
    this.renderProgtempData = this.renderProgtempData.bind(this);
    this.renderProgtempBackground = this.renderProgtempBackground.bind(this);
    this.setModelData = this.setModelData.bind(this);
    this.fetchAndRender = this.fetchAndRender.bind(this);
    this.modifyData = this.modifyData.bind(this);
    this.state = {
      progtempData: null,
      isLoading: false
    };
  }
  renderProgtempBackground (ctx, canvasWidth, canvasHeight) {
    // eslint-disable-next-line no-undef
    drawProgtempBg(ctx, canvasWidth, canvasHeight);
  }

  modifyData (data, referenceTime, timeOffset) {
    if (!data) return {};
    function fetchData (data, referenceTime, timeOffset, name) {
      if (!data) return null;
      let selectedData = data.filter((obj) => obj.name === name)[0].data;
      if (timeOffset in selectedData) {
        selectedData = selectedData[timeOffset];
        let selectedObjs = Object.keys(selectedData).map((key) => parseFloat(selectedData[key][Object.keys(selectedData[key])[0]]));
        return selectedObjs;
      }
      return null;
    }

    function getWindInfo (windX, windY) {
      if (!(windX && windY)) return { windSpeed: null, windDirection: null };
      let toRadians = (deg) => {
        return (deg / 180) * Math.PI;
      };
      let toDegrees = (rad) => {
        return (((rad / Math.PI) * 180) + 360) % 360;
      };

      let windSpeed = [];
      let windDirection = [];
      for (var i = 0; i < windX.length; ++i) {
        windSpeed.push(Math.sqrt(windX[i] * windX[i] + windY[i] * windY[i]));
        windDirection.push(toDegrees(toRadians(270) - Math.atan2(windY[i], windX[i])));
      }
      return { windSpeed, windDirection };
    }

    function computeTwTv (T, Td, pressure) {
      if (!(T && Td && pressure)) {
        return { Tw: null, Tv: null };
      }
      let Tw = [];
      let Tv = [];
      for (var i = 0; i < T.length; ++i) {
        // eslint-disable-next-line no-undef
        Tw = calc_Tw(T[i], Td[i], pressure[i]);
        // eslint-disable-next-line no-undef
        Tv = calc_Tv(T[i], Td[i], pressure[i]);
      }
      return { Tw, Tv };
    }

    let pressureData = fetchData(data, referenceTime, timeOffset, 'air_pressure__at_ml');
    let airTemp = fetchData(data, referenceTime, timeOffset, 'air_temperature__at_ml');
    let windXData = fetchData(data, referenceTime, timeOffset, 'x_wind__at_ml');
    let windYData = fetchData(data, referenceTime, timeOffset, 'y_wind__at_ml');
    let { windSpeed, windDirection } = getWindInfo(windXData, windYData);
    let dewTemp = fetchData(data, referenceTime, timeOffset, 'dewpoint_temperature__at_ml');
    let { Tw, Tv } = computeTwTv(airTemp, dewTemp, pressureData);
    return { PSounding: pressureData, TSounding: airTemp, TdSounding: dewTemp, ddSounding: windDirection, ffSounding: windSpeed, TwSounding: Tw, TvSounding: Tv };
  }

  renderProgtempData (ctx, canvasWidth, canvasHeight, progtempTime) {
    const { PSounding, TSounding, TdSounding, ddSounding, ffSounding, TwSounding, TvSounding } = this.modifyData(this.state.progtempData, this.props.referenceTime, progtempTime);
    // eslint-disable-next-line no-undef
    drawProgtemp(ctx, canvasWidth, canvasHeight, PSounding, TSounding, TdSounding, ddSounding, ffSounding, TwSounding, TvSounding);
    // eslint-disable-next-line no-undef
    plotHodo(ctx, canvasWidth, canvasHeight, PSounding, TSounding, TdSounding, ddSounding, ffSounding, TwSounding);
  }

  setModelData (model, location) {
    let url;
    if (!(model && location)) return;
    switch (model.toUpperCase()) {
      default:
        url = `${MODEL_LEVEL_URL}SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPointValue&LAYERS=&
QUERY_LAYERS=air_pressure__at_ml,y_wind__at_ml,x_wind__at_ml,dewpoint_temperature__at_ml,air_temperature__at_ml&CRS=EPSG%3A4326&
INFO_FORMAT=application/json&time=*&DIM_reference_time=` + this.props.referenceTime + `&x=` + location.x + `&y=` + location.y + `&DIM_modellevel=*`;
        break;
    }
    return axios.get(url).then((d) => {
      this.setState({ progtempData: d.data });
    });
  }

  fetchAndRender (model, location) {
    if (!(model && location)) return;
    this.setState({ isLoading: true });
    this.setModelData(model, location).then(() => {
      this.renderProgtempData(this.progtempContext, this.width, this.height, this.props.time.format('YYYY-MM-DDTHH:mm:ss') + 'Z');
      this.setState({ isLoading: false });
    }).catch(() => this.setState({ isLoading: false }));
  }

  componentWillUpdate (nextProps, nextState) {
    if (nextProps.selectedModel !== this.props.selectedModel ||
        nextProps.location !== this.props.location ||
        nextProps.referenceTime !== this.props.referenceTime) {
      this.fetchAndRender(nextProps.selectedModel, nextProps.location);
    } else {
      this.renderProgtempData(this.progtempContext, this.width, this.height, nextProps.time.format('YYYY-MM-DDTHH:mm:ss') + 'Z');
    }
  }

  render () {
    const { time, className, style } = this.props;
    return (
      <div className={className} style={style}>
        <CanvasComponent drawOnce onRenderCanvas={(ctx, w, h) => {
          this.renderProgtempBackground(ctx, w, h);
        }} />
        <CanvasComponent isLoading={this.state.isLoading} style={{ marginTop: '-600px' }} onRenderCanvas={(ctx, w, h) => {
          this.progtempContext = ctx;
          this.renderProgtempData(ctx, w, h, time.format('YYYY-MM-DDTHH:mm:ss') + 'Z');
        }} />
        <LoadingComponent isLoading={this.state.isLoading} style={{ width: '50px', height: '50px', marginTop: '-590px', marginLeft: '4rem' }} />
      </div>);
  }
}

ProgtempComponent.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  time: PropTypes.object,
  selectedModel: PropTypes.string.isRequired,
  referenceTime: PropTypes.string.isRequired,
  location: PropTypes.object
};
