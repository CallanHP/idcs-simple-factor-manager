import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "../css/modal.css";
import "../css/confirm.css";


/*
 * Helper component for rendering a confirmation
 */
export default class ConfirmationDialog extends Component {
  render() {
    return (
      <div className="overlay">
        <div className="confim-layout">
          <div className="modal-header">
            {this.props.title}
          </div>
          <div className="modal-content">
            {this.props.message}
          </div>
          <div className="modal-footer">
            <button onClick={this.props.confirmationHandler}>Ok</button>
            <button onClick={this.props.cancelHandler}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }
}

ConfirmationDialog.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  confirmationHandler: PropTypes.func.isRequired,
  cancelHandler: PropTypes.func.isRequired
}