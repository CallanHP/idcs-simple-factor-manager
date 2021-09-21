import React, { Component } from 'react';
import "../css/modal.css";
import "../css/overlay.css";
import "../css/newfactor.css";
import "../css/button.css";

import {factorNames} from "../factorConstants";

import TrainStops from '../util/trainStops';
import NewFactorTypeSelector from './newFactorTypeSelection';
import NewOfflineTOPT from './factorEnrollment/newOfflineTOPT';
import NewOnlineTOPT from './factorEnrollment/newOnlineTOPT';
import NewPhoneNumber from './factorEnrollment/newPhoneNumber';

/*
 * Layout component for managing on-boarding new MFA Factors
 * Rendered as a modal with a train.
 */
export default class NewFactorLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      factorTypeIndex: 0,
      currentStep: 0
    };
    
    this.handleFactorTypeSelection = this.handleFactorTypeSelection.bind(this);
    this.handleNextStep = this.handleNextStep.bind(this);
    this.handleVerifyFactor = this.handleVerifyFactor.bind(this);
  }

  componentWillUnmount(){
    //Reset to the start of the flow
    this.setState({factorTypeIndex: 0, currentStep: 0});
  }

  handleFactorTypeSelection(newIndex){
    this.setState({factorTypeIndex:newIndex});
  }

  async handleNextStep(){
    //Shift to the new step, which is enrollment for step 0,
    //or completion for step 1
    if(this.state.currentStep == 0){
      //Initiate enrollment for the selected factor
      try{
        await this.props.initiateEnrollmentHandler(this.props.factors[this.state.factorTypeIndex]);
      }catch(err){
        console.error(err);
      }      
      this.setState({currentStep: 1});
    }else{
      //Do we need to do a cancellation if we go back? Assume no.
      this.setState({currentStep: this.state.currentStep-1});
    }
  }

  /*
   * Usually the verification is the last step, and there are a few different
   * factors that require verification - SMS and Offline App for instance.
   * Pass the factor up and disambiguate above this.
   * 
   * Actually need a return value to handle completion, but true/false is enough
   */
  async handleVerifyFactor(...args){
    try{
      var res = await this.props.verifyFactorHandler(this.props.factors[this.state.factorTypeIndex], args);
      return res;
    }catch (err){
      console.error(err);
      return false;
    }
  }

  render() {
    let pageContent;
    if(this.state.currentStep == 0){
      pageContent = (<NewFactorTypeSelector 
        factorList={this.props.factors}
        selectedFactor={this.state.factorTypeIndex}
        factorSelectionHandler={this.handleFactorTypeSelection}
      />);
    }else{
      switch(this.props.factors[this.state.factorTypeIndex]){
        case factorNames.offlineApp:
          pageContent = (<NewOfflineTOPT 
            enrollRequest={this.props.enrollmentState}
            verifyOtpHandler={this.handleVerifyFactor}
          />);
          break;
        case factorNames.onlineApp:
          pageContent = (<NewOnlineTOPT 
            enrollRequest={this.props.enrollmentState}
            verifyEnrollmentHandler={this.handleVerifyFactor}
          />);
          break;
        case factorNames.phone:
          pageContent = (<NewPhoneNumber
            getCountryCodesHandler={this.props.getCountryCodesHandler}
            countryCodes={this.props.countryCodes}
            verifyOtpHandler={this.handleVerifyFactor}
            initiateEnrollmentHandler={this.props.initiateEnrollmentHandler}
            factorType={this.props.factors[this.state.factorTypeIndex]}
          />);
          break;
        default:
          pageContent = (<div>Default Enroll Page</div>);
      }
    }
    return (
      <div className="overlay">
        <div className="new-factor-layout">
          <div className="modal-header">Add New Factor</div>
          <div className="modal-content">
            <TrainStops 
              steps={["Select Factor", "Complete Enrollment"]}
              currentStep={this.state.currentStep}
            />
            {pageContent}
          </div>
          <div className="modal-footer">
            <div 
              className="small-button"
              onClick={this.handleNextStep}
            >{this.state.currentStep==0?"Next":"Back"}</div>
            <div 
              className="small-button"
              onClick={this.props.cancelHandler}
            >Cancel</div>
          </div>
        </div>
      </div>
    );
  }
}