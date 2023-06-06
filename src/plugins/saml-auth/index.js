import SamlAuth from "./components/SamlAuth"
import WrappedSamlAuthItem from "./components/WrapAuthItem"
import AuthorizationPopup from "./components/AuthorizationPopup"
import * as actions from "./actions"
import * as selectors from "./selectors"
import reducers from "./reducers"

const getAuthToken = (search, authTokenSearchName = "token") => {
  return search
    .substring(1)
    .split("&")
    .reduce((queries, keyValue) => {
      const [key, value] = keyValue.split("=")
      return { ...queries, [key]: value }
    }, {})[authTokenSearchName]
}

function getSchema(system, key) {
  const {
    specSelectors: { specJson },
  } = system

  const definitionBase = ["securityDefinitions"]
  const schema = specJson().getIn([...definitionBase, key])

  return schema
}

let engaged = false
const samlAuthPlugin = () => {
  return {
    components: {
      SamlAuth,
      apiKeyAuth: WrappedSamlAuthItem,
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
              if (engaged) {
                const authorize = () => {
                  const schema = getSchema(system, "SamlAuth")
                  const samlToken = getAuthToken(
                    window.location.search,
                    schema.get("samlTokenName")
                  )
                  if (samlToken) {
                    const { authSelectors, authActions, samlAuthActions } = system
                    const authorizableDefinitions =
                      authSelectors.definitionsToAuthorize()

                    authActions.showDefinitions(authorizableDefinitions)
                    samlAuthActions.authenticateWithSAMLToken(
                      schema,
                      samlToken
                    )
                  }
                }
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
