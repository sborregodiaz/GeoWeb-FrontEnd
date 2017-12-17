import React, { Component, PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import classNames from 'classnames';
import { TAF_TEMPLATES, TAF_TYPES } from './TafTemplates';
import cloneDeep from 'lodash.clonedeep';
import { jsonToTacForPeriod, jsonToTacForProbability, jsonToTacForChangeType, jsonToTacForWind, jsonToTacForCavok,
  jsonToTacForVerticalVisibility, jsonToTacForVisibility, jsonToTacForWeather, jsonToTacForClouds } from './TafFieldsConverter';

class TafCell extends PureComponent {
  render () {
    const { classes, name, value, inputRef, disabled, autoFocus, isSpan, isButton } = this.props;
    return <td className={classNames(classes)}>
      {isSpan
        ? <span name={name} disabled={disabled}>{value}</span>
        : isButton
          ? <Button name={name} size='sm' disabled={disabled} autoFocus={autoFocus}>{value}</Button>
          : <input ref={inputRef} name={name} type='text' value={value} disabled={disabled} autoFocus={autoFocus} />
      }
    </td>;
  }
}

TafCell.propTypes = {
  classes: PropTypes.array,
  name: PropTypes.string,
  inputRef: PropTypes.func,
  value: PropTypes.string,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  isSpan: PropTypes.bool,
  isButton: PropTypes.bool
};

/*
  ChangeGroup of TAF editor
*/
class ChangeGroup extends Component {
  render () {
    const { tafChangeGroup, focusedFieldName, inputRef, index, editable } = this.props;
    const columns = [
      {
        name: 'changegroups-' + index + '-sortable',
        value: editable ? '\uf0c9' : '', // the bars icon
        disabled: !editable,
        isSpan: true,
        classes: [ 'noselect' ]
      },
      {
        name: 'changegroups-' + index + '-probability',
        value: tafChangeGroup.hasOwnProperty('changeType') ? jsonToTacForProbability(tafChangeGroup.changeType, true) || '' : '',
        disabled: false,
        classes: []
      },
      {
        name: 'changegroups-' + index + '-change',
        value: tafChangeGroup.hasOwnProperty('changeType') ? jsonToTacForChangeType(tafChangeGroup.changeType, true) || '' : '',
        disabled: false,
        classes: []
      },
      {
        name: 'changegroups-' + index + '-validity',
        value: tafChangeGroup.hasOwnProperty('changeStart') && tafChangeGroup.hasOwnProperty('changeEnd') ? jsonToTacForPeriod(tafChangeGroup.changeStart, tafChangeGroup.changeEnd, true) || '' : '',
        disabled: false,
        classes: []
      },
      {
        name: 'changegroups-' + index + '-forecast-wind',
        value: tafChangeGroup.hasOwnProperty('forecast') && tafChangeGroup.forecast.hasOwnProperty('wind') ? jsonToTacForWind(tafChangeGroup.forecast.wind, true) || '' : '',
        disabled: !editable,
        classes: []
      },
      {
        name: 'changegroups-' + index + '-forecast-visibility',
        value: (tafChangeGroup.hasOwnProperty('forecast') && (tafChangeGroup.forecast.hasOwnProperty('caVOK') || tafChangeGroup.forecast.hasOwnProperty('visibility')))
          ? jsonToTacForCavok(tafChangeGroup.forecast.caVOK) || (jsonToTacForVisibility(tafChangeGroup.forecast.visibility, true) || '')
          : '',
        disabled: !editable,
        classes: []
      }
    ];
    for (let weatherIndex = 0; weatherIndex < 3; weatherIndex++) {
      columns.push({
        name: 'changegroups-' + index + '-forecast-weather-' + weatherIndex,
        value: (tafChangeGroup.hasOwnProperty('forecast') && tafChangeGroup.forecast.hasOwnProperty('weather'))
          ? (Array.isArray(tafChangeGroup.forecast.weather) && tafChangeGroup.forecast.weather.length > weatherIndex
            ? jsonToTacForWeather(tafChangeGroup.forecast.weather[weatherIndex], true) || ''
            : weatherIndex === 0
              ? jsonToTacForWeather(tafChangeGroup.forecast.weather, true) || '' // NSW
              : '')
          : '',
        disabled: !editable || (jsonToTacForWeather(tafChangeGroup.forecast.weather) && weatherIndex !== 0),
        classes: []
      });
    }
    for (let cloudsIndex = 0; cloudsIndex < 4; cloudsIndex++) {
      columns.push({
        name: 'changegroups-' + index + '-forecast-clouds-' + cloudsIndex,
        value: (tafChangeGroup.hasOwnProperty('forecast') && (tafChangeGroup.forecast.hasOwnProperty('vertical_visibility') || tafChangeGroup.forecast.hasOwnProperty('clouds')))
          ? jsonToTacForVerticalVisibility(tafChangeGroup.forecast.vertical_visibility) ||
            (Array.isArray(tafChangeGroup.forecast.clouds) && tafChangeGroup.forecast.clouds.length > cloudsIndex
              ? jsonToTacForClouds(tafChangeGroup.forecast.clouds[cloudsIndex], true) || ''
              : cloudsIndex === 0
                ? jsonToTacForClouds(tafChangeGroup.forecast.clouds, true) || '' // NSC
                : '')
          : '',
        disabled: !editable || (jsonToTacForClouds(tafChangeGroup.forecast.clouds) && cloudsIndex !== 0) ||
          (jsonToTacForVerticalVisibility(tafChangeGroup.forecast.vertical_visibility) && cloudsIndex !== 0),
        classes: [ (jsonToTacForVerticalVisibility(tafChangeGroup.forecast.vertical_visibility) && cloudsIndex !== 0) ? 'hideValue' : null ]
      });
    }
    columns.push(
      {
        name: 'changegroups-' + index + '-removable',
        value: editable ? '\uf00d' : '', // the remove icon
        disabled: !editable,
        isButton: true,
        classes: [ 'noselect' ]
      }
    );
    columns.forEach((column) => {
      column.isFocussed = column.name === focusedFieldName;
    });

    return <tr>
      {columns.map((col) =>
        <TafCell classes={col.classes} key={col.name} name={col.name} value={col.value} inputRef={inputRef} disabled={col.disabled} autoFocus={col.isFocussed} isSpan={col.isSpan} isButton={col.isButton} />
      )}
    </tr>;
  }
};

ChangeGroup.defaultProps = {
  tafChangeGroup: cloneDeep(TAF_TEMPLATES.CHANGE_GROUP),
  focusedFieldName: null,
  inputRef: () => {},
  index: -1,
  editable : false
};

ChangeGroup.propTypes = {
  tafChangeGroup: TAF_TYPES.CHANGE_GROUP.isRequired,
  focusedFieldName: PropTypes.string,
  inputRef: PropTypes.func,
  index: PropTypes.number,
  editable : PropTypes.bool
};

export default ChangeGroup;
