import React, { PureComponent } from 'react';
import { Button, Row } from 'reactstrap';
import Icon from 'react-fa';
import PropTypes from 'prop-types';
import { hashHistory } from 'react-router';

class ContainerHeader extends PureComponent {
  render () {
    const { dispatch, actions, isContainerOpen } = this.props;
    return <Row className='ContainerHeader'>
      <Button
        color='primary'
        onClick={(evt) => dispatch(actions.toggleContainerAction(evt))}
        title={isContainerOpen ? 'Collapse AIRMET panel' : 'Expand AIRMET panel'}>
        <Icon name={isContainerOpen ? 'angle-double-left' : 'angle-double-right'} />
      </Button>
      <Button
        color='primary'
        onClick={() => hashHistory.push('/')}
        title='Close AIRMET panel'>
        <Icon name={'times'} />
      </Button>
      <Button
        color='primary'
        onClick={(evt) => dispatch(actions.retrieveAirmetsAction())}
        title='Synchronize AIRMETs from server'>
        <Icon name={'refresh'} />
      </Button>
    </Row>;
  }
}

ContainerHeader.propTypes = {
  isContainerOpen: PropTypes.bool,
  dispatch: PropTypes.func,
  actions: PropTypes.shape({
    toggleContainerAction: PropTypes.func
  })
};

export default ContainerHeader;
