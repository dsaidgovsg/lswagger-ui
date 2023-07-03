import SamlAuth from "./components/SamlAuth"
import AuthorizationPopup from "./components/AuthorizationPopup"
import * as actions from "./actions"
import * as selectors from "./selectors"
import reducers from "./reducers"

function getSamlSchema(system) {
  const {
    specSelectors: { specJson },
  } = system

  const schemaKey = specJson().getIn(["securityDefinitions"]).findKey((v) => v.get("saml"))
  const schema = specJson().getIn(["securityDefinitions", schemaKey])

  return [schemaKey, schema]
}

let engaged = false
const samlAuthPlugin = () => {
  return {
    components: {
      samlAuth: SamlAuth,
      authorizationPopup: AuthorizationPopup
    },
    // authorize on saml response.
    // refer to https://github.com/swagger-api/swagger-ui/blob/master/src/core/plugins/on-complete/index.js
    statePlugins: {
      samlAuth: {
        actions,
        selectors,
        reducers,
      },
      spec: {
        wrapActions: {
          updateSpec:
            (ori) =>
            (...args) => {
              engaged = true
              return ori(...args)
            },
          updateJsonSpec:
            (ori, system) =>
            (...args) => {
              const authorize = () => {
                const [authId, schema] = getSamlSchema(system)

                const urlParams = new URLSearchParams(window.location.search)
                const samlToken = urlParams.get("SAMLToken")
                const samlError = urlParams.get("SAMLError")

                const { authSelectors, authActions, errActions, samlAuthActions } = system
                const authorizableDefinitions =authSelectors.definitionsToAuthorize()

                if(samlError) {
                  authActions.showDefinitions(authorizableDefinitions)
                  samlAuthActions.setSamlAuthState(actions.SAML_AUTH_STATE_FAILED)
                  errActions.newAuthErr({
                    authId,
                    level: "",
                    source: "auth",
                    message: samlError
                  })
                }
                else if (samlToken) {
                  authActions.showDefinitions(authorizableDefinitions)
                  samlAuthActions.authenticateWithSamlToken(
                    authId,
                    schema,
                    samlToken
                  )
                }
              }

              if (engaged) {
                setTimeout(authorize, 0)
                engaged = false
              }
              return ori(...args)
            },
        },
      },
    },
  }
}

export default samlAuthPlugin
