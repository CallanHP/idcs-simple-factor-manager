### Simple IDCS Factor manager

Simple React App for self-service management of IDCS Authentication factors.

Supports:

* SMS OTP
* Online Authenticator (Oracle Mobile Authenticator)
* Offline Authenticator (i.e. Google Authenticator, etc.)

# Setup

This app uses an IDCS client app which is configured to support the Client Credential and Authorization Code Grant Types. The Client Credentials grant-type is used to obtain the Signing Cert from IDCS (since it is authenticated by default), and Authorization Code is used to facilitate login for users.

The application requests the 'Me' App Role from IDCS, since logged in users need to manage their own resources.

The configuration of the app itself takes place via the config.json file, a sample of which is included in the repo. It needs renaming to config.json and populating with appropriate values.

# Using

The app is built to use webpack, which includes both client and server builds. For development, you can use:

`$npm run-script watch` and `$npm run-script server-watch` to trigger build on any file updates.

`server.js` is the server entry point, which performs a server-side render of the factor management page in order to bake an access token into the application state. `app\index.js` is the entry point for the client page.