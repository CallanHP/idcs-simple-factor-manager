import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "../css/status.css"

/*
 * Simple component to show the username and whether MFA has been enabled
 */
export default class MfaStatus extends Component {
  render() {
    return (
        <div className="status-holder">
          <div className="status-layout">
          <p>{this.props.username}</p>
          <div 
            className={"status-indicator " +(this.props.mfaEnabled == "ENROLLED" ? "status-good" : "status-bad")} 
            title={"MFA is " +this.props.mfaEnabled}
          />
          </div>
        </div>
    );
  }
}

MfaStatus.propTypes = {
  username: PropTypes.string,
  mfaEnabled: PropTypes.string
}