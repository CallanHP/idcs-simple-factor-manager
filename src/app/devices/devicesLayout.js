import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "../css/device.css";
import "../css/button.css";
import DeviceDetail from './deviceDetail';


/*
 * Layout component for managing the user's devices
 */
export default class DevicesLayout extends Component {
  render() {
    var self=this;
    var devices = this.props.devices.map((device, i) => {
      return (<DeviceDetail
        device={device}
        preferred={self.props.preferredDevice.value == device.value
          && self.props.preferredFactor == device.factorType}
        key={"device" + i}
        setPreferredHandler={self.props.preferredDeviceHandler}
        unenrollDeviceHandler={self.props.unenrollDeviceHandler}
      />);
    })
    return (
      <div className="device-list-holder">
        <div className="device-header">
          <p>Devices:</p>
          <div 
            className="add-device flat-button"
            onClick={this.props.addDeviceHandler}
          >
            Add Device
          </div>
        </div>
        <div className="device-list">
          {devices}
        </div>
      </div>
    );
  }
}

DevicesLayout.propTypes = {
  devices: PropTypes.arrayOf(PropTypes.object).isRequired,
  setPreferredHandler: PropTypes.func,
  unenrollDeviceHandler: PropTypes.func
}