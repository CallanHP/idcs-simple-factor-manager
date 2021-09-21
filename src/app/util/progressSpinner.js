import React, { Component } from 'react';
import "../css/progress.css";
import "../css/overlay.css";

/*
 * Helper component for rendering a progress spinner
 */
export default class ProgressSpinner extends Component {
  render() {
    return (
      <div className="overlay">
        <div className="progress-display">
          <div className="sk-cube-grid">
            <div className="sk-cube sk-cube1"></div>
            <div className="sk-cube sk-cube2"></div>
            <div className="sk-cube sk-cube3"></div>
            <div className="sk-cube sk-cube4"></div>
            <div className="sk-cube sk-cube5"></div>
            <div className="sk-cube sk-cube6"></div>
            <div className="sk-cube sk-cube7"></div>
            <div className="sk-cube sk-cube8"></div>
            <div className="sk-cube sk-cube9"></div>
          </div>
        </div>
      </div>
    );
  }
}