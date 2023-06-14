import { SET_SAML_AUTH_STATE_ACTION, SAVE_SAML_AUTH_EMAIL } from "./actions"

const reducers = {
  [SET_SAML_AUTH_STATE_ACTION]: (state, { payload }) =>
    state.set("samlAuthState", payload),
  [SAVE_SAML_AUTH_EMAIL]: (state, { payload }) =>
    state.set("samlAuthEmail", payload)
}

export default reducers
