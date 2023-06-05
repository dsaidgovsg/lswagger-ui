import React from "react"
import PropTypes from "prop-types"
import DefinitionSelect from "./DefinitionSelect"

export default class AuthorizationPopup extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedDefinitionOption: null,
    }
  }

  close = () => {
    let { authActions, errActions } = this.props

    errActions.clear({ authId: "SamlAuth" })
    authActions.showDefinitions(false)
  };

  onSelectDefinition = (definition) => {
    this.setState({ selectedDefinitionOption: definition })
  };

  onClearSelectDefinition = () => {
    this.setState({ selectedDefinitionOption: null })
  };

  componentDidUpdate() {
    const { samlAuthSelectors } = this.props
    let isSamlAuthenticated =
      samlAuthSelectors.samlAuthState() ===
      "SAML_AUTH_STATE_LOGGED_IN"
    if (isSamlAuthenticated) {
      // unset url search
      this.close()
      window.history.pushState({}, document.title, window.location.pathname)
    }
  }

  render() {
    let {
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

    let { selectedDefinitionOption } = this.state
    let errors = errSelectors
      .allErrors()
      .filter((err) => err.get("authId") === "SamlAuth")
    let hasErrors = errors.size > 0
    let isAuthenticated = authorized.size > 0
    let authenticatedKey = authorized.keySeq().first()

    let selectedDefinitionKey = isAuthenticated ? authenticatedKey : selectedDefinitionOption

    let loginDisclaimer = specSelectors.spec().get("loginDisclaimer")

    let isSamlAuthenticating =
      samlAuthSelectors.samlAuthState() === "SAML_AUTH_STATE_LOGGING_IN"
    let showLoginOptions =
      !hasErrors && !isSamlAuthenticating && !selectedDefinitionKey
    let showLoginStep =
      !hasErrors &&
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
                {hasErrors &&
                  errors.map((error) => (
                    <div key={""} className="errors-wrapper">
                      {error.get("message")}
                    </div>
                  ))}
                {isSamlAuthenticating && (
                  <div className="error">Authenticating...</div>
                )}
                {showLoginOptions && (
                  <DefinitionSelect
                    definitions={definitions}
                    onSelect={this.onSelectDefinition}
                    getComponent={getComponent}
                  />
                )}
                {showLoginStep &&
                  definitions
                    .filter((definition) => {
                      const [key] = definition.keys()
                      return key === selectedDefinitionKey
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
                          getSystem={getSystem}
                        />
                      )
                    })}
                    <div className="login-disclaimer">{loginDisclaimer}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
  };
}
