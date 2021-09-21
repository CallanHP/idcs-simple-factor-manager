/*
 * Set of utility functions for IDCS.
 */
const fetch = require('node-fetch');
const crypto = require('crypto');
const log4js = require('log4js');
const errorConstants = require('../errorConstants')

const logger = log4js.getLogger("idcsUtil.js");
logger.level = process.env.log_level || "info";

const defaultScopes = ["urn:opc:idm:__myscopes__"];

const IDCSDEFAULTSIGNKID = "SIGNING_KEY";
const PEMCERTPRE = "-----BEGIN CERTIFICATE-----\n";
const PEMCERTPOST = "\n-----END CERTIFICATE-----";

const IDCSAUTHNFAILCONTENTTYPE = "text/html";

//Built as a class in order to maintain its own token internally
function idcsUtil(config) {
  //validate the config
  if (!config || !config.base_url || !config.client_id || !config.client_secret) {
    var e = new Error("Invalid IDCS Config!");
    e.code = errorConstants.INVALID_IDCS_CONFIG;
    throw e;
  }
  this.config = config;
  this.clientToken = null;
  this.obfuscationKey = null;
  this.signingCert = null;
}

/*
 * Sets up the class with an initial client token.
 */
idcsUtil.prototype.initialise = function () {
  logger.debug("Initialising the IDCS class with client token and signing keys.")
  var self = this;
  return new Promise(function (resolve, reject) {
    this._getClientToken().then(function (token) {
      //get the JWK
      this._getSigningCert().then(function () {
        resolve();
      }).catch(function (err) {
        reject(err);
      })
    }.bind(self)).catch(function (err) {
      reject(err);
    })
  }.bind(self));

}


/*
 * Internal wrapper around request - to handle token rotation if required
 */
idcsUtil.prototype._callIDCSEndpoint = function (requestOptions) {
  var self = this;
  return new Promise(function (resolve, reject) {
    fetch(requestOptions.url, requestOptions).then(res => {
      //Can't rely on the status code, since invalid credential submission also returns 401,
      //can use the content type though - since it returns html for an invalid token
      if (res.statusCode == 401 && res.headers["Content-Type"] == IDCSAUTHNFAILCONTENTTYPE) {
        logger.info("IDCS Token expired - requesting a new token.");
        //Our token has expired!
        this._obtainClientToken().then(newToken => {
          //Try again! Updating the authorization header
          logger.info("Obtained a new IDCS Token - repeating the failed invocation.");
          var newRequestOptions = requestOptions;
          newRequestOptions.headers["Authorization"] = 'Bearer ' + newToken;
          fetch(newRequestOptions.url, newRequestOptions).then(res => {
            //Other functions are calling JSON.parse() themselves, and in theory could use
            //endpoints which aren't JSON, so we will just treat the body as text
            res.text().then(data => {
              return resolve({ res: res, data: data });
            });
          });
        });
      } else {
        res.text().then(data => {
          return resolve({ res: res, data: data });
        });
      }
    }).catch(err => { return reject(err) });
  }.bind(self));
}

/*
 * Use the class config to exchange an authz code for an access token
 * for the user.
 */
idcsUtil.prototype.getAccessToken = function(code) {
  var self = this;
  return new Promise(function (resolve, reject){
    var form = {
      'grant_type': 'authorization_code',
      'code': code
    };
    var options = {
      url: this.config.base_url + '/oauth2/v1/token',
      method: "POST",
      headers: {
        'Authorization': 'Basic ' + Buffer.from(this.config.client_id + ':' + this.config.client_secret, 'utf8').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: Object.entries(form).map(v => v.join('=')).join('&')
    };
    logger.debug("Invoking IDCS to obtain access token.");
    fetch(options.url, options).then(res => {
      if (res.statusCode == 401) {
        var e = new Error("Failed to obtain token, unauthorised!");
        e.code = errorConstants.IDCS_AUTHN_FAILED;
        throw e;
      }
      return res.json();
    }).then(jsonBody => {
      if (jsonBody.access_token) {
        return resolve(jsonBody.access_token);
      } else {
        var e = new Error("Response from IDCS didn't include an access token!");
        e.code = errorConstants.NO_TOKEN_FROM_IDCS;
        throw e;
      }
    }).catch(err => {
      return reject(err);
    });
  }.bind(self));
}

/*
 * Internal function for obtaining a client token if required
 */
idcsUtil.prototype._getClientToken = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (this.clientToken != null) {
      logger.debug("Client token was not null, returning it.")
      return resolve(this.clientToken);
    }
    logger.debug("Client token was null, retreiving a new one from IDCS.")
    this._obtainClientToken().then(function (token) {
      this.clientToken = token;
      return resolve(this.clientToken);
    }.bind(self)).catch((err) => {
      return reject(err);
    });
  }.bind(self));

}

/*
 * Internal Client token helper - obtains the token from IDCS
 */
idcsUtil.prototype._obtainClientToken = function () {
  var self = this;
  return new Promise(function (resolve, reject) {
    var form = {
      'grant_type': 'client_credentials',
      'scope': this.config.client_scopes ? this.config.client_scopes.join(' ') : defaultScopes.join(' ')
    };
    var options = {
      url: this.config.base_url + '/oauth2/v1/token',
      method: "POST",
      headers: {
        'Authorization': 'Basic ' + Buffer.from(this.config.client_id + ':' + this.config.client_secret, 'utf8').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: Object.entries(form).map(v => v.join('=')).join('&')
    };
    logger.debug("Invoking IDCS to obtain client token.");
    fetch(options.url, options).then(res => {
      if (res.statusCode == 401) {
        var e = new Error("Failed to obtain token, unauthorised!");
        e.code = errorConstants.IDCS_AUTHN_FAILED;
        throw e;
      }
      return res.json();
    }).then(jsonBody => {
      if (jsonBody.access_token) {
        return resolve(jsonBody.access_token);
      } else {
        var e = new Error("Response from IDCS didn't include an access token!");
        e.code = errorConstants.NO_TOKEN_FROM_IDCS;
        throw e;
      }
    }).catch(err => {
      return reject(err);
    });
  }.bind(self));

}

/*
 * Obtain the signing cert from the IDCS JWK endpoint
 */
idcsUtil.prototype._getSigningCert = function () {
  return new Promise((resolve, reject) => {
    var options = {
      url: this.config.base_url + '/admin/v1/SigningCert/jwk',
      method: "GET",
      headers: {
        'Authorization': 'Bearer ' + this.clientToken,
        'Accept': 'application/json'
      }
    };
    logger.debug("Invoking IDCS to obtain JWK.")
    fetch(options.url, options).then(res => {
      if (res.statusCode == 401) {
        var e = new Error("Failed to obtain JWK, unauthorised!");
        e.code = 'EUNAUTH';
        throw e;
      }
      return res.json();
    }).then(jsonBody => {
      if (jsonBody.keys && Array.isArray(jsonBody.keys) && jsonBody.keys.length > 0) {
        for (var key of jsonBody.keys) {
          if (key.kid == IDCSDEFAULTSIGNKID) {
            //Should probably validate the cert-chain... but...
            //Instead simply validate thet the cert works
            var cert = PEMCERTPRE + key.x5c[0] + PEMCERTPOST;
            try {
              crypto.publicEncrypt(cert, Buffer.from("test"));
            } catch (ex) {
              logger.error("Error validating signing cert obtained from the IDCS JWK endpoint");
              logger.error(ex);
              var e = new Error("Signing Cert received from IDCS seems to be malformed.");
              e.code = errorConstants.IDCS_KEY_INVALID;
              throw e;
            }
            logger.debug("Obtained signing cert and tested ok.")
            this.signingCert = cert;
            return resolve(cert);
          }
        }
        //If we didn't find the signing key...
        var e = new Error("Signing Certs Response from IDCS doesn't signing keys with kid of '" + IDCSDEFAULTSIGNKID + "'");
        e.code = errorConstants.NO_KEY_FROM_IDCS;
        throw e;
      } else {
        logger.error(JSON.stringify(jsonBody, null, 2));
        var e = new Error("Signing Certs Response from IDCS doesn't include signing keys!");
        e.code = errorConstants.NO_KEY_FROM_IDCS;
        throw e;
      }
    }).catch(err => {
      return reject(err);
    });
  })
}

idcsUtil.prototype.isValidToken = function (token) {
  var tokenParts = token.split(".");
  if(tokenParts.length != 3){
    return false;
  }
  //Validate the signature
  try{
    this.validateSignature(tokenParts[0]+"."+tokenParts[1], tokenParts[2]);
  }catch(err){
    logger.debug(err);
    logger.debug("Rejecting token, signature invalid.");
    return false;
  }
  var payload;
  try{
    payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'));
  }catch(err){
    logger.debug(err);
    logger.debug("Rejecting token, payload couldn't be parsed.");
    return false;
  }
  //Check expiry
  if (Date.now() >= payload.exp * 1000) {
    logger.debug("Rejecting token, expired.");
    return false;
  }
  //Other things? Scope, issuer, aud? It all should be for the IDCS instance itself?
  return true;
}

idcsUtil.prototype.validateSignature = function (prefix, data, sig) {
  if (!sig) {
    //Assume we have been passed data, sig
    sig = data;
    data = null;
  }
  var verifier = crypto.createVerify('sha256');
  verifier.update(prefix, 'utf8');
  if (data) {
    verifier.update(data, 'utf8');
  }
  logger.debug("Verifying signature...");
  if (verifier.verify(this.signingCert, sig, 'base64')) {
    logger.debug("Signature successfully verified.");
    return;
  }
  else {
    logger.error("Signature did NOT verify!");
    throw ("Invalid request. Please see server side logs.");
  }
}


module.exports = idcsUtil;