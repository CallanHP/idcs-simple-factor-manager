import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EnrollQR from './enrollQR';

import "../../css/button.css";
import "../../css/newfactor.css";

/*
 * Simple component to show the username and whether MFA has been enabled
 */
export default class NewOfflineTOPT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      otpValue: "",
      otpNotValid: false
    };
    this.handleOtpChange = this.handleOtpChange.bind(this);
    this.verifyOtp = this.verifyOtp.bind(this);
  }

  handleOtpChange(e){
    this.setState({otpValue: e.target.value});
  }

  async verifyOtp(){
    if(this.state.otpValue){
      var verifyRes = await this.props.verifyOtpHandler(this.state.otpValue);
      if(!verifyRes){
        //Make the box red or something?
        this.setState({otpNotValid:true});
      }
      //No need to handle a different situation, if this worked, the window
      //should be closed
    }
  }

  render() {
    return (
        <div className="new-factor-content">
          Open your authenticator application and scan the below QR Code.
          <EnrollQR 
            type={this.props.enrollRequest.qrCodeImgType}
            imageData={this.props.enrollRequest.qrCodeImgContent}
          />
          Enter the OTP code supplied by the application below:
          <div className="inline-input-button">
            <input 
              type="text"
              className={"flat-input" +(this.state.otpNotValid?" invalid":"")}
              onChange={this.handleOtpChange}
              value={this.state.otpValue}
            />
            <div 
              className="flat-button action"
              onClick={this.verifyOtp}
            >Verify</div>
          </div>
        </div>
    );
  }
}

NewOfflineTOPT.propTypes = {
  enrollRequest: PropTypes.object,
  verifyOtpHandler: PropTypes.func
}