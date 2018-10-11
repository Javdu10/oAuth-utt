'use strict';

/**
 * Define the base object namespace. By convention we use the service name
 * in PascalCase (aka UpperCamelCase). Note that this is defined as a package global.
 */
Utt = {};

/**
 * Boilerplate hook for use by underlying Meteor code
 */
Utt.retrieveCredential = (credentialToken, credentialSecret) => {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

/**
 * Define the fields we want. Note that they come from various places...
 *  id, reputation, created: from https://api.utt.com/3/account/{username}
 *  email: from https://api.utt.com/3/account/{username}/settings
 * Note that we *must* have an id. Also, this array is referenced in the
 * accounts-utt package, so we should probably keep this name and structure.
 */
Utt.whitelistedFields = ['firstName', 'lastName', 'bdeMember','branch','email'];

/**
 * Register this service with the underlying OAuth handler
 * (name, oauthVersion, urls, handleOauthRequest):
 *  name = 'utt'
 *  oauthVersion = 2
 *  urls = null for OAuth 2
 *  handleOauthRequest = function(query) returns {serviceData, options} where options is optional
 * serviceData will end up in the user's services.utt
 */
OAuth.registerService('utt', 2, null, function(query) {

  /**
   * Make sure we have a config object for subsequent use (boilerplate)
   */
  const config = ServiceConfiguration.configurations.findOne({
    service: 'utt'
  });
  if (!config) {
    throw new ServiceConfiguration.ConfigError();
  }

  /**
   * Get the token and username (Meteor handles the underlying authorization flow).
   * Note that the username comes from from this request in Utt.
   */
  const response = getTokens(config, query);
  const accessToken = response.accessToken;

  /**
   * If we got here, we can now request data from the account endpoints
   * to complete our serviceData request.
   * The identity object will contain the username plus *all* properties
   * retrieved from the account and settings methods.
  */
  const identity = _.extend(
    getAccount(config, accessToken),
    // getSettings(config, username, accessToken)
  );

  /**
   * Build our serviceData object. This needs to contain
   *  accessToken
   *  expiresAt, as a ms epochtime
   *  refreshToken, if there is one
   *  id - note that there *must* be an id property for Meteor to work with
   *  email
   *  reputation
   *  created
   * We'll put the username into the user's profile
   */

  const serviceData = {
    accessToken,
    expiresAt: (+new Date) + (1000 * response.expiresIn)
  };
  if (response.refreshToken) {
    serviceData.refreshToken = response.refreshToken;
  }
  const options = {}
  options.username = identity.login
  _.extend(options, _.pick(identity, Utt.whitelistedFields));

  serviceData.id = identity.studentId;

  /**
   * Return the serviceData object along with an options object containing
   * the initial profile object with the username.
   */
  return {
    serviceData: serviceData,
    options
  };
});

/**
 * The following three utility functions are called in the above code to get
 *  the access_token, refresh_token and username (getTokens)
 *  account data (getAccount)
 *  settings data (getSettings)
 * repectively.
 */

/** getTokens exchanges a code for a token in line with Utt's documentation
 *
 *  returns an object containing:
 *   accessToken        {String}
 *   expiresIn          {Integer}   Lifetime of token in seconds
 *   refreshToken       {String}    If this is the first authorization request
 *   account_username   {String}    User name of the current user
 *   token_type         {String}    Set to 'Bearer'
 *
 * @param   {Object} config       The OAuth configuration object
 * @param   {Object} query        The OAuth query object
 * @return  {Object}              The response from the token request (see above)
 */
const getTokens = function(config, query) {

  const endpoint = 'https://etu.utt.fr/api/oauth/token';

  /**
   * Attempt the exchange of code for token
   */
  let response;
  try {
    response = HTTP.post(
      endpoint, {
        params: {
          code: query.code,
          client_id: config.clientId,
          client_secret: OAuth.openSecret(config.secret),
          grant_type: 'authorization_code'
        }
      });

  } catch (err) {
    throw _.extend(new Error(`Failed to complete OAuth handshake with Utt. ${err.message}`), {
      response: err.response
    });
  }

  if (response.data.error) {

    /**
     * The http response was a json object with an error attribute
     */
    throw new Error(`Failed to complete OAuth handshake with Utt. ${response.data.error}`);

  } else {

    /** The exchange worked. We have an object containing
     *   access_token
     *   refresh_token
     *   expires_in
     *   token_type
     *   account_username
     *
     * Return an appropriately constructed object
     */
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }
};

/**
 * getAccount gets the basic Utt account data
 *
 *  returns an object containing:
 *   firstname             {String}         The user's Utt id
 *   lastname            {String}          The account username as requested in the URI
 *   name            {String}          A basic description the user has filled out
 *   branch     {String}           The reputation for the account.
 *   created        {Integer}         The epoch time of account creation
 *   pro_expiration {Integer/Boolean} False if not a pro user, their expiration date if they are.
 *
 * @param   {Object} config       The OAuth configuration object
 * @param   {String} accessToken  The OAuth access token
 * @return  {Object}              The response from the account request (see above)
 */
const getAccount = function(config, accessToken) {

  const endpoint = `https://etu.utt.fr/api/public/user/account`;
  let accountObject;

  /**
   * Note the strange .data.data - the HTTP.get returns the object in the response's data
   * property. Also, Utt returns the data we want in a data property of the response data
   * Hence (response).data.data
   */
  try {
    accountObject = HTTP.get(
      endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    ).data.data;
    return accountObject;

  } catch (err) {
    throw _.extend(new Error(`Failed to fetch account data from Utt. ${err.message}`), {
      response: err.response
    });
  }
};
