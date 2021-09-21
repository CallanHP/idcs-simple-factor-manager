import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EnrollQR from './enrollQR';

import "../../css/button.css";
import "../../css/newfactor.css";

const POLL_INTERVAL = 5000;

/*
 * Simple component to show the username and whether MFA has been enabled
 */
export default class NewOnlineTOPT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pollIntervalId: null
    };
    this.pollForUpdate = this.pollForUpdate.bind(this);
  }

  componentDidMount() {
    let intervalId = setInterval(this.pollForUpdate, 5000);
    this.setState({pollIntervalId: intervalId});
  }

  componentWillUnmount(){
    //Safety clear of the polling instruction
    if(this.state.pollIntervalId){
      clearInterval(this.state.pollIntervalId);  
    }    
  }

  async pollForUpdate(){
    let enrolled = await this.props.verifyEnrollmentHandler();
    if(enrolled){
      //Clear the interval
      clearInterval(this.state.pollIntervalId);
    }
  }

  render() {
    return (
        <div className="">
          Open Oracle Mobile Authenticator and scan the below QR Code.
          <EnrollQR 
            type={this.props.enrollRequest.qrCodeImgType}
            imageData={this.props.enrollRequest.qrCodeImgContent}
          />
        </div>
    );
  }
}

NewOnlineTOPT.propTypes = {
  enrollRequest: PropTypes.object,
}