import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EnrollQR from './enrollQR';

import "../../css/button.css";
import "../../css/select.css";
import "../../css/newfactor.css";


/*
 * Simple component to show the username and whether MFA has been enabled
 */
export default class NewPhoneNumber extends Component {
  constructor(props) {
    super(props);
    this.state = {
      smsSent: false,
      countryCode: "",
      phoneNumber: "",
      otpValue: "",
      otpNotValid: false
    };

    this.handleSelect = this.handleSelect.bind(this);
    this.handlePhoneChange = this.handlePhoneChange.bind(this);
    this.initiateSMS = this.initiateSMS.bind(this);
    this.handleOtpChange = this.handleOtpChange.bind(this);
    this.verifyOtp = this.verifyOtp.bind(this);
  }

  componentDidMount(){
    if(this.props.countryCodes?.length == 0){
      this.props.getCountryCodesHandler();
    }
  }

  componentWillUnmount(){
    //Reset defaults on unload
    this.setState({smsSent:false, phoneNumber:"", countryCode: ""})
  }

  handleSelect(e){
    this.setState({countryCode:e.target.value});
  }

  handlePhoneChange(e){
    this.setState({phoneNumber: e.target.value});
  }

  initiateSMS(){
    if(this.state.smsSent){
      return;
    }
    this.setState({smsSent:true});
    this.props.initiateEnrollmentHandler(this.props.factorType, this.state.countryCode, this.state.phoneNumber);
    return;
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
    let countryCodes = this.props.countryCodes.map((code, i) => (
      <option value={code.value} key={"countryCode" +i}>{code.label}</option>
    ))
    return (
        <div className="new-factor-content">
          Enter a mobile number, then click 'Send Code' to send an SMS with an OTP.
          <div className="inline-input-button">
            <select 
              className="flat-select inline"
              onChange={this.handleSelect}
              value={this.state.countryCode}
            >
              {countryCodes}
            </select>
            <input 
              type="text"
              className="flat-input"
              onChange={this.handlePhoneChange}
              value={this.state.phoneNumber}
            />
            <div 
              className={"flat-button action" +(this.state.smsSent?" disabled":"")}
              onClick={this.initiateSMS}
            >Send Code</div>
          </div>
          Enter the OTP sent by SMS below:
          <div className="inline-input-button">
            <input 
              type="text"
              className={"flat-input" +(this.state.otpNotValid?" invalid":"")}
              onChange={this.handleOtpChange}
              value={this.state.otpValue}
            />
            <div 
              className={"flat-button action"+(!this.state.smsSent?" disabled":"")}
              onClick={this.verifyOtp}
            >Verify</div>
          </div>
        </div>
    );
  }
}

NewPhoneNumber.propTypes = {
  enrollRequest: PropTypes.object,
  countryCodes: PropTypes.arrayOf(PropTypes.object),
  getCountryCodesHandler: PropTypes.func
}