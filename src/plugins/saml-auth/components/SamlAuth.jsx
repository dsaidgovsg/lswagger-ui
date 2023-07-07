import PropTypes from "prop-types"
import React from "react"

import {
  SAML_AUTH_STATE_LOGGING_IN,
  SAML_AUTH_STATE_LOGGING_OUT,
} from "../actions"

export class SamlAuth extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    authorized: PropTypes.object,
    getComponent: PropTypes.func.isRequired,
    schema: PropTypes.object.isRequired,
    samlAuthActions: PropTypes.object.isRequired,
    samlAuthSelectors: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { authorized, samlAuthActions } = this.props

    if (authorized.size === 0) {
      samlAuthActions.loginSaml()
    }
  }

  handleLogoutClick = () => {
    const { samlAuthActions, name } = this.props
    samlAuthActions.logoutSaml(name)
  };

  render() {
    const { name, getComponent, authorized, samlAuthSelectors } = this.props

    const Row = getComponent("Row")
    const Button = getComponent("Button")

    const isAuthenticated = authorized && authorized.get(name)
    const samlAuthState = samlAuthSelectors.samlAuthState()
    const isLoading =
      samlAuthState === SAML_AUTH_STATE_LOGGING_IN ||
      samlAuthState === SAML_AUTH_STATE_LOGGING_OUT
    const showLogoutButton = isAuthenticated && !isLoading

    return (
      <Row className="saml-auth">
        {isLoading && (
          <div className="loading-container saml-auth-info">
            <div className="loading"></div>
          </div>
        )}
        {showLogoutButton && (
          <div className="field">
            <div className="input-group">
            <Button
              className="btn modal-btn auth authorize"
              onClick={this.handleLogoutClick}
            >
              Logout
            </Button>
            </div>
          </div>
        )}
      </Row>
    )
  }
}

export default SamlAuth
