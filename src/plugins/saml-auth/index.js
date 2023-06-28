import SamlAuth from "./components/SamlAuth"
import AuthorizationPopup from "./components/AuthorizationPopup"
import * as actions from "./actions"
import * as selectors from "./selectors"
import reducers from "./reducers"

function getSamlSchema(system) {
  const {
    specSelectors: { specJson },
  } = system

  const definitionBase = ["securityDefinitions"]
  const schemaKey = specJson().getIn([...definitionBase]).findKey((v) => v.get("saml"))
  const schema = specJson().getIn([...definitionBase, schemaKey])

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
              if (!engaged) return ori(...args)

              const authorize = () => {
                // NOTE hardcode authId
                const [authId, schema] = getSamlSchema(system)

                const urlParams = new URLSearchParams(window.location.search)
                const samlToken = urlParams.get(schema.get("samlTokenName") || "SAMLToken")
                const samlError = urlParams.get(schema.get("samlErrorName") || "SAMLError")

                if (!samlToken && !samlError) return // guard

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
                    schema,
                    samlToken
                  )
                }
              }
              setTimeout(authorize, 0)
              engaged = false
              return ori(...args)
            },
        },
      },
    },
  }
}

export default samlAuthPlugin
