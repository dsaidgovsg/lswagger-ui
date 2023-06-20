import jwtDecode from "jwt-decode"
import { Map } from "immutable"

const appendQuery = (url, query) => {
  if (query) {
    url = `${url}?${new URLSearchParams(query)}`
  }
  return url
}

export const SET_SAML_AUTH_STATE_ACTION = "SET_SAML_TOKEN_STATE_ACTION"
export const SAML_AUTH_STATE_LOGGING_IN = "SAML_AUTH_STATE_LOGGING_IN"
export const SAML_AUTH_STATE_LOGGED_IN = "SAML_AUTH_STATE_LOGGED_IN"
export const SAML_AUTH_STATE_FAILED = "SAML_AUTH_STATE_FAILED"
export const SAVE_SAML_AUTH_EMAIL = "SAVE_SAML_AUTH_EMAIL"

export const setSamlAuthState = (state) => ({
  type: SET_SAML_AUTH_STATE_ACTION,
  payload: state
})

export const saveSamlAuthEmail = (email) => ({
  type: SAVE_SAML_AUTH_EMAIL,
  payload: email
})

const decodeJWT = (jwt) => {
  try{
    return [jwtDecode(jwt)]
  } catch(e) {
    return [undefined, e]
  }
}

const parseLoginResponse = (response) => {

  let data
  try{ data = JSON.parse(response.data) }
  catch(e) { return [undefined, e] }

  const error = data && data.error
  const parseError = data && data.parseError

  switch(true) {
    case !response.ok:
      return [undefined, response.statusText]
    case !!error:
    case !!parseError:
      return [data, JSON.stringify(data)]
  }
  return [data]
}

const authId = "SamlAuth"
export const authenticateWithSamlToken = (schema, samlToken) => async ( { fn, samlAuthActions, authActions, errActions } ) => {
  samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGING_IN)

  const method = schema.get("authMethod") || "post"
  const authQuery = schema.get("authQuery")
  const query = authQuery && authQuery.toJS()

  const fetchUrl = appendQuery(schema.get("authTokenUrl"), query)

  // 1. decode jwt
  const [decoded, decodeErr] = decodeJWT(samlToken)
  // guard error
  if(decodeErr) {
    errActions.newAuthErr({
      authId,
      level: "",
      source: "auth",
      message: `JWT Error: ${decodeErr.message}`
    })
    samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_FAILED)
    throw decodeErr
  }

  // 2. send request
  const authBody = schema.get("authBody") || new Map()
  const extraBody = authBody.toJS()
  const body = JSON.stringify({ email: decoded.sub, saml_token: samlToken, ...extraBody })

  const headers = {
    "Accept":"application/json, text/plain, */*",
    "Content-Type": "application/json"
  }

  let [response, fetchErr] = await (async function request() {
    try {
      return [await fn.fetch({
        url: fetchUrl,
        method: method || "post",
        headers,
        ...(method === "get" || method === "head" ? {} : {body})
      }), undefined]
    } catch(e) {
      return [undefined, e]
    }
  })()
  // guard error
  if(fetchErr) {
    const unauthorizedError = new Error(fetchErr)
    unauthorizedError.message = fetchErr.response
      ? fetchErr.response.body.message
      : fetchErr.message

    errActions.newAuthErr({
      authId,
      level: "",
      source: "auth",
      message: `Error logging in. ${unauthorizedError.message}`
    })
    samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_FAILED)
    throw unauthorizedError
  }


  // 3. parse response
  const [data, parseErrorMessage] = parseLoginResponse(response)
  if(parseErrorMessage) {
    errActions.newAuthErr({
      authId,
      level: "",
      source: "auth",
      message: `Response Error: ${parseErrorMessage}`
    })
    samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_FAILED)
    throw new Error(parseErrorMessage)
  }

  // 4. set auth
  authActions.authorize({
    [authId]: {
      name: authId,
      email: decoded.sub,
      token: data.token,
      schema
    }
  })
  samlAuthActions.saveSamlAuthEmail(decoded.sub)
  samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGED_IN)
}

export const loginSaml = (name, schema) => async ( { authActions } ) => {
  const loginUrl = schema.get("loginUrl")
  const loginQuery = schema.get("loginQuery")

  if(!loginUrl) authActions.newAuthErr({
    authId: name,
    level: "error",
    source: "auth",
    message: "Swagger Config: Login URL not found"
  })

  window.location.href = `${loginUrl}?${new URLSearchParams(loginQuery.toJS())}`
}

export const logoutSaml = (name, schema) => async ( { authActions, samlAuthSelectors } ) => {
  const logoutUrl = schema.get("logoutUrl")
  const logoutQuery = schema.get("logoutQuery")

  if(!logoutUrl) authActions.newAuthErr({
    authId: name,
    level: "error",
    source: "auth",
    message: "Swagger Config: Logout URL not found"
  })

  const email = samlAuthSelectors.samlAuthEmail()

  window.location.href = `${logoutUrl}?${new URLSearchParams({ ...logoutQuery.toJS(), email})}`
  authActions.logout([name])
}
