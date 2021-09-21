import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "../css/radio.css";
import { factorEnrollmentDetails } from '../factorConstants';

/*
 * Selector for which new factor is being added
 */
export default class NewFactorTypeSelector extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    var self=this;
    var factors = this.props.factorList.map((factor, i) => {
      return (
        <div 
          className="new-factor-content"
          key={"factor" +i}
        >
          <div
            className="radio-label"
            onClick={()=>self.props.factorSelectionHandler(i)}
          >
            <div className="radio-label-circle">
              <div className={"radio-label-radio" +(i==self.props.selectedFactor?" selected":"")} />
            </div>
            {factorEnrollmentDetails[factor].enrollmentDisplay}
          </div>
        </div>
      )
    })
    return (
      <div>
        {factors}
      </div>
    );
  }
}

NewFactorTypeSelector.propTypes = {
  factorList: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedFactor: PropTypes.number.isRequired,
  factorSelectionHandler: PropTypes.func.isRequired
}