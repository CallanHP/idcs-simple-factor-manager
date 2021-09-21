/*
 * Lookup for details of how to display the individual factors
 */
export const factorEnrollmentDetails = {
  PHONE:{
    enrollmentDisplay: "Add a mobile number to recieve verification codes by SMS",
    //Do we invoke the enroll API before loading the details screen?
    enrollNoDetails: false,
    requiresInitiation: true,
    authnFactors: ["SMS"],
    //Options is an array of arguments sent from a higher component
    mapVerifyOptions: (body, options) => {
      body.otpCode = options[0];
      return body;
    },
    mapEnrollOptions: (body, options) => {
      body.countryCode = options[0];
      body.phoneNumber = options[1];
      body.isDeviceOffline = true;
      return body;
    }
  },
  OFFLINE_APP:{
    enrollmentDisplay: "Enroll an alternative mobile authenticator (i.e. Google Authenticator)",
    enrollNoDetails: true,
    requiresInitiation: false,
    authnFactors: ["TOTP"],
    mapVerifyOptions: (body, options) => {
      body.otpCode = options[0];
      return body;
    },
    mapEnrollOptions: (body, options) => {
      body.isDeviceOffline = true;
      return body;
    }
  },
  ONLINE_APP:{
    enrollmentDisplay: "Enroll Oracle Mobile Authenticator",
    enrollNoDetails: true,
    requiresInitiation: false,
    authnFactors: ["PUSH"],
    mapVerifyOptions: (body, options) => {
      return body;
    },
    mapEnrollOptions: (body, options) => {
      return body;
    }
  },
  BYPASS:{
    enrollmentDisplay: "Add a Bypass Code",
    enrollNoDetails: false,
    requiresInitiation: false,
    authnFactors: [],
    mapVerifyOptions: (body, options) => {
      return body;
    },
    mapEnrollOptions: (body, options) => {
      return body;
    }
  },
  SECURITY_QUESTIONS:{
    enrollmentDisplay: "Add Security Questions to your Account",
    enrollNoDetails: false,
    requiresInitiation: false,
    authnFactors: [],
    mapVerifyOptions: (body, options) => {
      return body;
    },
    mapEnrollOptions: (body, options) => {
      return body;
    }
  }
}

/*
 * Internal enummy sorta reference things.
 */
export const factorNames = {
  onlineApp: "ONLINE_APP",
  offlineApp: "OFFLINE_APP",
  phone: "PHONE",
  bypassCode: "BYPASS",
  securityQuestions: "SECURITY_QUESTIONS"
}