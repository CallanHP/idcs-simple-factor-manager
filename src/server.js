import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import {randomBytes} from 'crypto';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './app';
import template from './template';

import log4js from 'log4js';
const logger = log4js.getLogger("server.js");
logger.level = process.env.log_level || "info";


import config from '../config/config.json';
import idcsUtil from './util/idcsUtil';

import CacheHandler from './util/cache/cacheHandler';


import errorConstants from './errorConstants';
import globalConstants from './constants';

var idcs;
try {
  idcs = new idcsUtil(config.idcs);
} catch (err) {
  if (err.code == errorConstants.INVALID_IDCS_CONFIG) {
    logger.error("Factor Manager was started with an invalid config - so it will never be able to communicate with IDCS!");
    throw new Error("Factor Manager was started with an invalid config - so it will never be able to communicate with IDCS!");
  }
  throw err;
}

//Simple session cache to pass between the callback and the SPA
var sessionCache;
try{
  //TODO: add pluggable cache backing loader?
  sessionCache = new CacheHandler();
} catch (err) {
  //Cache doesn't throw at the moment, but for safety...
  logger.error("Error initialising the session cache")
  throw err;
}

const port = process.env.PORT || config.port || 8080;
const app = express();
const signCookies = Boolean(config.session?.key); 
app.use(cookieParser(signCookies ? config.session.key : null));

var server;
if(config.ssl?.useSSL){
  //Load local SSL certs for testing
  const privateKey = fs.readFileSync(config.ssl?.privateKeyPath, 'utf8');
  const publicCert = fs.readFileSync(config.ssl?.publicCertPath, 'utf8');
  const serverCredentials = {key: privateKey, cert: publicCert};
  server = https.createServer(serverCredentials, app);
}else{
  server = http.createServer(app);
}


app.use('/assets', express.static(path.join(__dirname, 'assets')));

//Standard entry point for the application
//TODO: Is Auth middleware? Just do it on the endpoint for now, since we only have one
app.get('/myfactors', (req, res) => {
  //Check cookies for session key
  let sessionKey = signCookies ? req.signedCookies[globalConstants.COOKIE_NAME] : req.cookies[globalConstants.COOKIE_NAME];
  logger.debug("Session key is present? " +Boolean(sessionKey));
  //If no valid key, redirect to login
  if(!sessionKey){
    //redirect for login
    return redirectForAuth(res);
  }
  //Retrieve the cache content (access token)
  var token = sessionCache.get(sessionKey);
  logger.debug("Cached token was present?" +Boolean(token));
  if(!token || !idcs.isValidToken(token)){
    //redirect for login
    logger.debug("No token, redirecting for login.");
    return redirectForAuth(res);
  }
  //Render it into the page...
  const initialState = {
    idcsUrl: config.idcs.base_url,
    token: token
  };
  //Use the initial state to render the page including the token for client side stuffs
  const appString = renderToString(<App {...initialState} />);
  return res.send(template({
    body: appString,
    title: 'Simple Factor Management',
    initialState: JSON.stringify(initialState)
  }));
});

//Callback endpoint from the OAuth flow
app.get('/callback', (req, res) => {
  //validate params
  if(req.query.error){
    logger.info("Error in 3-legged flow - " +req.query.error);
    var errRes = {
      message: "Unexpected response from Auth Server",
      error: req.query.error,
      error_description: req.query.error_description,
      error_uri: req.query.error_uri
    }
    return res.status(400).json(errRes);
  }
  var code = req.query.code;
  let state = req.query.state;
  if(!code || !state){
    var errRes = {
      code: errorConstants.CALLBACK_MISSING_PARAMS,
      message: "Invalid arguments to callback"
    }
    return res.status(400).json(errRes);
  }
  //Validate state
  logger.info("Validating CSRF values...");
  let csrfValue = signCookies ? req.signedCookies[globalConstants.CSRF_COOKIE] : req.cookies[globalConstants.CSRF_COOKIE];
  if(state !== csrfValue){
    var errRes = {
      code: errorConstants.CSRF_STATE_MISMATCH,
      message: "Error validating state value."
    }
    return res.status(401).json(errRes);
  }
  //Exchange code for token
  logger.info("Obtaining IDCS Access token...");
  idcs.getAccessToken(code).then((token) => {
    //Insert into session cache
    //TODO: Actually get the token expiry from the token or something...
    //3540000ms == 59 mins (token should be valid for 1 hour...)
    var sessionKey = sessionCache.storeNewContext(token, 3540000);
    //set session key in cookies, clear the CSRF challenge cookie
    res.cookie(globalConstants.COOKIE_NAME, sessionKey, 
      {
        secure:true, 
        sameSite:true, 
        httpOnly:true, 
        signed:signCookies,
        maxAge: 3540000
      });
    res.clearCookie(
        globalConstants.CSRF_COOKIE,
        {
          secure:true,
          httpOnly:true,
          signed:signCookies
        }
      );
    res.send(generateRefreshHtml("/myfactors"));
  }).catch((err)=>{
    logger.error("Error getting access token from IDCS.");
    logger.error(err);
    var errRes = {
      code: errorConstants.NO_TOKEN_FROM_IDCS,
      message: "Error performing login with IDCS."
    }
    return res.status(400).json(errRes);
  });
});


//Just testing the rendering here.
//TODO: Add auth redirects
app.get('/', (req, res) => {

  //Set some variable as a result of some server side stuffs...
  const initialState = {
    idcsUrl: config.idcs.base_url,
    token: "token"
  };

  const appString = renderToString(<App {...initialState} />);

  res.send(template({
    body: appString,
    title: 'Simple Factor Management',
    initialState: JSON.stringify(initialState)
  }));
});

//Little helper to assemble the authorize request
function redirectForAuth(res){
  //Lets just do a simple CSRF
  let state = randomBytes(64).toString('base64');
  let url = config.idcs.base_url +"/oauth2/v1/authorize?client_id="
  +config.idcs.client_id +"&redirect_uri=" +config.idcs.redirect_host
  +":" +port +"/callback&response_type=code&scope=" +config.idcs.required_scopes.join(" ")
  +"&state=" +encodeURIComponent(state);
  return res.cookie(globalConstants.CSRF_COOKIE, state, {secure:true, httpOnly:true, signed:signCookies}).redirect(url);
}

//Helper to render a page to trigger a redirect to allow for appropriately secure cookies
function generateRefreshHtml(url){
  return "<html>"
        +"<head>"
        +"<meta http-equiv=\"refresh\" content=\"0;URL='" +url +"'\"/>"
        +"</head>"
        +"<body><p>Redirecting to <a href=\"" +url +"\">factor management</a>.</p></body>"
        +"</html>";
}

//On start, get an OAuth client token, the helpers will be responsible for rotating this as required.
idcs.initialise().then(() => {
  logger.debug("Obtained client token from IDCS. Saving for later use.");
  //Extension for browser-refresh during dev
  server.listen(port, () => process.send && process.send("online"));
  logger.info("Express started and listening on port: " + port);
}).catch((err) => {
  if (err.code == errorConstants.IDCS_AUTHN_FAILED) {
    logger.error("Unable to authenticate to IDCS! The client secret may have been revoked.");
    throw new Error("Unable to authenticate to IDCS! The client secret may have been revoked.");
  }
  if (err.code == errorConstants.ERROR_PARSING_RESPONSE_FROM_IDCS || err.code == errorConstants.NO_TOKEN_FROM_IDCS) {
    logger.error("Error obtaining the token from IDCS - might be an error on the IDCS end.");
    //TODO: Maybe should backoff here?
    throw new Error("Error obtaining the token from IDCS - might be an error on the IDCS end.");
  }
  logger.error("Unknown error from IDCS!");
  throw err;
});
