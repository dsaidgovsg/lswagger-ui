import { SET_SAML_AUTH_STATE_ACTION, SAVE_SAML_AUTH_EMAIL } from "./actions"

const reducers = {
  [SET_SAML_AUTH_STATE_ACTION]: (state, { type, payload }) => {
    if (type === SET_SAML_AUTH_STATE_ACTION) {
      return state.set("samlAuthState", payload)
    }
    return state
  },
  [SAVE_SAML_AUTH_EMAIL]: (state, { type, payload }) => {
    if (type === SAVE_SAML_AUTH_EMAIL) {
      return state.set("samlAuthEmail", payload)
    }
    return state
  }
}

export default reducers
