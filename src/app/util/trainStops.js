import React, { Component } from 'react';
import PropTypes from 'prop-types';

import "../css/train.css";

/*
 * Helper component for rendering a train with individual steps
 *
 * Props:
 * 
 */
export default class TrainStops extends Component {
  constructor(props){
    super(props);
    this.handleClick=this.handleClick.bind(this);
  }

  handleClick(stepNum){
    if(this.props.handleStepSelect){
      this.props.handleStepSelect(stepNum);
    }    
  }

  render() {
    var self=this;
    var steps = this.props.steps.map((step,i) => {
      return (
        <div 
          className="train-step"
          key={"step" + i}
          onClick={()=>{self.handleClick(i)}}
        >
          <div className="train-dot">
            <div className="train-connector"/>
            <div className={"train-number" +(i==self.props.currentStep?" current-train-step":"")}>{i+1}</div>
            <div className="train-connector"/>
          </div>
          <div className="train-step-label">
            {step}
          </div>
        </div>);
    });
    return (
      <div className="train">
        {steps}
      </div>
    );
  }
}

TrainStops.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentStep: PropTypes.number,
  handleStepSelect: PropTypes.func
}