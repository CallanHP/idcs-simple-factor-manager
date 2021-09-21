import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {Buffer} from 'buffer';

import "../../css/qrcode.css";

/*
 * Helper component for displaying a QR code for registraton
 */
export default class EnrollQR extends Component {
  render() {
    //The attribute qrCodeImgContent is double base64 encoded, so needs decoding...
    let imageData = Buffer.from(this.props.imageData, 'base64').toString('utf8');
    return (
        <div className="enroll-qr">
          <img src={"data:image/" +this.props.type.toLowerCase() +";base64, " +imageData}/>
        </div>
    );
  }
}

EnrollQR.propTypes = {
  type: PropTypes.string,
  imageData: PropTypes.string
}