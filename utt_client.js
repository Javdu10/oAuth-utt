'use strict';

/**
 * Define the base object namespace. By convention we use the service name
 * in PascalCase (aka UpperCamelCase). Note that this is defined as a package global (boilerplate).
 */
Utt = {};

/**
 * Request Utt credentials for the user (boilerplate).
 * Called from accounts-utt.
 *
 * @param {Object}    options                             Optional
 * @param {Function}  credentialRequestCompleteCallback   Callback function to call on completion. Takes one argument, credentialToken on success, or Error on error.
 */
Utt.requestCredential = function(options, credentialRequestCompleteCallback) {
  /**
   * Support both (options, callback) and (callback).
   */
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  } else if (!options) {
    options = {};
  }

  /**
   * Make sure we have a config object for subsequent use (boilerplate)
   */
  const config = ServiceConfiguration.configurations.findOne({
    service: 'utt'
  });
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError()
    );
    return;
  }

  /**
   * Boilerplate
   */
  const credentialToken = 'xyz'
  const loginStyle = OAuth._loginStyle('utt', config, options);

  /**
   * Utt requires response_type and client_id
   * We use state to roundtrip a random token to help protect against CSRF (boilerplate)
   */
  const loginUrl = 'https://etu.utt.fr/api/oauth/authorize' +
    '?response_type=code' +
    '&client_id=' + config.clientId +
    '&state='+ OAuth._stateParam(loginStyle, credentialToken);
    'scope=public'
  /**
   * Client initiates OAuth login request (boilerplate)
  */
  OAuth.launchLogin({
    loginService: 'utt',
    loginStyle: loginStyle,
    loginUrl: loginUrl,
    credentialRequestCompleteCallback: credentialRequestCompleteCallback,
    credentialToken: credentialToken,
    popupOptions: {
      height: 600
    }
  });
};
