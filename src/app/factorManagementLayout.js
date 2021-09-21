import React, { Component } from 'react';
import "./css/app.css";

import DevicesLayout from './devices/devicesLayout';
import MfaStatus from './factors/mfaStatus';
import NewFactorLayout from './factors/newFactorLayout';

import ProgressSpinner from './util/progressSpinner';

import {factorNames, factorEnrollmentDetails} from './factorConstants';


/*
 * Factor Layout is our base layout class, and is responsible for 
 * communicating with IDCS. It stores the base factors for a user
 * and provides a handler for calling into IDCS in the right
 * context.
 */
export default class FactorManagementLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
      //Default MFA settings to help load the page
      mfaSettings: {
        preferredDevice: {},
        mfaStatus: "DISABLED",
        preferredAuthenticationFactor: "EMAIL",
        devices: []
      },
      enrollmentState: {},
      username: "",
      userId: "",
      statusMessage: null,
      validFactors: null,
      countryCodes: []
    };

    this.callIDCS = this.callIDCS.bind(this);
    this.updatePreferredDevice = this.updatePreferredDevice.bind(this);
    this.unenrollDevice = this.unenrollDevice.bind(this);
    this.addNewFactor = this.addNewFactor.bind(this);
    this.cancelAddFactor = this.cancelAddFactor.bind(this);
    this.initiateEnrollment = this.initiateEnrollment.bind(this);
    this.verifyFactor = this.verifyFactor.bind(this);
    this.getCountryCodes = this.getCountryCodes.bind(this);
  }

  async componentDidMount(){
    try{
      const factors = await this.callIDCS("GET", 
        "/admin/v1/Me?attributes=urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User:preferredDevice,"
        +"urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User:preferredAuthenticationFactor,"
        +"urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User:mfaStatus,"
        +"urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User:devices,"
        +"urn:ietf:params:scim:schemas:oracle:idcs:extension:securityQuestions:User:secQuestions", null, true);
      let mfaSettings = {}
      //Apply defaults
      mfaSettings.devices = factors["urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User"].devices || [];
      mfaSettings.mfaStatus = factors["urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User"].mfaStatus || "DISABLED";
      mfaSettings.preferredDevice = factors["urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User"].preferredDevice || {};
      mfaSettings.preferredAuthenticationFactor = factors["urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User"].preferredAuthenticationFactor || "EMAIL";
      this.setState({
        mfaSettings:mfaSettings,
        username: factors.userName || "unknown",
        userId: factors.id || ""
      });
    }catch(err){
      console.err(err);
    }
  }


  //This class needs to handle requests from the subcomponents
  async callIDCS(method, path, payload, lockUI) {
    //console.log("Submitting: " + JSON.stringify(args));
    if(lockUI){
      this.setState({ submitting: true });
    }
    //Pass down 'please wait' to prevent double submissions
    var headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Authorization", "Bearer " +this.props.token);
    //Submit via fetch
    try{
      let idcsRes = await fetch(this.props.idcsUrl +path, {
        method: method,
        headers: headers,
        body: payload ? payload : null
      });
      let idcsJson = null;
      //TODO: Handle 401 for token expiry here
      if(idcsRes.status != 204){
        idcsJson = await idcsRes.json();
      }
      //Remove the lock
      if(lockUI){
        this.setState({
          submitting: false,
          statusMessage: ""
        });
      }      
      return idcsJson;
    } catch(err) {
      //Handle explosions.
      console.error(err);
    };
  }

  async addNewFactor(){
    if(this.state.addNewFactor){
      return;
    }
    //If we have already populated the Authentication Factors list,
    //don't call out to IDCS.
    if(this.state.validFactors && this.state.validFactors.length != 0){
      this.setState({showAddFactor:true});
      return;
    }
    try{
      var res = await this.callIDCS("GET", 
        "/admin/v1/AuthenticationFactorSettings/AuthenticationFactorSettings?attributes="
        +"smsEnabled,phoneCallEnabled,totpEnabled,pushEnabled,securityQuestionsEnabled,"
        +"emailEnabled,fidoAuthenticatorEnabled,bypassCodeEnabled", null, true);
      //Parse the booleans into a list of valid factors
      var validFactors = [];
      if(res["toptEnabled"] || res["pushEnabled"]){
        validFactors.push(factorNames.onlineApp);
        validFactors.push(factorNames.offlineApp);
      }
      if(res["smsEnabled"] || res["phoneCallEnabled"]){
        validFactors.push(factorNames.phone);
      }
      if(res["securityQuestionsEnabled"]){
        validFactors.push(factorNames.securityQuestions);
      }
      //TODO: FIDO? BYPASS? EMAIL? Third party?
      //Other TODO: check max devices
      if(validFactors.length == 0){
        //Handle error scenario?

      }
      this.setState({showAddFactor:true, validFactors:validFactors});
    }catch (err){
      //Handle explosions.
      console.error(err);
    }
  }

  async verifyFactor(factor, args){
    if(!this.state.enrollmentState?.deviceId || !this.state.enrollmentState?.requestId ){
      console.error("Attempting to verify a factor with invalid enrollment state!")
      return false;
    }
    var body = {
      "schemas": [
        "urn:ietf:params:scim:schemas:oracle:idcs:AuthenticationFactorValidator"
      ],
      "deviceId": this.state.enrollmentState.deviceId,
      "requestId": this.state.enrollmentState.requestId,
      "scenario": "ENROLLMENT"
    };
    //Yep, authFactor versus authnFactor...
    body.authFactor = factorEnrollmentDetails[factor].authnFactors[0];
    //TODO: Validate params for the factor...
    body = factorEnrollmentDetails[factor].mapVerifyOptions(body, args)
    try{
      let res = await this.callIDCS("POST", "/admin/v1/MyAuthenticationFactorValidator", JSON.stringify(body), true);
      if(res.status != "SUCCESS"){
        return false;
      }
      //We have enough data in the response to create a new device, to save an IDCS call
      let newDevice = {
        display: res.displayName,
        value: res.deviceId,
        factorStatus: res.mfaStatus,
        factorType: res.authFactor
      }
      //Crude object clone
      let newSettings = JSON.parse(JSON.stringify(this.state.mfaSettings));
      newSettings.devices.push(newDevice);
      //PUSH enrolls TOPT by default
      if(factor == factorNames.onlineApp){
        newDevice.factorType = "TOPT";
        newSettings.devices.push(newDevice);
      }
      //SMS enrolls PHONE_CALL by default
      if(factor == factorNames.phone){
        newDevice.factorType = "PHONE_CALL";
        newSettings.devices.push(newDevice);
      }
      newSettings.preferredAuthenticationFactor = res.mfaPreferredAuthenticationFactor,
      newSettings.preferredDevice = {value: res.mfaPreferredDevice}
      this.setState({mfaSettings:newSettings, showAddFactor:false});
      return true;
    }catch(err){
      throw err;
    }
  }

  cancelAddFactor(){
    this.setState({showAddFactor:false})
  }

  async initiateEnrollment(factorType, ...args){
    //Some factors enrollment to be initated in IDCS without more information,
    //others need more details that we gathered later
    if(!factorEnrollmentDetails[factorType].enrollNoDetails && args.length == 0){
      return;
    }
    let body = {
      "schemas": [
        "urn:ietf:params:scim:schemas:oracle:idcs:AuthenticationFactorEnroller"
      ],
      "user": {
        "value": this.state.userId
      },
      "authnFactors": factorEnrollmentDetails[factorType].authnFactors
    };
    body = factorEnrollmentDetails[factorType].mapEnrollOptions(body, args)
    try{
      var res = await this.callIDCS("POST", "/admin/v1/MyAuthenticationFactorEnroller", JSON.stringify(body), true);
      //Needs non-happy state handling here!
      this.setState({enrollmentState:res});
      //If we need to kick something off using 'MyAuthenticationFactorInitiator'...
      if(factorEnrollmentDetails[factorType].requiresInitiation){
        let initiateBody = {
          "schemas":["urn:ietf:params:scim:schemas:oracle:idcs:AuthenticationFactorInitiator"],
          "deviceId": this.state.enrollmentState.deviceId,
          "requestId": this.state.enrollmentState.requestId,
          "userName": this.state.username,
          "authFactor": factorEnrollmentDetails[factorType].authnFactors[0]
        }
        res = await this.callIDCS("POST", "/admin/v1/MyAuthenticationFactorInitiator", JSON.stringify(initiateBody), true);
      }
    }catch(err){
      console.error(err);
    }
  }

  async unenrollDevice(deviceId){
    try{
      var res = await this.callIDCS("DELETE", "/admin/v1/MyDevices/" +deviceId, null, true);
      console.log(res);
      //Crude object clone
      let newMFASettings = JSON.parse(JSON.stringify(this.state.mfaSettings));
      newMFASettings.devices = newMFASettings.devices.filter(device => device.value != deviceId)
      this.setState({mfaSettings:newMFASettings});
    }catch(err){
      console.error(err);
    }
  }

  async updatePreferredDevice(deviceId, factorType){
    const body = { 
      schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      Operations: [
        { 
          op: "replace",
          path: "urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User:preferredAuthenticationFactor",
          value: factorType
        },
        { 
          op: "replace",
          path: "urn:ietf:params:scim:schemas:oracle:idcs:extension:mfa:User:preferredDevice",
          value: { value: deviceId }
        }
      ]
    };
    try{
      var res = await this.callIDCS("PATCH", "/admin/v1/Me", JSON.stringify(body), true);
      //Crude object clone
      let newMFASettings = JSON.parse(JSON.stringify(this.state.mfaSettings));
      newMFASettings.preferredDevice.value = deviceId;
      newMFASettings.preferredAuthenticationFactor = factorType;
      this.setState({mfaSettings:newMFASettings});
    }catch(err){
      console.error(err);
    }
  }

  async getCountryCodes(){
    try{
      let res = await this.callIDCS("GET", 
      "/admin/v1/AllowedValues/countrycodes?attributes=attrValues.value,attrValues.label", null, true);
      if(res.attrValues){
        this.setState({countryCodes:res.attrValues});
      }
    }catch(err){
      //Handle fireworks...
      console.log(err);
    }
    
    
  }

  render() {
    var progressSpinner = this.state.submitting ? (<ProgressSpinner />) : null;
    var newFactor = this.state.showAddFactor ? (<NewFactorLayout 
      factors={this.state.validFactors || []}
      enrollmentState={this.state.enrollmentState}
      countryCodes={this.state.countryCodes}
      initiateEnrollmentHandler={this.initiateEnrollment}
      verifyFactorHandler={this.verifyFactor}
      getCountryCodesHandler={this.getCountryCodes}
      cancelHandler={this.cancelAddFactor}
    />) : null;
    return (
      <div className="factor-layout">
        {progressSpinner}
        {newFactor}
        <MfaStatus 
          username={this.state.username} 
          mfaEnabled={this.state.mfaSettings.mfaStatus}
        />
        <DevicesLayout 
          devices={this.state.mfaSettings?.devices || []}
          preferredDevice={this.state.mfaSettings.preferredDevice}
          preferredFactor={this.state.mfaSettings.preferredAuthenticationFactor} 
          preferredDeviceHandler={this.updatePreferredDevice}
          unenrollDeviceHandler={this.unenrollDevice}
          addDeviceHandler={this.addNewFactor}
        />
      </div>
    );
  }
}