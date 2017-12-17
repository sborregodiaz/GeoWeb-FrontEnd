import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { TAF_TEMPLATES, TAF_TYPES } from './TafTemplates';
import cloneDeep from 'lodash.clonedeep';
import { jsonToTacForPeriod, jsonToTacForWind, jsonToTacForCavok, jsonToTacForVerticalVisibility, jsonToTacForVisibility, jsonToTacForWeather, jsonToTacForClouds } from './TafFieldsConverter';

class TafCell extends PureComponent {
  render () {
    const { classes, name, value, inputRef, disabled, autoFocus } = this.props;
    return <td className={classNames(classes)}>
      <input ref={inputRef} name={name} type='text' value={value} disabled={disabled} autoFocus={autoFocus} />
    </td>;
  }
}

TafCell.propTypes = {
  classes: PropTypes.array,
  name: PropTypes.string,
  inputRef: PropTypes.func,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool
};

/*
  BaseForecast of TAF editor, it is the top row visible in the UI.
*/
class BaseForecast extends Component {
  render () {
    const { tafMetadata, tafForecast, focusedFieldName, inputRef, editable } = this.props;

    const columns = [
      {
        name: 'sortable',
        value: '',
        disabled: true,
        classes: [ 'noselect' ]
      },
      {
        name: 'metadata-location',
        value: tafMetadata.hasOwnProperty('location') ? tafMetadata.location || '' : '',
        disabled: true,
        classes: [ 'TACnotEditable' ]
      },
      {
        name: 'metadata-issueTime',
        value: tafMetadata.hasOwnProperty('issueTime') ? tafMetadata.issueTime || '' : '',
        disabled: true,
        classes: [ 'TACnotEditable' ]
      },
      {
        name: 'metadata-validity',
        value: tafMetadata.hasOwnProperty('validityStart') && tafMetadata.hasOwnProperty('validityEnd') ? jsonToTacForPeriod(tafMetadata.validityStart, tafMetadata.validityEnd) || '' : '',
        disabled: true,
        classes: [ 'TACnotEditable' ]
      },
      {
        name: 'forecast-wind',
        value: tafForecast.hasOwnProperty('wind') ? jsonToTacForWind(tafForecast.wind, true) || '' : '',
        disabled: !editable,
        classes: []
      },
      {
        name: 'forecast-visibility',
        value: (tafForecast.hasOwnProperty('caVOK') || tafForecast.hasOwnProperty('visibility'))
          ? jsonToTacForCavok(tafForecast.caVOK) || (jsonToTacForVisibility(tafForecast.visibility, true) || '')
          : '',
        disabled: !editable,
        classes: []
      }
    ];
    for (let weatherIndex = 0; weatherIndex < 3; weatherIndex++) {
      columns.push({
        name: 'forecast-weather-' + weatherIndex,
        value: tafForecast.hasOwnProperty('weather')
          ? (Array.isArray(tafForecast.weather) && tafForecast.weather.length > weatherIndex
            ? jsonToTacForWeather(tafForecast.weather[weatherIndex], true) || ''
            : weatherIndex === 0
              ? jsonToTacForWeather(tafForecast.weather, true) || '' // NSW
              : '')
          : '',
        disabled: !editable || (jsonToTacForWeather(tafForecast.weather) && weatherIndex !== 0),
        classes: []
      });
    }
    for (let cloudsIndex = 0; cloudsIndex < 4; cloudsIndex++) {
      columns.push({
        name: 'forecast-clouds-' + cloudsIndex,
        value: tafForecast.hasOwnProperty('vertical_visibility') || tafForecast.hasOwnProperty('clouds')
          ? jsonToTacForVerticalVisibility(tafForecast.vertical_visibility) ||
            (Array.isArray(tafForecast.clouds) && tafForecast.clouds.length > cloudsIndex
              ? jsonToTacForClouds(tafForecast.clouds[cloudsIndex], true) || ''
              : cloudsIndex === 0
                ? jsonToTacForClouds(tafForecast.clouds, true) || '' // NSC
                : '')
          : '',
        disabled: !editable || (jsonToTacForClouds(tafForecast.clouds) && cloudsIndex !== 0) ||
          (jsonToTacForVerticalVisibility(tafForecast.vertical_visibility) && cloudsIndex !== 0),
        classes: [ (jsonToTacForVerticalVisibility(tafForecast.vertical_visibility) && cloudsIndex !== 0) ? 'hideValue' : null ]
      });
    }
    columns.push(
      {
        name: 'removable',
        value: '',
        disabled: true,
        classes: [ 'noselect' ]
      }
    );
    columns.forEach((column) => {
      column.autoFocus = column.name === focusedFieldName;
    });

    return <tr>
      {columns.map((col) =>
        <TafCell classes={col.classes} key={col.name} name={col.name} inputRef={inputRef} value={col.value} disabled={col.disabled} autoFocus={col.autoFocus} />
      )}
    </tr>;
  }
};

BaseForecast.defaultProps = {
  tafMetadata: cloneDeep(TAF_TEMPLATES.METADATA),
  tafForecast: cloneDeep(TAF_TEMPLATES.FORECAST),
  focusedFieldName: null,
  inputRef: () => {},
  editable: false,
  validationReport: null
};

BaseForecast.propTypes = {
  tafMetadata: TAF_TYPES.METADATA.isRequired,
  tafForecast: TAF_TYPES.FORECAST.isRequired,
  focusedFieldName: PropTypes.string,
  inputRef: PropTypes.func,
  editable : PropTypes.bool,
  validationReport: PropTypes.object
};

export default BaseForecast;
