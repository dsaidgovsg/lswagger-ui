import win from "core/window"
import { btoa, buildFormData } from "core/utils"
import * as url from "url"
import urljoin from "url-join"

export const SHOW_AUTH_POPUP = "show_popup"
export const RECEIVE_OTP = "receive_otp"
export const AUTHORIZE = "authorize"
export const LOGOUT = "logout"
export const PRE_AUTHORIZE_OAUTH2 = "pre_authorize_oauth2"
export const AUTHORIZE_OAUTH2 = "authorize_oauth2"
export const VALIDATE = "validate"
export const CONFIGURE_AUTH = "configure_auth"

const scopeSeparator = " "

export function showDefinitions(payload) {
  return {
    type: SHOW_AUTH_POPUP,
    payload: payload
  }
}

export function receiveOtp(payload) {
  return {
    type: RECEIVE_OTP,
    payload: payload
  }
}

export function authorize(payload) {
  return {
    type: AUTHORIZE,
    payload: payload
  }
}

export function logout(payload) {
  return {
    type: LOGOUT,
    payload: payload
  }
}

export const preAuthorizeImplicit = (payload) => ( { authActions, errActions } ) => {
  let { auth , token, isValid } = payload
  let { schema, name } = auth
  let flow = schema.get("flow")

  // remove oauth2 property from window after redirect from authentication
  delete win.swaggerUIRedirectOauth2

  if ( flow !== "accessCode" && !isValid ) {
    errActions.newAuthErr( {
      authId: name,
      source: "auth",
      level: "warning",
      message: "Authorization may be unsafe, passed state was changed in server Passed state wasn't returned from auth server"
    })
  }

  if ( token.error ) {
    errActions.newAuthErr({
      authId: name,
      source: "auth",
      level: "error",
      message: JSON.stringify(token)
    })
    return
  }

  authActions.authorizeOauth2({ auth, token })
}

export function authorizeOauth2(payload) {
  return {
    type: AUTHORIZE_OAUTH2,
    payload: payload
  }
}

export const authorizePassword = ( auth ) => ( { authActions } ) => {
  let { schema, name, username, password, passwordType, clientId, clientSecret } = auth
  let form = {
    grant_type: "password",
    scopes: encodeURIComponent(auth.scopes.join(scopeSeparator))
  }
  let query = {}
  let headers = {}

  if ( passwordType === "basic") {
    headers.Authorization = "Basic " + btoa(username + ":" + password)
  } else {
    Object.assign(form, {username}, {password})

    if ( passwordType === "query") {
      if ( clientId ) {
        query.client_id = clientId
      }
      if ( clientSecret ) {
        query.client_secret = clientSecret
      }
    } else {
      headers.Authorization = "Basic " + btoa(clientId + ":" + clientSecret)
    }
  }

  return authActions.authorizeRequest({ body: buildFormData(form), url: schema.get("tokenUrl"), name, headers, query, auth})
}

export const authorizeApplication = ( auth ) => ( { authActions } ) => {
  let { schema, scopes, name, clientId, clientSecret } = auth
  let headers = {
    Authorization: "Basic " + btoa(clientId + ":" + clientSecret)
  }
  let form = {
    grant_type: "client_credentials",
    scope: scopes.join(scopeSeparator)
  }

  return authActions.authorizeRequest({body: buildFormData(form), name, url: schema.get("tokenUrl"), auth, headers })
}

export const authorizeAccessCode = ( { auth, redirectUrl } ) => ( { authActions } ) => {
  let { schema, name, clientId, clientSecret } = auth
  let form = {
    grant_type: "authorization_code",
    code: auth.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUrl
  }

  return authActions.authorizeRequest({body: buildFormData(form), name, url: schema.get("tokenUrl"), auth})
}

export const authorizeRequest = ( data ) => ( { fn, authActions, errActions, authSelectors } ) => {
  let { body, query={}, headers={}, name, url, auth } = data
  let { additionalQueryStringParams } = authSelectors.getConfigs() || {}
  let fetchUrl = url

  for (let key in additionalQueryStringParams) {
    url += "&" + key + "=" + encodeURIComponent(additionalQueryStringParams[key])
  }

  let _headers = Object.assign({
    "Accept":"application/json, text/plain, */*",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/x-www-form-urlencoded"
  }, headers)

  fn.fetch({
    url: fetchUrl,
    method: "post",
    headers: _headers,
    query: query,
    body: body
  })
  .then(function (response) {
    let token = JSON.parse(response.data)
    let error = token && ( token.error || "" )
    let parseError = token && ( token.parseError || "" )

    if ( !response.ok ) {
      errActions.newAuthErr( {
        authId: name,
        level: "error",
        source: "auth",
        message: response.statusText
      } )
      return
    }

    if ( error || parseError ) {
      errActions.newAuthErr({
        authId: name,
        level: "error",
        source: "auth",
        message: JSON.stringify(token)
      })
      return
    }

    authActions.authorizeOauth2({ auth, token})
  })
  .catch(e => {
    let err = new Error(e)
    errActions.newAuthErr( {
      authId: name,
      level: "error",
      source: "auth",
      message: err.message
    } )
  })
}

export function configureAuth(payload) {
  return {
    type: CONFIGURE_AUTH,
    payload: payload
  }
}

export const authorizeBasicToken = ( auth ) => ( { fn, authActions, errActions } ) => {
  let { schema, name, username, password } = auth
  let query = {}
  let headers = {
    "Accept":"application/json, text/plain, */*",
    "Content-Type": "application/json"
  }

  headers.Authorization = "Basic " + btoa(username + ":" + password)
  query.service = schema.get("service")
  query.scope = schema.get("scope")
  query.offline_token = "true"
  query.expiry = schema.get("tokenExpiry")

  fn.fetch({
    url: schema.get("tokenUrl"),
    method: "get",
    headers: headers,
    query: query
  })
  .then(function (response) {
    let response_data = JSON.parse(response.data)
    let error = response_data && ( response_data.error || "" )
    let parseError = response_data && ( response_data.parseError || "" )

    if ( !response.ok ) {
      errActions.newAuthErr( {
        authId: name,
        level: "error",
        source: "auth",
        message: response.statusText
      } )
      return
    }

    if ( error || parseError ) {
      errActions.newAuthErr({
        authId: name,
        level: "error",
        source: "auth",
        message: JSON.stringify(response_data)
      })
      return
    }

    auth.token = response_data.token
    auth.username = username
    authActions.authorize({ auth })
  })
  .catch(e => {
    let err = new Error(e)

    // workaround for actual error response, e.g. failed authentication, masked
    // by general failed to fetch error due to missing CORS header from rowdy
    // for error responses
    err.message = "Unauthorized. Please check your username and password."

    errActions.newAuthErr( {
      authId: name,
      level: "",
      source: "",
      message: err.message
    } )
  })
}

export const sendOtp = ( auth ) => ( { fn, authActions, errActions, specSelectors } ) => {
  authActions.receiveOtp(false)

  let { name, email } = auth

  let fetchUrl = urljoin(specSelectors.tokenUrl(), "/otps")
  let body = JSON.stringify({ email })

  let headers = {
    "Accept":"application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Source": "swagger"
  }

  fn.fetch({
    url: fetchUrl,
    method: "post",
    headers,
    body
  })
  .then(function (response) {
    let response_data = JSON.parse(response.data)
    let error = response_data && ( response_data.error || "" )
    let parseError = response_data && ( response_data.parseError || "" )

    if ( !response.ok ) {
      errActions.newAuthErr( {
        authId: name,
        level: "",
        source: "",
        message: response.statusText
      } )
      return
    }

    if ( error || parseError ) {
      errActions.newAuthErr({
        authId: name,
        level: "error",
        source: "auth",
        message: JSON.stringify(response_data)
      })
      return
    }

    authActions.receiveOtp(true)
  })
  .catch(e => {
    let err = new Error(e)
    err.message = "Error sending OTP. " + e.response.body.message

    errActions.newAuthErr( {
      authId: name,
      level: "",
      source: "",
      message: err.message
    })

  })
}

export const exchangeToken = (fn, specSelectors, body) => {
  const fetchUrl = urljoin(specSelectors.tokenUrl(), "/tokens")
  const query = {
    service: specSelectors.service(),
    expiry: specSelectors.tokenExpiry()
  }
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
  }

  return fn.fetch({
    url: fetchUrl,
    method: "post",
    headers,
    query,
    body: JSON.stringify(body)
  }).then((response) => {
    const data = JSON.parse(response.data)
    const error = data && ( data.error || "" )
    let parseError = data && ( data.parseError || "" )

    if ( !response.ok ) {
      throw new Error(response.statusText)
    }
    if ( error || parseError ) {
      throw new Error(JSON.stringify(data))
    }

    return data.token
  })
}

export const authorizeOtpToken = ( auth ) => ( { fn, authActions, errActions, specSelectors } ) => {
  authActions.receiveOtp(false)

  let { name: authId, email, otp } = auth

  exchangeToken(fn, specSelectors, { email, otp })
  .then(function (token) {
    authActions.authorize({
      [authId]: {
        ...auth,
        email,
        token,
      }
    })

    authActions.showDefinitions(false)
  })
  .catch(e => {
    const errMessage = e.response && e.response.body
    ? e.response.body.message // prioritise response error
    : e.message // normal error message

    errActions.newAuthErr( {
      authId,
      level: "",
      source: "",
      message: `Unauthorized. ${errMessage}`
    })
  })
}
