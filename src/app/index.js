import React, { Component } from 'react';
import FactorManagementLayout from './factorManagementLayout';

export default class App extends Component {
  render() {
    return (
      <FactorManagementLayout {...this.props} />
    );
    //return (<div><h3>Test</h3></div>);
  }
}