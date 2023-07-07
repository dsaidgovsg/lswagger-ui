import jwtDecode from "jwt-decode"
import urljoin from "url-join"

import { exchangeToken } from "../../core/plugins/auth/actions"
export const SET_SAML_AUTH_STATE = "SET_SAML_TOKEN_STATE"
export const SAML_AUTH_STATE_LOGGING_IN = "SAML_AUTH_STATE_LOGGING_IN"
export const SAML_AUTH_STATE_LOGGING_OUT = "SAML_AUTH_STATE_LOGGING_OUT"

export const setSamlAuthState = (state) => ({
  type: SET_SAML_AUTH_STATE,
  payload: state
})

export const newSamlAuthErr = (samlError) =>
    async ({ authActions, errActions, authSelectors, specSelectors }) => {
  const authorizableDefinitions = authSelectors.definitionsToAuthorize()
  const [authId] = specSelectors.samlSchemaEntry()

  // show the auth popup to display error
  authActions.showDefinitions(authorizableDefinitions)
  errActions.newAuthErr({
    authId,
    level: "",
    source: "auth",
    message: samlError
  })
}

export const authenticateWithSamlToken = (authId, schema, samlToken, done) =>
    ( { fn, samlAuthActions, authActions, specSelectors } ) => {

  // 1. decode jwt
  let decoded
  try {
    decoded = jwtDecode(samlToken)
  } catch(decodeErr) {
    samlAuthActions.newSamlAuthErr(`SAML token error. ${decodeErr.message}`)
    return
  }

  // 2. send request, parse response
  exchangeToken(fn, specSelectors, { email: decoded.sub, saml_token: samlToken })
  .then((token) => {
    authActions.authorize({
      [authId]: {
        name: authId,
        email: decoded.sub,
        token: token,
        schema
      }
    })
  })
  .catch((e) => {
    const errMessage = e.response && e.response.body
    ? e.response.body.message // prioritise response error
    : e.message // normal error message

    samlAuthActions.newSamlAuthErr(`Unauthorized. ${errMessage}`)
  })
  .finally(done)
}

export const loginSaml = () => async ({ specSelectors, samlAuthActions }) => {
  const loginUrl = `${specSelectors.service()}/saml/sso`
  const redirectUrl = encodeURIComponent(window.location.origin)
  samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGING_IN)

  window.location.href = urljoin(loginUrl, `?RelayState=${redirectUrl}`)
}

export const logoutSaml = (name) =>
    async ( { authActions, authSelectors, specSelectors, samlAuthActions } ) => {
  const logoutUrl = `${specSelectors.service()}/saml/slo`
  const redirectUrl = encodeURIComponent(window.location.origin)
  const email = authSelectors.authorized().getIn([name, "email"])
  samlAuthActions.setSamlAuthState(SAML_AUTH_STATE_LOGGING_OUT)

  window.location.href = urljoin(logoutUrl, `?email=${email}&RelayState=${redirectUrl}`)
  authActions.logout([name])
}
