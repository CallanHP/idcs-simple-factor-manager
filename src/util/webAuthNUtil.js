/*
 * Set of utility functions for WebAuthN to make the code more readable.
 */
const crypto = require('crypto');
const { default: UsernamePasswordForm } = require('../app/login/usernamePasswordForm');

const DEFAULT_TIMEOUT = 60000;

/*
 * Generate a formatted PublicKeyCredentialRequestOptions object
 * for performing client auth.
 * 
 * I think 'public key' challenge can be hardcoded? Probably version dependent.
 */
module.exports.generatePubKeyCredReq = function(credId, rpId, timeout){
  //Challenge is sent as base64 for transmission over the wire, we
  //need to make sure to convert to UInt8Array at both ends
  var challenge = crypto.randomBytes(128).toString('base64');
  return {
    publicKey:{
      allowCredentials:[{
        id: credId,
        type: "public-key"
      }],
      challenge: challenge,
      rpId: rpId,
      timeout: timeout || DEFAULT_TIMEOUT,
      userVerification: "preferred"
    }
  };
}

module.exports.generatePubKeyCredCreation = function(userName, userId, rpId, rpName, timeout){
  if(typeof rpName == 'number'){
    timeout = rpName;
    rpName = null;
  }
  //Challenge is sent as base64 for transmission over the wire, we
  //need to make sure to convert to UInt8Array at both ends
  var challenge = crypto.randomBytes(128).toString('base64');
  return {
    publicKey:{
      attestation: "direct",
      authenticatorSelection: {
        authenticatorAttachment: "cross-platform",
        requireResidentKey: false,
        userVerification: "preferred"
      },
      challenge: challenge,
      excludeCredentials: [],
      pubKeyCredParams: [
        {
          alg: -7, //ECDSA w/ SHA-256 (https://www.iana.org/assignments/cose/cose.xhtml#algorithms)
          type: "public-key"
        }
      ],      
      rp: {
        id: rpId,
        name: rpName || "IDCS WebAuthN Demo"
      },
      timeout: timeout || DEFAULT_TIMEOUT,
      user: {
        displayName: userName,
        id: userId
      }
    }
  };
}

module.exports.parseAttestationObject = function(obj){
  //Yey! Byte-wise parsing!
  return {};
}