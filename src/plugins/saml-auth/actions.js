import jwtDecode from "jwt-decode"
import urljoin from "url-join"

export const SET_SAML_AUTH_STATE = "SET_SAML_TOKEN_STATE"
export const SAML_AUTH_STATE_LOGGING_IN = "SAML_AUTH_STATE_LOGGING_IN"
export const SAML_AUTH_STATE_LOGGED_IN = "SAML_AUTH_STATE_LOGGED_IN"
export const SAML_AUTH_STATE_FAILED = "SAML_AUTH_STATE_FAILED"

export const setSamlAuthState = (state) => ({
  type: SET_SAML_AUTH_STATE,
  payload: state
})

const parseFetchResponse = (response) => {
  let data = JSON.parse(response.data)
  const error = data && data.error
  const parseError = data && data.parseError

  switch(true) {
    case !response.ok:
      throw new Error(response.statusText)
    case !!error:
    case !!parseError:
      throw new Error(JSON.stringify(data))
    default:
      return data
  }
}

const postLogin = async (fn, url, body) => {
  const headers = {
    "Accept":"application/json",
    "Content-Type": "application/json"
  }
  return await fn.fetch({
      url: url,
      method: "POST",
      headers,
      body: JSON.stringify(body)
    })
}

export const authenticateWithSamlToken = (authId, schema, samlToken) => async ( { fn, samlAuthActions, authActions, errActions } ) => {
  samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGING_IN)

  const query = `?service=${schema.get("service")}&expiry=${schema.get("tokenExpiry")}`
  const postUrl = urljoin(schema.get("tokenUrl"), "/tokens", query)
  const propagateAuthError = (errorMessage) => {
    errActions.newAuthErr({
      authId,
      level: "",
      source: "auth",
      message: errorMessage
    })
    samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_FAILED)
  }

  // 1. decode jwt
  let decoded
  try {
    decoded = jwtDecode(samlToken)
  } catch(decodeErr) {
    propagateAuthError(`SAML token error. ${decodeErr.message}`)
    return
  }

  // 2. send request, parse response
  let response, data
  try {
    response = await postLogin(fn, postUrl, { email: decoded.sub, saml_token: samlToken })
    data = await parseFetchResponse(response)
  } catch(e) {
    const errMessage = e.response
      ? e.response.body.message // response error
      : e.message // normal error

    propagateAuthError(`Unauthorized. ${errMessage}`)
    return
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
  samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGED_IN)
}

export const loginSaml = (schema) => async () => {
  const loginUrl = `${schema.get("ssoUrl")}/saml/sso`
  const redirectUrl = encodeURIComponent(window.location.origin)

  window.location.href = urljoin(loginUrl, `?RelayState=${redirectUrl}`)
}

export const logoutSaml = (name, schema) => async ( { authActions, authSelectors } ) => {
  const logoutUrl = `${schema.get("ssoUrl")}/saml/slo`
  const redirectUrl = encodeURIComponent(window.location.origin)
  const email = authSelectors.authorized().getIn([name, "email"])

  window.location.href = urljoin(logoutUrl, `?email=${email}&RelayState=${redirectUrl}`)
  authActions.logout([name])
}
