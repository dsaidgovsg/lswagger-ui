import { SET_SAML_AUTH_STATE, SET_SAML_AUTH_EMAIL } from "./actions"

const reducers = {
  [SET_SAML_AUTH_STATE]: (state, { payload }) =>
    state.set("samlAuthState", payload)
}

export default reducers
