import React from "react"
import PropTypes from "prop-types"
import DefinitionSelect from "./DefinitionSelect"
import { SAML_AUTH_STATE_LOGGED_IN, SAML_AUTH_STATE_LOGGING_IN, SAML_AUTH_STATE_FAILED } from "../actions"

export default class AuthorizationPopup extends React.Component {
  static propTypes = {
    fn: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    authSelectors: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    errSelectors: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired,
    errActions: PropTypes.object.isRequired,
    samlAuthSelectors: PropTypes.object.isRequired,
    getSystem: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      selectedDefinitionOption: null,
    }
  }

  close = () => {
    const { authActions, errActions } = this.props

    errActions.clear({ type: "auth" })
    authActions.showDefinitions(false)
  };

  onSelectDefinition = (definition) => {
    const { errActions } = this.props

    errActions.clear({ type: "auth" })
    this.setState({ selectedDefinitionOption: definition })
  };

  componentDidUpdate() {
    const { samlAuthSelectors } = this.props
    const isSamlAuthenticated =
      samlAuthSelectors.samlAuthState() ===
      SAML_AUTH_STATE_LOGGED_IN
    const isSamlFailed = samlAuthSelectors.samlAuthState() === SAML_AUTH_STATE_FAILED
    if (isSamlAuthenticated) {
      // unset url search
      this.close()
      window.history.pushState({}, document.title, window.location.pathname)
    } else if(isSamlFailed) {
      window.history.pushState({}, document.title, window.location.pathname)
    }
  }

  render() {
    let {
      samlAuthActions,
      samlAuthSelectors,
      authSelectors,
      authActions,
      getComponent,
      errSelectors,
      specSelectors,
      getSystem,
      fn: { AST = {} },
    } = this.props
    let definitions = authSelectors.shownDefinitions()
    let authorized = authSelectors.authorized()

    let Auths = getComponent("auths")
    let loginDisclaimer = specSelectors.spec().get("loginDisclaimer")

    let { selectedDefinitionOption } = this.state
    let errors = errSelectors
      .allErrors()
      .filter((err) => err.get("authId") === "SamlAuth")
    let hasErrors = errors.size > 0
    let isAuthenticated = authorized.size > 0
    let authenticatedKey = authorized.keySeq().first()
    let selectedDefinitionKey = isAuthenticated ? authenticatedKey : selectedDefinitionOption

    let isSamlAuthenticating =
      samlAuthSelectors.samlAuthState() === SAML_AUTH_STATE_LOGGING_IN
    let showLoginOptions = !isSamlAuthenticating && !selectedDefinitionKey
    let showLoginAuth =
      !isSamlAuthenticating &&
      definitions &&
      !!selectedDefinitionKey

    return (
      <div className="dialog-ux">
        <div className="backdrop-ux"></div>
        <div className="modal-ux">
          <div className="modal-dialog-ux">
            <div className="modal-ux-inner">
              <div className="modal-ux-header">
                <h3>Authorization</h3>
                <button
                  type="button"
                  className="close-modal"
                  onClick={this.close}
                >
                  <svg width="20" height="20">
                    <use href="#close" xlinkHref="#close" />
                  </svg>
                </button>
              </div>
              <div className="modal-ux-content">

                {isSamlAuthenticating && (
                  <div className="loading-container saml-auth-info"><div className="loading"></div></div>
                )}
                {showLoginOptions && (
                  <DefinitionSelect
                    definitions={definitions}
                    onSelect={this.onSelectDefinition}
                    getComponent={getComponent}
                  />
                )}
                {hasErrors &&
                  errors.map((error, index) => (
                    <div key={index} className="login-error">
                      {error.get("message")}
                    </div>
                  ))}
                {showLoginAuth &&
                  definitions
                    .filter((definition) => {
                      const [authId] = definition.keys()
                      return authId === selectedDefinitionKey
                    })
                    .map((definition, key) => {
                      return (
                        <Auths
                          key={key}
                          AST={AST}
                          definitions={definition}
                          getComponent={getComponent}
                          errSelectors={errSelectors}
                          authSelectors={authSelectors}
                          authActions={authActions}
                          specSelectors={specSelectors}
                          samlAuthActions={samlAuthActions}
                        />
                      )
                    })}
                <div className="login-disclaimer-spacer"></div>
                <p className="login-disclaimer">{loginDisclaimer}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
