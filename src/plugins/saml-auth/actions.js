import jwtDecode from "jwt-decode"
import urljoin from "url-join"

import { exchangeToken } from "../../core/plugins/auth/actions"
export const SET_SAML_AUTH_STATE = "SET_SAML_TOKEN_STATE"
export const SAML_AUTH_STATE_LOGGING_IN = "SAML_AUTH_STATE_LOGGING_IN"
export const SAML_AUTH_STATE_LOGGED_IN = "SAML_AUTH_STATE_LOGGED_IN"
export const SAML_AUTH_STATE_FAILED = "SAML_AUTH_STATE_FAILED"

export const setSamlAuthState = (state) => ({
  type: SET_SAML_AUTH_STATE,
  payload: state
})

export const authenticateWithSamlToken = (authId, schema, samlToken) => ( { fn, samlAuthActions, authActions, errActions, specSelectors } ) => {
  samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGING_IN)

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
  exchangeToken(fn, specSelectors, { email: decoded.sub, saml_token: samlToken })
  .then((token) => {
    // 3. set auth
    authActions.authorize({
      [authId]: {
        name: authId,
        email: decoded.sub,
        token: token,
        schema
      }
    })
    samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGED_IN)
  })
  .catch((e) => {
    const errMessage = e.response && e.response.body
    ? e.response.body.message // prioritise response error
    : e.message // normal error message

    propagateAuthError(`Unauthorized. ${errMessage}`)
  })
}

export const loginSaml = () => async ({ specSelectors }) => {
  const loginUrl = `${specSelectors.service()}/saml/sso`
  const redirectUrl = encodeURIComponent(window.location.origin)

  window.location.href = urljoin(loginUrl, `?RelayState=${redirectUrl}`)
}

export const logoutSaml = (name) => async ( { authActions, authSelectors, specSelectors} ) => {
  const logoutUrl = `${specSelectors.service()}/saml/slo`
  const redirectUrl = encodeURIComponent(window.location.origin)
  const email = authSelectors.authorized().getIn([name, "email"])

  window.location.href = urljoin(logoutUrl, `?email=${email}&RelayState=${redirectUrl}`)
  authActions.logout([name])
}
