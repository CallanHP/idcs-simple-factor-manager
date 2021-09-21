import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "../css/device.css";
import "../css/status.css";
import "../css/button.css";
import ConfirmationDialog from '../util/confirmationDialog';


/*
 * Component for handling individual devices
 */
export default class DeviceDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayUnenrollConfirmation:false
    };
    this.setPreferred = this.setPreferred.bind(this);
    this.unenrollDevice = this.unenrollDevice.bind(this);
    this.confirmUnenroll = this.confirmUnenroll.bind(this);
    this.cancelUnenroll = this.cancelUnenroll.bind(this);
  }

  setPreferred(){
    if(!this.props.preferred){
      this.props.setPreferredHandler(this.props.device.value, this.props.device.factorType);
    }    
  }

  unenrollDevice(){
    this.setState({displayUnenrollConfirmation:true});
  }

  confirmUnenroll(){
    this.setState({displayUnenrollConfirmation:false});
    this.props.unenrollDeviceHandler(this.props.device.value);
  }

  cancelUnenroll(){
    this.setState({displayUnenrollConfirmation:false});
  }

  render() {
    var self = this;
    var confirmUnenroll = null;
    if(this.state.displayUnenrollConfirmation){
      confirmUnenroll = (<ConfirmationDialog 
        title={"Confirm Unenroll Device: " +this.props.device.display}
        message="Unenrolling a factor will remove all challenge types associated with this device. Are you sure you wish to continue?"
        confirmationHandler={self.confirmUnenroll}
        cancelHandler={self.cancelUnenroll}
      />);
    }
    return (
      <div 
        className={"device-item" +(this.props.preferred ? " device-prefer":"")} 
        title={this.props.preferred?"Preferred Authentication Factor":""}
      >
        {confirmUnenroll}
        <dl className="device-details">
          <dt>Device</dt>
          <dd>{this.props.device.display}</dd>
        </dl>
        <dl className="device-details">
          <dt>Status</dt>
          <dd>
            <div 
              className={"status-indicator " +(this.props.device.factorStatus == "ENROLLED" ? "status-good" : "status-bad")} 
              title={"Device is " +this.props.device.factorStatus}
            />
          </dd>
        </dl>
        <dl className="device-details">
          <dt>Challenge Type</dt>
          <dd>{this.props.device.factorType}</dd>
        </dl>
        <div className="device-item-footer">
          <div 
            className={"small-button" + (this.props.preferred?" disabled":"")}
            disabled={this.props.preferred}
            onClick={self.setPreferred}
            title="Make this the preferred authentication factor."
          >Make Preferred</div>
          <div
            className="small-button"
            onClick={self.unenrollDevice}
            title="Unenroll this device."
          >Unenroll</div>
        </div>
      </div>
    );
  }
}

DeviceDetail.propTypes = {
  device: PropTypes.object.isRequired,
  setPreferredHandler: PropTypes.func,
  unenrollDeviceHandler: PropTypes.func
}