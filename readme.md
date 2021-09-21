### Simple IDCS Factor manager

Simple sample React App for self-service management of IDCS Authentication factors.

Supports:

* SMS OTP
* Online Authenticator (Oracle Mobile Authenticator)
* Offline Authenticator (i.e. Google Authenticator, etc.)

This is very dummy proof-of-concept-y in its current state - I recommend treating this merely as a jumping off point or reference.

# Setup

This app uses an IDCS client app which is configured to support the Client Credential and Authorization Code Grant Types. The Client Credentials grant-type is used to obtain the Signing Cert from IDCS (since it is authenticated by default), and Authorization Code is used to facilitate login for users.

The application requests the 'Me' App Role from IDCS, since logged in users need to manage their own resources.

The configuration of the app itself takes place via the config.json file, a sample of which is included in the repo. It needs renaming to config.json and populating with appropriate values.

# Using

The app is built to use webpack, which includes both client and server builds. For development, you can use:

`$npm run-script watch` and `$npm run-script server-watch` to trigger build on any file updates.

`server.js` is the server entry point, which performs a server-side render of the factor management page in order to bake an access token into the application state. `app\index.js` is the entry point for the client page.

# Working from this as a base

`FactorManagementLayout` is the real entry point for the client - and it is responsible for making all of the IDCS calls. This has made it a bit monolithic, could probably be refactored a little.

All of the css is split out (and recombined by webpack) based upon its use. Check the source file for the imports if you need. The current design is very flat, and is designed to be in a pretty clean unopinionated style which should be easy to adapt to .

The specifics for each enrollment factor have been pushed into `factorConstants`, which in theory should make it easily extensible, except that you still have to build a screen for each factor enrollment, which lives in `app\factors\factorEnrollment` and is loaded from `newFactorLayout`. The list of supported factors is loaded dynamically from IDCS, so if you see some odd behaviour, it is likely because you have factors enabled for which screens or settings have not been configured.

# Likely improvement

Adding a filter to only display enrolled devices will fix an issue were enrollments which were abandoned are visible. These can be a bit fiddly to clear up as well, and there isn't error checking in place to ensure they are deleted correctly from these screens. Error checking overall needs to be cleaned up - this sample tends to assume happy path too readily.